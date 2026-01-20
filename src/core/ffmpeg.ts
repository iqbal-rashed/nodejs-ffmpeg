/**
 * FFmpeg command builder with fluent API
 */

import { EventEmitter } from "node:events";
import type { ChildProcess } from "node:child_process";
import { getFFmpegPath } from "../binary/paths";
import { spawnStreamingProcess, killProcess } from "../utils/process";
import { parseProgress, calculatePercent } from "../utils/progress";
import { FFmpegExitError } from "../utils/errors";
import { validatePath } from "../utils/validation";
import type {
  FFmpegOptions,
  ProgressInfo,
  FFmpegResult,
  FFmpegInput,
  FFmpegOutput,
  ConvertOptions,
  ExtractAudioOptions,
  ScreenshotOptions,
  TrimOptions,
  CompressOptions,
  MergeOptions,
  ConcatOptions,
  GifOptions,
  WatermarkOptions,
  SpeedOptions,
  RotateOptions,
} from "../types";

export interface FFmpegEvents {
  start: [command: string];
  progress: [progress: ProgressInfo];
  stderr: [line: string];
  error: [error: Error];
  end: [result: FFmpegResult];
}

/**
 * FFmpeg command builder with fluent API
 *
 * @example
 * ```typescript
 * const ffmpeg = new FFmpeg();
 *
 * await ffmpeg
 *   .input('input.mp4')
 *   .output('output.webm')
 *   .videoCodec('libvpx-vp9')
 *   .audioCodec('libopus')
 *   .on('progress', (p) => console.log(`${p.percent}%`))
 *   .run();
 * ```
 */
export class FFmpeg extends EventEmitter<FFmpegEvents> {
  private readonly ffmpegPath: string;
  private readonly globalOptions: FFmpegOptions;
  private readonly inputs: FFmpegInput[] = [];
  private readonly outputs: FFmpegOutput[] = [];
  private readonly globalArgs: string[] = [];
  private currentOutputArgs: string[] = [];
  private inputDuration?: number;
  private process?: ChildProcess;

  constructor(options: FFmpegOptions = {}) {
    super();
    this.ffmpegPath = options.ffmpegPath ?? getFFmpegPath();
    this.globalOptions = options;
  }

  /**
   * Add an input file or URL
   */
  input(source: string, options: string[] = []): this {
    validatePath(source, "Input source");
    this.inputs.push({ source, options });
    return this;
  }

  /**
   * Add input options for the last added input
   */
  inputOptions(...options: string[]): this {
    const lastInput = this.inputs[this.inputs.length - 1];
    if (lastInput) {
      lastInput.options = [...(lastInput.options ?? []), ...options];
    }
    return this;
  }

  /**
   * Set seek position for input
   */
  seekInput(time: string | number): this {
    const timeStr = typeof time === "number" ? time.toString() : time;
    return this.inputOptions("-ss", timeStr);
  }

  /**
   * Add an output file
   */
  output(destination: string): this {
    validatePath(destination, "Output destination");
    // Save current output args to previous output if exists
    if (this.outputs.length > 0) {
      const lastOutput = this.outputs[this.outputs.length - 1];
      if (lastOutput) {
        lastOutput.options = [
          ...(lastOutput.options ?? []),
          ...this.currentOutputArgs,
        ];
      }
    }
    this.outputs.push({ destination, options: [] });
    this.currentOutputArgs = [];
    return this;
  }

  /**
   * Add output options
   */
  outputOptions(...options: string[]): this {
    this.currentOutputArgs.push(...options);
    return this;
  }

  /**
   * Set output format
   */
  format(fmt: string): this {
    return this.outputOptions("-f", fmt);
  }

  /**
   * Set video codec
   */
  videoCodec(codec: string): this {
    return this.outputOptions("-c:v", codec);
  }

  /**
   * Set audio codec
   */
  audioCodec(codec: string): this {
    return this.outputOptions("-c:a", codec);
  }

  /**
   * Set video bitrate
   */
  videoBitrate(bitrate: string): this {
    return this.outputOptions("-b:v", bitrate);
  }

