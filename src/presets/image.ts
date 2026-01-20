import type { FFmpeg } from "../core/ffmpeg";
import { createPresetFFmpeg, type PresetOptions } from "./common";

export interface ImagePresetOptions {
  imageQuality?: number;
  size?: string;
  threads?: number;
}

export function screenshot(
  input: string,
  output: string,
  options: ImagePresetOptions & { time?: string | number } = {}
): FFmpeg {
  const presetOpts: PresetOptions = {};
  if (options.threads !== undefined) {
    presetOpts.threads = options.threads;
  }
  const ffmpeg = createPresetFFmpeg(presetOpts);
  const time = options.time ?? "00:00:01";

  ffmpeg
    .input(input)
    .seekInput(time)
    .output(output)
    .outputOptions("-vframes", "1");

  if (options.imageQuality) {
    ffmpeg.outputOptions("-q:v", options.imageQuality.toString());
  }

  if (options.size) {
    ffmpeg.size(options.size);
  }

  return ffmpeg;
}

export function screenshotGrid(
  input: string,
  output: string,
  options: ImagePresetOptions & {
    fps?: number | string;
    columns?: number;
    rows?: number;
  } = {}
): FFmpeg {
  const presetOpts: PresetOptions = {};
  if (options.threads !== undefined) {
    presetOpts.threads = options.threads;
  }
  const ffmpeg = createPresetFFmpeg(presetOpts);
  const fps = options.fps ?? "1/10";
  const columns = options.columns ?? 5;
  const rows = options.rows ?? 5;

  ffmpeg
    .input(input)
    .output(output)
    .videoFilter(`fps=${String(fps)},scale=320:-1,tile=${columns}x${rows}`)
    .outputOptions("-frames:v", "1");

  return ffmpeg;
}

export function toImageSequence(
  input: string,
  outputPattern: string,
  options: ImagePresetOptions & { fps?: number } = {}
): FFmpeg {
  const presetOpts: PresetOptions = {};
  if (options.threads !== undefined) {
    presetOpts.threads = options.threads;
  }
  const ffmpeg = createPresetFFmpeg(presetOpts);
  const fps = options.fps ?? 1;

  ffmpeg.input(input).output(outputPattern).fps(fps);

  if (options.imageQuality) {
    ffmpeg.outputOptions("-q:v", options.imageQuality.toString());
  }

  if (options.size) {
    ffmpeg.size(options.size);
  }

  return ffmpeg;
}

export function fromImageSequence(
  inputPattern: string,
  output: string,
  options: PresetOptions & { fps?: number; codec?: string } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);
  const fps = options.fps ?? 24;

  ffmpeg
    .input(inputPattern)
    .inputOptions("-framerate", fps.toString())
    .output(output)
    .videoCodec(options.codec ?? "libx264")
    .outputOptions("-pix_fmt", "yuv420p");

  return ffmpeg;
}

export function addWatermark(
  videoInput: string,
  watermarkInput: string,
  output: string,
  options: PresetOptions & {
    position?: "topleft" | "topright" | "bottomleft" | "bottomright" | "center";
    opacity?: number;
    margin?: number;
  } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);
  const position = options.position ?? "bottomright";
  const margin = options.margin ?? 10;
  const opacity = options.opacity ?? 1;

  const positions: Record<string, string> = {
    topleft: `${margin}:${margin}`,
    topright: `main_w-overlay_w-${margin}:${margin}`,
    bottomleft: `${margin}:main_h-overlay_h-${margin}`,
    bottomright: `main_w-overlay_w-${margin}:main_h-overlay_h-${margin}`,
    center: "(main_w-overlay_w)/2:(main_h-overlay_h)/2",
  };

  const pos: string = positions[position] ?? positions.bottomright ?? "";

  ffmpeg.input(videoInput).input(watermarkInput).output(output);

  if (opacity < 1) {
    ffmpeg.complexFilter(
      `[1:v]format=rgba,colorchannelmixer=aa=${opacity}[wm];[0:v][wm]overlay=${pos}`
    );
  } else {
    ffmpeg.complexFilter(`[0:v][1:v]overlay=${pos}`);
  }

  ffmpeg.videoCodec("libx264").audioCodec("copy");

  return ffmpeg;
}

export function createPoster(
  input: string,
  output: string,
  options: {
    time?: string | number;
    width?: number;
    height?: number;
    imageQuality?: number;
  } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg();
  const time = options.time ?? "00:00:05";
  const width = options.width ?? 1280;
  const height = options.height ?? 720;

  ffmpeg
    .input(input)
    .seekInput(time)
    .output(output)
    .outputOptions("-vframes", "1")
    .videoFilter(
      `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`
    );

  if (options.imageQuality) {
    ffmpeg.outputOptions("-q:v", options.imageQuality.toString());
  }

  return ffmpeg;
}

export function createGif(
  input: string,
  output: string,
  options: {
    start?: string | number;
    duration?: number;
    fps?: number;
    width?: number;
    loop?: number;
  } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg();
  const fps = options.fps ?? 10;
  const width = options.width ?? 480;
  const loop = options.loop ?? 0;

  if (options.start) {
    ffmpeg.seekInput(options.start);
  }

  ffmpeg.input(input).output(output);

  if (options.duration) {
    ffmpeg.duration(options.duration);
  }

  ffmpeg
    .complexFilter(
      `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer`
    )
    .outputOptions("-loop", loop.toString());

  return ffmpeg;
}
