import type { FFmpeg } from "../core/ffmpeg";
import {
  createPresetFFmpeg,
  getCRF,
  getAudioBitrate,
  type PresetOptions,
} from "./common";

export interface VideoPresetOptions extends PresetOptions {
  resolution?: string;
  fps?: number;
}

export function toMP4(
  input: string,
  output: string,
  options: VideoPresetOptions = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);

  ffmpeg
    .input(input)
    .output(output)
    .videoCodec("libx264")
    .audioCodec("aac")
    .outputOptions("-crf", getCRF(options.quality).toString())
    .audioBitrate(getAudioBitrate(options.quality))
    .outputOptions("-preset", "medium")
    .outputOptions("-movflags", "+faststart");

  if (options.resolution) {
    ffmpeg.size(options.resolution);
  }

  if (options.fps) {
    ffmpeg.fps(options.fps);
  }

  return ffmpeg;
}

export function toWebM(
  input: string,
  output: string,
  options: VideoPresetOptions = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);

  ffmpeg
    .input(input)
    .output(output)
    .videoCodec("libvpx-vp9")
    .audioCodec("libopus")
    .outputOptions("-crf", getCRF(options.quality).toString())
    .outputOptions("-b:v", "0")
    .audioBitrate(getAudioBitrate(options.quality));

  if (options.resolution) {
    ffmpeg.size(options.resolution);
  }

  if (options.fps) {
    ffmpeg.fps(options.fps);
  }

  return ffmpeg;
}

export function toHEVC(
  input: string,
  output: string,
  options: VideoPresetOptions = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);

  ffmpeg
    .input(input)
    .output(output)
    .videoCodec("libx265")
    .audioCodec("aac")
    .outputOptions("-crf", getCRF(options.quality).toString())
    .audioBitrate(getAudioBitrate(options.quality))
    .outputOptions("-preset", "medium")
    .outputOptions("-tag:v", "hvc1");

  if (options.resolution) {
    ffmpeg.size(options.resolution);
  }

  if (options.fps) {
    ffmpeg.fps(options.fps);
  }

  return ffmpeg;
}

export function toGif(
  input: string,
  output: string,
  options: VideoPresetOptions & { width?: number } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);
  const width = options.width ?? 480;
  const fps = options.fps ?? 10;

  ffmpeg
    .input(input)
    .output(output)
    .complexFilter(
      `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`
    );

  return ffmpeg;
}

export function extractThumbnail(
  input: string,
  output: string,
  options: { time?: string | number; size?: string } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg();
  const time = options.time ?? "00:00:01";

  ffmpeg
    .input(input)
    .seekInput(time)
    .output(output)
    .outputOptions("-vframes", "1");

  if (options.size) {
    ffmpeg.size(options.size);
  }

  return ffmpeg;
}

export function trimVideo(
  input: string,
  output: string,
  options: {
    start: string | number;
    duration?: string | number;
    end?: string | number;
  }
): FFmpeg {
  const ffmpeg = createPresetFFmpeg();

  ffmpeg.input(input).seekInput(options.start).output(output);

  if (options.duration) {
    ffmpeg.duration(options.duration);
  } else if (options.end) {
    ffmpeg.outputOptions("-to", options.end.toString());
  }

  ffmpeg.videoCodec("copy").audioCodec("copy");

  return ffmpeg;
}