  /**
   * Set audio bitrate
   */
  audioBitrate(bitrate: string): this {
    return this.outputOptions("-b:a", bitrate);
  }

  /**
   * Set video size/resolution
   */
  size(size: string): this {
    return this.outputOptions("-s", size);
  }

  /**
   * Set video frame rate
   */
  fps(rate: number): this {
    return this.outputOptions("-r", rate.toString());
  }

  /**
   * Set audio sample rate
   */
  audioFrequency(freq: number): this {
    return this.outputOptions("-ar", freq.toString());
  }

  /**
   * Set audio channels
   */
  audioChannels(channels: number): this {
    return this.outputOptions("-ac", channels.toString());
  }

  /**
   * Set duration limit
   */
  duration(time: string | number): this {
    const timeStr = typeof time === "number" ? time.toString() : time;
    return this.outputOptions("-t", timeStr);
  }

  /**
   * Seek to position in output
   */
  seek(time: string | number): this {
    const timeStr = typeof time === "number" ? time.toString() : time;
    return this.outputOptions("-ss", timeStr);
  }

  /**
   * Add video filter
   */
  videoFilter(filter: string): this {
    return this.outputOptions("-vf", filter);
  }

  /**
   * Add audio filter
   */
  audioFilter(filter: string): this {
    return this.outputOptions("-af", filter);
  }

  /**
   * Add complex filter
   */
  complexFilter(filter: string): this {
    return this.outputOptions("-filter_complex", filter);
  }

  /**
   * Add custom arguments
   */
  addOptions(...options: string[]): this {
    return this.outputOptions(...options);
  }

  /**
   * Disable video
   */
  noVideo(): this {
    return this.outputOptions("-vn");
  }

  /**
   * Disable audio
   */
  noAudio(): this {
    return this.outputOptions("-an");
  }

  /**
   * Set number of threads
   */
  threads(count: number): this {
    this.globalArgs.push("-threads", count.toString());
    return this;
  }

  /**
   * Overwrite output file without asking
   */
  overwrite(): this {
    this.globalArgs.push("-y");
    return this;
  }

  /**
   * Set input duration for progress calculation
   */
  setDuration(seconds: number): this {
    this.inputDuration = seconds;
    return this;
  }

  /**
   * Build the FFmpeg command arguments
   */
  buildArgs(): string[] {
    const args: string[] = [];

    // Add global args
    args.push(...this.globalArgs);

    // Hide banner
    args.push("-hide_banner");

    // Add inputs
    for (const input of this.inputs) {
      if (input.options) {
        args.push(...input.options);
      }
      args.push("-i", input.source);
    }

    // Apply pending output options to last output
    if (this.outputs.length > 0 && this.currentOutputArgs.length > 0) {
      const lastOutput = this.outputs[this.outputs.length - 1];
      if (lastOutput) {
        lastOutput.options = [
          ...(lastOutput.options ?? []),
          ...this.currentOutputArgs,
        ];
      }
    }

    // Add outputs
    for (const output of this.outputs) {
      if (output.options) {
        args.push(...output.options);
      }
      args.push(output.destination);
    }

    return args;
  }

  /**
   * Get the full command string
   */
  getCommand(): string {
    const args = this.buildArgs();
    return `${this.ffmpegPath} ${args.join(" ")}`;
  }

