import type { FFmpeg } from "../core/ffmpeg";
import {
  createPresetFFmpeg,
  getAudioBitrate,
  type PresetOptions,
} from "./common";

export interface AudioPresetOptions extends PresetOptions {
  sampleRate?: number;
  channels?: number;
  bitrate?: string;
}

export function toMP3(
  input: string,
  output: string,
  options: AudioPresetOptions = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);
  const bitrate = options.bitrate ?? getAudioBitrate(options.quality);

  ffmpeg
    .input(input)
    .output(output)
    .noVideo()
    .audioCodec("libmp3lame")
    .audioBitrate(bitrate);

  if (options.sampleRate) {
    ffmpeg.audioFrequency(options.sampleRate);
  }

  if (options.channels) {
    ffmpeg.audioChannels(options.channels);
  }

  return ffmpeg;
}

export function toAAC(
  input: string,
  output: string,
  options: AudioPresetOptions = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);
  const bitrate = options.bitrate ?? getAudioBitrate(options.quality);

  ffmpeg
    .input(input)
    .output(output)
    .noVideo()
    .audioCodec("aac")
    .audioBitrate(bitrate);

  if (options.sampleRate) {
    ffmpeg.audioFrequency(options.sampleRate);
  }

  if (options.channels) {
    ffmpeg.audioChannels(options.channels);
  }

  return ffmpeg;
}

export function toOpus(
  input: string,
  output: string,
  options: AudioPresetOptions = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);
  const bitrate = options.bitrate ?? getAudioBitrate(options.quality);

  ffmpeg
    .input(input)
    .output(output)
    .noVideo()
    .audioCodec("libopus")
    .audioBitrate(bitrate);

  if (options.sampleRate) {
    ffmpeg.audioFrequency(options.sampleRate);
  }

  if (options.channels) {
    ffmpeg.audioChannels(options.channels);
  }

  return ffmpeg;
}

export function toFLAC(
  input: string,
  output: string,
  options: AudioPresetOptions = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);

  ffmpeg.input(input).output(output).noVideo().audioCodec("flac");

  if (options.sampleRate) {
    ffmpeg.audioFrequency(options.sampleRate);
  }

  if (options.channels) {
    ffmpeg.audioChannels(options.channels);
  }

  return ffmpeg;
}

export function toWAV(
  input: string,
  output: string,
  options: AudioPresetOptions = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);

  ffmpeg.input(input).output(output).noVideo().audioCodec("pcm_s16le");

  if (options.sampleRate) {
    ffmpeg.audioFrequency(options.sampleRate);
  }

  if (options.channels) {
    ffmpeg.audioChannels(options.channels);
  }

  return ffmpeg;
}

export function extractAudio(
  input: string,
  output: string,
  options: AudioPresetOptions & {
    format?: "mp3" | "aac" | "opus" | "flac" | "wav";
  } = {}
): FFmpeg {
  const format = options.format ?? "mp3";

  switch (format) {
    case "aac":
      return toAAC(input, output, options);
    case "opus":
      return toOpus(input, output, options);
    case "flac":
      return toFLAC(input, output, options);
    case "wav":
      return toWAV(input, output, options);
    case "mp3":
    default:
      return toMP3(input, output, options);
  }
}

export function normalizeAudio(input: string, output: string): FFmpeg {
  const ffmpeg = createPresetFFmpeg();

  ffmpeg
    .input(input)
    .output(output)
    .audioFilter("loudnorm=I=-16:LRA=11:TP=-1.5");

  return ffmpeg;
}
