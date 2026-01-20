import type { ProgressInfo } from "../types";

const PROGRESS_PATTERNS = {
  frame: /frame=\s*(\d+)/,
  fps: /fps=\s*([\d.]+)/,
  size: /size=\s*(\d+)kB/,
  time: /time=\s*([\d:.]+)/,
  bitrate: /bitrate=\s*([\d.]+)kbits\/s/,
  speed: /speed=\s*([\d.]+)x/,
} as const;

export function parseProgress(line: string): ProgressInfo | null {
  if (!line.includes("frame=") && !line.includes("size=")) {
    return null;
  }

  const frameMatch = PROGRESS_PATTERNS.frame.exec(line);
  const fpsMatch = PROGRESS_PATTERNS.fps.exec(line);
  const sizeMatch = PROGRESS_PATTERNS.size.exec(line);
  const timeMatch = PROGRESS_PATTERNS.time.exec(line);
  const bitrateMatch = PROGRESS_PATTERNS.bitrate.exec(line);

  const progressInfo: ProgressInfo = {
    frames: frameMatch ? parseInt(frameMatch[1] ?? "0", 10) : 0,
    currentFps: fpsMatch ? parseFloat(fpsMatch[1] ?? "0") : 0,
    currentKbps: bitrateMatch ? parseFloat(bitrateMatch[1] ?? "0") : 0,
    targetSize: sizeMatch ? parseInt(sizeMatch[1] ?? "0", 10) * 1024 : 0,
    timemark: timeMatch?.[1] ?? "00:00:00.00",
  };

  return progressInfo;
}

export function parseTimemark(timemark: string): number {
  const parts = timemark.split(":");

  if (parts.length === 3) {
    const hours = parseFloat(parts[0] ?? "0");
    const minutes = parseFloat(parts[1] ?? "0");
    const seconds = parseFloat(parts[2] ?? "0");
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0] ?? "0");
    const seconds = parseFloat(parts[1] ?? "0");
    return minutes * 60 + seconds;
  } else {
    return parseFloat(parts[0] ?? "0");
  }
}

export function calculatePercent(
  timemark: string,
  durationSeconds: number
): number {
  if (durationSeconds <= 0) {
    return 0;
  }

  const currentSeconds = parseTimemark(timemark);
  const percent = (currentSeconds / durationSeconds) * 100;
  return Math.min(100, Math.max(0, percent));
}

export function formatTimemark(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
}