  /**
   * Run the FFmpeg command
   */
  async run(): Promise<FFmpegResult> {
    const args = this.buildArgs();
    const command = this.getCommand();
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      this.process = spawnStreamingProcess(this.ffmpegPath, args, {
        cwd: this.globalOptions.cwd,
      });

      this.emit("start", command);

      let stderr = "";

      this.process.stderr?.on("data", (data: Buffer) => {
        const line = data.toString();
        stderr += line;
        this.emit("stderr", line);

        // Parse progress
        const progress = parseProgress(line);
        if (progress) {
          if (this.inputDuration) {
            progress.percent = calculatePercent(
              progress.timemark,
              this.inputDuration
            );
          }
          this.emit("progress", progress);
        }
      });

      this.process.on("error", (error) => {
        this.emit("error", error);
        reject(error);
      });

      this.process.on("close", (code) => {
        const duration = Date.now() - startTime;
        const exitCode = code ?? 0;

        if (exitCode !== 0) {
          const error = new FFmpegExitError(exitCode, stderr, command);
          this.emit("error", error);
          reject(error);
          return;
        }

        const result: FFmpegResult = {
          exitCode,
          command,
          duration,
        };

        this.emit("end", result);
        resolve(result);
      });
    });
  }

  /**
   * Kill the running FFmpeg process
   */
  async kill(): Promise<void> {
    if (this.process) {
      await killProcess(this.process);
    }
  }

  /**
   * Create a new FFmpeg instance with the same options
   */
  clone(): FFmpeg {
    return new FFmpeg(this.globalOptions);
  }

  /**
   * Convert a file using object-based options
   * This provides an alternative to the fluent API
   *
   * @example
   * ```typescript
   * const ffmpeg = new FFmpeg();
   * await ffmpeg.convert({
   *   input: 'input.mp4',
   *   output: 'output.webm',
   *   videoCodec: 'libvpx-vp9',
   *   audioCodec: 'libopus',
   *   crf: 28,
   *   onProgress: (p) => console.log(p.percent + '%'),
   * });
   * ```
   */
  async convert(options: ConvertOptions): Promise<FFmpegResult> {
    const ffmpeg = new FFmpeg(this.globalOptions);

    // Input options
    if (options.hwAccel) {
      ffmpeg.inputOptions("-hwaccel", options.hwAccel);
    }
    if (options.seek) {
      ffmpeg.seekInput(options.seek);
    }
    if (options.inputOptions) {
      ffmpeg.inputOptions(...options.inputOptions);
    }

    // Add input
    ffmpeg.input(options.input);

    // Add output
    ffmpeg.output(options.output);

    // Format
    if (options.format) {
      ffmpeg.format(options.format);
    }

    // Video options
    if (options.videoCodec) {
      ffmpeg.videoCodec(options.videoCodec);
    }
    if (options.videoBitrate) {
      ffmpeg.videoBitrate(options.videoBitrate);
    }
    if (options.crf !== undefined) {
      ffmpeg.outputOptions("-crf", options.crf.toString());
    }
    if (options.preset) {
      ffmpeg.outputOptions("-preset", options.preset);
    }
    if (options.profile) {
      ffmpeg.outputOptions("-profile:v", options.profile);
    }
    if (options.level) {
      ffmpeg.outputOptions("-level", options.level);
    }
    if (options.tune) {
      ffmpeg.outputOptions("-tune", options.tune);
    }
    if (options.size) {
      ffmpeg.size(options.size);
    } else if (options.width && options.height) {
      ffmpeg.size(`${options.width}x${options.height}`);
    }
    if (options.scale) {
      ffmpeg.videoFilter(`scale=${options.scale}`);
    }
    if (options.fps) {
      ffmpeg.fps(options.fps);
    }
    if (options.aspectRatio) {
      ffmpeg.outputOptions("-aspect", options.aspectRatio);
    }
    if (options.pixelFormat) {
      ffmpeg.outputOptions("-pix_fmt", options.pixelFormat);
    }
    if (options.frames) {
      ffmpeg.outputOptions("-frames:v", options.frames.toString());
    }
    if (options.gopSize) {
      ffmpeg.outputOptions("-g", options.gopSize.toString());
    }
    if (options.maxBitrate) {
      ffmpeg.outputOptions("-maxrate", options.maxBitrate);
    }
    if (options.bufferSize) {
      ffmpeg.outputOptions("-bufsize", options.bufferSize);
    }

    // Audio options
    if (options.audioCodec) {
      ffmpeg.audioCodec(options.audioCodec);
    }
    if (options.audioBitrate) {
      ffmpeg.audioBitrate(options.audioBitrate);
    }
    if (options.sampleRate) {
      ffmpeg.audioFrequency(options.sampleRate);
    }
    if (options.channels) {
      ffmpeg.audioChannels(options.channels);
    }
    if (options.audioQuality !== undefined) {
      ffmpeg.outputOptions("-q:a", options.audioQuality.toString());
    }
    if (options.volume) {
      ffmpeg.audioFilter(`volume=${options.volume}`);
    }

    // Filters
    if (options.videoFilter) {
      ffmpeg.videoFilter(options.videoFilter);
    }
    if (options.videoFilters && options.videoFilters.length > 0) {
      ffmpeg.videoFilter(options.videoFilters.join(","));
    }
    if (options.audioFilter) {
      ffmpeg.audioFilter(options.audioFilter);
    }
    if (options.audioFilters && options.audioFilters.length > 0) {
      ffmpeg.audioFilter(options.audioFilters.join(","));
    }
    if (options.complexFilter) {
      ffmpeg.complexFilter(options.complexFilter);
    }

    // Stream selection
    if (options.noVideo) {
      ffmpeg.noVideo();
    }
    if (options.noAudio) {
      ffmpeg.noAudio();
    }
    if (options.noSubtitles) {
      ffmpeg.outputOptions("-sn");
    }
    if (options.map) {
      for (const m of options.map) {
        ffmpeg.outputOptions("-map", m);
      }
    }

    // Metadata
    if (options.metadata) {
      for (const [key, value] of Object.entries(options.metadata)) {
        ffmpeg.outputOptions("-metadata", `${key}=${value}`);
      }
    }
    if (options.copyMetadata) {
      ffmpeg.outputOptions("-map_metadata", "0");
    }

    // HLS options
    if (options.hlsTime) {
      ffmpeg.outputOptions("-hls_time", options.hlsTime.toString());
    }
    if (options.hlsPlaylistType) {
      ffmpeg.outputOptions("-hls_playlist_type", options.hlsPlaylistType);
    }
    if (options.hlsListSize !== undefined) {
      ffmpeg.outputOptions("-hls_list_size", options.hlsListSize.toString());
    }
    if (options.hlsSegmentFilename) {
      ffmpeg.outputOptions("-hls_segment_filename", options.hlsSegmentFilename);
    }

    // DASH options
    if (options.dashSegDuration) {
      ffmpeg.outputOptions("-seg_duration", options.dashSegDuration.toString());
    }

    // Duration/timing
    if (options.duration) {
      ffmpeg.duration(options.duration);
    }
    if (options.endTime) {
      ffmpeg.outputOptions(
        "-to",
        typeof options.endTime === "number"
          ? options.endTime.toString()
          : options.endTime
      );
    }

    // General options
    if (options.overwrite !== false) {
      ffmpeg.overwrite();
    }
    if (options.threads) {
      ffmpeg.threads(options.threads);
    }
    if (options.outputOptions) {
      ffmpeg.outputOptions(...options.outputOptions);
    }

    // Duration for progress
    if (options.inputDuration) {
      ffmpeg.setDuration(options.inputDuration);
    }

    // Event handlers
    if (options.onStart) {
      ffmpeg.on("start", options.onStart);
    }
    if (options.onProgress) {
      ffmpeg.on("progress", options.onProgress);
    }
    if (options.onStderr) {
      ffmpeg.on("stderr", options.onStderr);
    }

    return ffmpeg.run();
  }
}

