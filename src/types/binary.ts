export type Platform = "win32" | "linux" | "darwin" | "android";
export type Architecture = "x64" | "ia32" | "arm64";

export interface BinaryInfo {
  ffmpegPath: string;
  ffprobePath: string;
}

export interface DownloadOptions {
  destination?: string;
  force?: boolean;
  onProgress?: (progress: DownloadProgress) => void;
}

export interface DownloadProgress {
  filename: string;
  downloaded: number;
  total: number;
  percent: number;
}

export interface PlatformBinaryNames {
  ffmpeg: string;
  ffprobe: string;
}
