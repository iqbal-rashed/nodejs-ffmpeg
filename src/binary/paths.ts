import { existsSync, accessSync, constants, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { getBinaryNames, isWindows } from "./platform";
import { FFmpegNotFoundError } from "../utils/errors";
import type { BinaryInfo } from "../types";

let customFFmpegPath: string | undefined;
let customFFprobePath: string | undefined;

export function setFFmpegPath(path: string): void {
  customFFmpegPath = path;
}

export function setFFprobePath(path: string): void {
  customFFprobePath = path;
}

export function getCustomFFmpegPath(): string | undefined {
  return customFFmpegPath;
}

export function getCustomFFprobePath(): string | undefined {
  return customFFprobePath;
}

export function clearCustomPaths(): void {
  customFFmpegPath = undefined;
  customFFprobePath = undefined;
}

function findPackageRoot(startDir: string): string {
  let current = startDir;

  for (;;) {
    if (existsSync(join(current, "package.json"))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return startDir;
    }
    current = parent;
  }
}

let cachedPackageRoot: string | undefined;

function getPackageRoot(): string {
  cachedPackageRoot ??= findPackageRoot(__dirname);
  return cachedPackageRoot;
}

export function getDefaultBinaryDir(): string {
  const packageRoot = getPackageRoot();
  const packageBinDir = join(packageRoot, "bin");

  if (!existsSync(packageBinDir)) {
    mkdirSync(packageBinDir, { recursive: true });
  }
  return packageBinDir;
}

export function isBinaryExecutable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return existsSync(path);
  }
}

export function findFFmpegPath(): string | undefined {
  if (customFFmpegPath && isBinaryExecutable(customFFmpegPath)) {
    return customFFmpegPath;
  }

  const binaryNames = getBinaryNames();
  const defaultDir = getDefaultBinaryDir();
  const defaultPath = join(defaultDir, binaryNames.ffmpeg);

  if (isBinaryExecutable(defaultPath)) {
    return defaultPath;
  }

  return isWindows() ? "ffmpeg.exe" : "ffmpeg";
}

export function findFFprobePath(): string | undefined {
  if (customFFprobePath && isBinaryExecutable(customFFprobePath)) {
    return customFFprobePath;
  }

  const binaryNames = getBinaryNames();
  const defaultDir = getDefaultBinaryDir();
  const defaultPath = join(defaultDir, binaryNames.ffprobe);

  if (isBinaryExecutable(defaultPath)) {
    return defaultPath;
  }

  return isWindows() ? "ffprobe.exe" : "ffprobe";
}

export function getFFmpegPath(): string {
  const path = findFFmpegPath();
  if (!path) {
    throw new FFmpegNotFoundError("FFmpeg");
  }
  return path;
}

export function getFFprobePath(): string {
  const path = findFFprobePath();
  if (!path) {
    throw new FFmpegNotFoundError("FFprobe");
  }
  return path;
}

export function getBinaryPaths(): BinaryInfo {
  return {
    ffmpegPath: getFFmpegPath(),
    ffprobePath: getFFprobePath(),
  };
}

export function areBinariesDownloaded(): boolean {
  const binaryNames = getBinaryNames();
  const defaultDir = getDefaultBinaryDir();

  const ffmpegPath = join(defaultDir, binaryNames.ffmpeg);
  const ffprobePath = join(defaultDir, binaryNames.ffprobe);

  return isBinaryExecutable(ffmpegPath) && isBinaryExecutable(ffprobePath);
}