/**
 * Factory function to create FFmpeg instance
 */
export function createFFmpeg(options?: FFmpegOptions): FFmpeg {
  return new FFmpeg(options);
}

/**
 * Standalone convert function for quick conversions
 *
 * @example
 * ```typescript
 * import { convert } from 'nodejs-ffmpeg';
 *
 * await convert({
 *   input: 'input.mp4',
 *   output: 'output.webm',
 *   videoCodec: 'libvpx-vp9',
 *   audioBitrate: '128k',
 * });
 * ```
 */
export async function convert(options: ConvertOptions): Promise<FFmpegResult> {
  const ffmpeg = new FFmpeg();
  return ffmpeg.convert(options);
}

/**
 * Extract audio from a video file
 */
export async function extractAudio(
  options: ExtractAudioOptions
): Promise<FFmpegResult> {
  const ffmpeg = new FFmpeg();

  if (options.seek) {
    ffmpeg.seekInput(options.seek);
  }

  ffmpeg.input(options.input).output(options.output).noVideo();

  // Determine codec based on format or explicit codec
  const codecMap: Record<string, string> = {
    mp3: "libmp3lame",
    aac: "aac",
    opus: "libopus",
    flac: "flac",
    wav: "pcm_s16le",
    ogg: "libvorbis",
  };
  const format = options.format ?? "mp3";
  const codec = options.codec ?? codecMap[format] ?? "libmp3lame";

  ffmpeg.audioCodec(codec);

  if (options.bitrate) {
    ffmpeg.audioBitrate(options.bitrate);
  }
  if (options.sampleRate) {
    ffmpeg.audioFrequency(options.sampleRate);
  }
  if (options.channels) {
    ffmpeg.audioChannels(options.channels);
  }
  if (options.volume) {
    ffmpeg.audioFilter(`volume=${options.volume}`);
  }
  if (options.duration) {
    ffmpeg.duration(options.duration);
  }
  if (options.overwrite !== false) {
    ffmpeg.overwrite();
  }
  if (options.onProgress) {
    ffmpeg.on("progress", options.onProgress);
  }

  return ffmpeg.run();
}

