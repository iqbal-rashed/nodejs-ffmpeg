import { FFmpeg } from "../core/ffmpeg";
import type { FFmpegOptions } from "../types";

export type PresetQuality = "low" | "medium" | "high" | "best";

export interface PresetOptions extends FFmpegOptions {
  quality?: PresetQuality;
  threads?: number;
}

export const QUALITY_CRF: Record<PresetQuality, number> = {
  low: 35,
  medium: 28,
  high: 23,
  best: 18,
};

export const QUALITY_AUDIO_BITRATE: Record<PresetQuality, string> = {
  low: "96k",
  medium: "128k",
  high: "192k",
  best: "320k",
};

export function createPresetFFmpeg(options: PresetOptions = {}): FFmpeg {
  const ffmpeg = new FFmpeg(options);

  ffmpeg.overwrite();

  if (options.threads) {
    ffmpeg.threads(options.threads);
  }

  return ffmpeg;
}

export function getCRF(quality: PresetQuality = "medium"): number {
  return QUALITY_CRF[quality];
}

export function getAudioBitrate(quality: PresetQuality = "medium"): string {
  return QUALITY_AUDIO_BITRATE[quality];
}