/**
 * Take a screenshot from a video
 */
export async function takeScreenshot(
  options: ScreenshotOptions
): Promise<FFmpegResult> {
  const ffmpeg = new FFmpeg();

  const time = options.time ?? 0;
  ffmpeg.seekInput(time).input(options.input).output(options.output);

  ffmpeg.outputOptions("-vframes", "1");

  if (options.size) {
    ffmpeg.size(options.size);
  } else if (options.width && options.height) {
    ffmpeg.size(`${options.width}x${options.height}`);
  } else if (options.width) {
    ffmpeg.videoFilter(`scale=${options.width}:-1`);
  } else if (options.height) {
    ffmpeg.videoFilter(`scale=-1:${options.height}`);
  }

  if (options.quality) {
    ffmpeg.outputOptions("-q:v", options.quality.toString());
  }

  if (options.overwrite !== false) {
    ffmpeg.overwrite();
  }

  return ffmpeg.run();
}

/**
 * Trim a video to a specific time range
 */
export async function trim(options: TrimOptions): Promise<FFmpegResult> {
  const ffmpeg = new FFmpeg();

  ffmpeg.seekInput(options.start).input(options.input).output(options.output);

  if (options.duration) {
    ffmpeg.duration(options.duration);
  } else if (options.end) {
    ffmpeg.outputOptions(
      "-to",
      typeof options.end === "number" ? options.end.toString() : options.end
    );
  }

  if (options.copy !== false) {
    ffmpeg.videoCodec(options.videoCodec ?? "copy");
    ffmpeg.audioCodec(options.audioCodec ?? "copy");
  } else {
    if (options.videoCodec) ffmpeg.videoCodec(options.videoCodec);
    if (options.audioCodec) ffmpeg.audioCodec(options.audioCodec);
  }

  if (options.overwrite !== false) {
    ffmpeg.overwrite();
  }
  if (options.onProgress) {
    ffmpeg.on("progress", options.onProgress);
  }

  return ffmpeg.run();
}

/**
 * Compress a video to reduce file size
 */
export async function compress(
  options: CompressOptions
): Promise<FFmpegResult> {
  const ffmpeg = new FFmpeg();

  ffmpeg.input(options.input).output(options.output).videoCodec("libx264");

  // Quality presets
  const crfMap = { low: 35, medium: 28, high: 23, best: 18 };
  const crf = options.crf ?? crfMap[options.quality ?? "medium"];
  ffmpeg.outputOptions("-crf", crf.toString());

  if (options.preset) {
    ffmpeg.outputOptions("-preset", options.preset);
  }
  if (options.maxBitrate) {
    ffmpeg.outputOptions("-maxrate", options.maxBitrate);
    ffmpeg.outputOptions(
      "-bufsize",
      options.maxBitrate.replace(/[kKmM]$/, (m) =>
        m.toLowerCase() === "k" ? "k" : "M"
      )
    );
  }
  if (options.scale) {
    ffmpeg.videoFilter(`scale=${options.scale}`);
  }
  if (options.fps) {
    ffmpeg.fps(options.fps);
  }

  ffmpeg.audioCodec("aac");
  if (options.audioBitrate) {
    ffmpeg.audioBitrate(options.audioBitrate);
  }

  if (options.overwrite !== false) {
    ffmpeg.overwrite();
  }
  if (options.onProgress) {
    ffmpeg.on("progress", options.onProgress);
  }

  return ffmpeg.run();
}

/**
 * Merge a video and audio file
 */
export async function merge(options: MergeOptions): Promise<FFmpegResult> {
  const ffmpeg = new FFmpeg();

  ffmpeg
    .input(options.videoInput)
    .input(options.audioInput)
    .output(options.output);

  ffmpeg.outputOptions("-map", "0:v:0", "-map", "1:a:0");

  ffmpeg.videoCodec(options.videoCodec ?? "copy");
  ffmpeg.audioCodec(options.audioCodec ?? "copy");

  if (options.shortest) {
    ffmpeg.outputOptions("-shortest");
  }

  if (options.overwrite !== false) {
    ffmpeg.overwrite();
  }
  if (options.onProgress) {
    ffmpeg.on("progress", options.onProgress);
  }

  return ffmpeg.run();
}

/**
 * Concatenate multiple video files
 */
export async function concat(options: ConcatOptions): Promise<FFmpegResult> {
  const ffmpeg = new FFmpeg();

  if (options.method === "filter") {
    // Filter method: re-encodes but handles different codecs
    for (const input of options.inputs) {
      ffmpeg.input(input);
    }

    const filterInputs = options.inputs
      .map((_, i) => `[${i}:v][${i}:a]`)
      .join("");
    ffmpeg.complexFilter(
      `${filterInputs}concat=n=${options.inputs.length}:v=1:a=1[outv][outa]`
    );
    ffmpeg.outputOptions("-map", "[outv]", "-map", "[outa]");

    ffmpeg.videoCodec(options.videoCodec ?? "libx264");
    ffmpeg.audioCodec(options.audioCodec ?? "aac");
  } else {
    // Demuxer method: fast but requires same codec
    const listContent = options.inputs.map((f) => `file '${f}'`).join("\n");
    ffmpeg.inputOptions("-f", "concat", "-safe", "0");
    ffmpeg.input(
      `data:text/plain;base64,${Buffer.from(listContent).toString("base64")}`
    );
    ffmpeg.videoCodec("copy");
    ffmpeg.audioCodec("copy");
  }

  ffmpeg.output(options.output);

  if (options.overwrite !== false) {
    ffmpeg.overwrite();
  }
  if (options.onProgress) {
    ffmpeg.on("progress", options.onProgress);
  }

  return ffmpeg.run();
}

/**
 * Create a GIF from a video
 */
export async function toGif(options: GifOptions): Promise<FFmpegResult> {
  const ffmpeg = new FFmpeg();

  if (options.start) {
    ffmpeg.seekInput(options.start);
  }

  ffmpeg.input(options.input).output(options.output);

  if (options.duration) {
    ffmpeg.duration(options.duration);
  }

  const fps = options.fps ?? 10;
  const width = options.width ?? 320;

  ffmpeg.complexFilter(
    `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`
  );

  if (options.loop !== undefined) {
    ffmpeg.outputOptions("-loop", options.loop.toString());
  }

  if (options.overwrite !== false) {
    ffmpeg.overwrite();
  }
  if (options.onProgress) {
    ffmpeg.on("progress", options.onProgress);
  }

  return ffmpeg.run();
}

/**
 * Add a watermark to a video
 */
export async function addWatermark(
  options: WatermarkOptions
): Promise<FFmpegResult> {
  const ffmpeg = new FFmpeg();

  ffmpeg.input(options.input).input(options.watermark).output(options.output);

  // Calculate position
  let overlayPos = "10:10";
  const x = options.x ?? 10;
  const y = options.y ?? 10;

  switch (options.position) {
    case "topright":
      overlayPos = `main_w-overlay_w-${x}:${y}`;
      break;
    case "bottomleft":
      overlayPos = `${x}:main_h-overlay_h-${y}`;
      break;
    case "bottomright":
      overlayPos = `main_w-overlay_w-${x}:main_h-overlay_h-${y}`;
      break;
    case "center":
      overlayPos = "(main_w-overlay_w)/2:(main_h-overlay_h)/2";
      break;
    default:
      overlayPos = `${x}:${y}`;
  }

  let filter = `[1:v]`;
  if (options.scale) {
    filter += `scale=iw*${options.scale}:ih*${options.scale}`;
  }
  if (options.opacity && options.opacity < 1) {
    filter += `${options.scale ? "," : ""}format=rgba,colorchannelmixer=aa=${options.opacity}`;
  }
  filter += `[wm];[0:v][wm]overlay=${overlayPos}`;

  ffmpeg.complexFilter(filter);
  ffmpeg.videoCodec("libx264");
  ffmpeg.audioCodec("copy");

  if (options.overwrite !== false) {
    ffmpeg.overwrite();
  }
  if (options.onProgress) {
    ffmpeg.on("progress", options.onProgress);
  }

  return ffmpeg.run();
}

/**
 * Change the playback speed of a video
 */
export async function changeSpeed(
  options: SpeedOptions
): Promise<FFmpegResult> {
  const ffmpeg = new FFmpeg();

  ffmpeg.input(options.input).output(options.output);

  // Video speed: setpts filter with inverse of speed
  const videoPts = 1 / options.speed;
  ffmpeg.videoFilter(`setpts=${videoPts}*PTS`);

  // Audio speed: atempo filter (limited to 0.5-2.0 range per filter)
  if (options.adjustAudio !== false) {
    if (options.speed >= 0.5 && options.speed <= 2.0) {
      ffmpeg.audioFilter(`atempo=${options.speed}`);
    } else if (options.speed > 2.0) {
      // Chain multiple atempo filters for speeds > 2
      const atempos = [];
      let remaining = options.speed;
      while (remaining > 2.0) {
        atempos.push("atempo=2.0");
        remaining /= 2.0;
      }
      atempos.push(`atempo=${remaining}`);
      ffmpeg.audioFilter(atempos.join(","));
    } else {
      // Chain for speeds < 0.5
      const atempos = [];
      let remaining = options.speed;
      while (remaining < 0.5) {
        atempos.push("atempo=0.5");
        remaining *= 2.0;
      }
      atempos.push(`atempo=${remaining}`);
      ffmpeg.audioFilter(atempos.join(","));
    }
  }

  ffmpeg.videoCodec("libx264");
  ffmpeg.audioCodec("aac");

  if (options.overwrite !== false) {
    ffmpeg.overwrite();
  }
  if (options.onProgress) {
    ffmpeg.on("progress", options.onProgress);
  }

  return ffmpeg.run();
}

/**
 * Rotate a video
 */
export async function rotate(options: RotateOptions): Promise<FFmpegResult> {
  const ffmpeg = new FFmpeg();

  ffmpeg.input(options.input).output(options.output);

  let filter: string;
  switch (options.angle) {
    case 90:
    case "cw":
      filter = "transpose=1";
      break;
    case 270:
    case "ccw":
      filter = "transpose=2";
      break;
    case 180:
      filter = "transpose=1,transpose=1";
      break;
    case "flip":
      filter = "hflip";
      break;
    case "vflip":
      filter = "vflip";
      break;
    default:
      filter = "transpose=1";
  }

  ffmpeg.videoFilter(filter);
  ffmpeg.videoCodec("libx264");
  ffmpeg.audioCodec("copy");

  if (options.overwrite !== false) {
    ffmpeg.overwrite();
  }
  if (options.onProgress) {
    ffmpeg.on("progress", options.onProgress);
  }

  return ffmpeg.run();
}

/**
 * Options for running a custom FFmpeg command
 */
export interface RunCommandOptions {
  /**
   * Raw FFmpeg arguments (excluding the ffmpeg binary path)
   */
  args: string[];

  /**
   * Custom ffmpeg binary path (optional)
   */
  ffmpegPath?: string;

  /**
   * Current working directory
   */
  cwd?: string;

  /**
   * Progress callback
   */
  onProgress?: (progress: ProgressInfo) => void;

  /**
   * Start callback
   */
  onStart?: (command: string) => void;

  /**
   * Stderr callback
   */
  onStderr?: (line: string) => void;

  /**
   * Input duration for progress calculation
   */
  inputDuration?: number;
}

/**
 * Run a custom FFmpeg command with raw arguments
 *
 * @example
 * ```typescript
 * import { runCommand } from 'nodejs-ffmpeg';
 *
 * // Run any FFmpeg command
 * await runCommand({
 *   args: ['-i', 'input.mp4', '-vf', 'scale=1280:-1', '-c:a', 'copy', 'output.mp4'],
 *   onProgress: (p) => console.log(p.timemark),
 * });
 *
 * // Complex filtergraph
 * await runCommand({
 *   args: [
 *     '-i', 'video.mp4',
 *     '-i', 'overlay.png',
 *     '-filter_complex', '[0:v][1:v]overlay=10:10[v]',
 *     '-map', '[v]',
 *     '-map', '0:a',
 *     '-y', 'output.mp4'
 *   ],
 * });
 * ```
 */
export async function runCommand(
  options: RunCommandOptions
): Promise<FFmpegResult> {
  const ffmpegPath = options.ffmpegPath ?? getFFmpegPath();
  const args = ["-hide_banner", ...options.args];
  const command = `${ffmpegPath} ${args.join(" ")}`;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const process = spawnStreamingProcess(ffmpegPath, args, {
      cwd: options.cwd,
    });

    if (options.onStart) {
      options.onStart(command);
    }

    let stderr = "";

    process.stderr?.on("data", (data: Buffer) => {
      const line = data.toString();
      stderr += line;

      if (options.onStderr) {
        options.onStderr(line);
      }

      // Parse progress
      const progress = parseProgress(line);
      if (progress && options.onProgress) {
        if (options.inputDuration) {
          progress.percent = calculatePercent(
            progress.timemark,
            options.inputDuration
          );
        }
        options.onProgress(progress);
      }
    });

    process.on("error", (error) => {
      reject(error);
    });

    process.on("close", (code) => {
      const duration = Date.now() - startTime;
      const exitCode = code ?? 0;

      if (exitCode !== 0) {
        reject(new FFmpegExitError(exitCode, stderr, command));
        return;
      }

      resolve({
        exitCode,
        command,
        duration,
      });
    });
  });
}

/**
 * Parse a command string into arguments array
 * Handles quoted strings properly
 */
export function parseCommand(command: string): string[] {
  const args: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (const char of command) {
    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = "";
    } else if (char === " " && !inQuote) {
      if (current) {
        args.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) {
    args.push(current);
  }

  return args;
}

/**
 * Run a command from a string (like you would type in terminal)
 *
 * @example
 * ```typescript
 * import { runCommandString } from 'nodejs-ffmpeg';
 *
 * await runCommandString('-i input.mp4 -vf "scale=1280:-1" -y output.mp4');
 * ```
 */
export async function runCommandString(
  command: string,
  options: Omit<RunCommandOptions, "args"> = {}
): Promise<FFmpegResult> {
  // Remove leading 'ffmpeg' if present
  const trimmed = command.trim().replace(/^ffmpeg\s+/, "");
  const args = parseCommand(trimmed);
  return runCommand({ ...options, args });
}
