import os from "node:os";
import type { Platform, Architecture, PlatformBinaryNames } from "../types";
import { UnsupportedPlatformError } from "../utils/errors";

export const DOWNLOAD_BASE_URL =
  "https://github.com/iqbal-rashed/ytdlp-nodejs/releases/download/ffmpeg-latest";

export const PLATFORM_MAPPINGS: Record<string, Record<string, string[]>> = {
  win32: {
    x64: ["win-x64-ffmpeg.exe", "win-x64-ffprobe.exe"],
    ia32: ["win-ia32-ffmpeg.exe", "win-ia32-ffprobe.exe"],
    arm64: ["win-arm64-ffmpeg.exe", "win-arm64-ffprobe.exe"],
  },
  linux: {
    x64: ["linux-x64-ffmpeg", "linux-x64-ffprobe"],
    arm64: ["linux-arm64-ffmpeg", "linux-arm64-ffprobe"],
  },
  darwin: {
    x64: ["macos-x64-ffmpeg", "macos-x64-ffprobe"],
    arm64: ["macos-arm64-ffmpeg", "macos-arm64-ffprobe"],
  },
  android: {
    arm64: ["linux-arm64-ffmpeg", "linux-arm64-ffprobe"],
  },
};

export function getPlatform(): Platform {
  const platform = os.platform();
  if (platform === "linux" && os.release().toLowerCase().includes("android")) {
    return "android";
  }
  return platform as Platform;
}

export function getArchitecture(): Architecture {
  const arch = os.arch();
  if (arch === "x32") return "ia32";
  return arch as Architecture;
}

export function getBinaryNames(
  platform: Platform = getPlatform(),
  architecture: Architecture = getArchitecture()
): PlatformBinaryNames {
  const platformMappings = PLATFORM_MAPPINGS[platform];
  if (!platformMappings) {
    throw new UnsupportedPlatformError(platform, architecture);
  }

  const binaries = platformMappings[architecture];
  if (!binaries || binaries.length < 2) {
    throw new UnsupportedPlatformError(platform, architecture);
  }

  const ffmpeg = binaries[0];
  const ffprobe = binaries[1];

  if (!ffmpeg || !ffprobe) {
    throw new UnsupportedPlatformError(platform, architecture);
  }

  return { ffmpeg, ffprobe };
}

export function getDownloadUrls(
  platform: Platform = getPlatform(),
  architecture: Architecture = getArchitecture()
): { ffmpeg: string; ffprobe: string } {
  const names = getBinaryNames(platform, architecture);

  return {
    ffmpeg: `${DOWNLOAD_BASE_URL}/${names.ffmpeg}`,
    ffprobe: `${DOWNLOAD_BASE_URL}/${names.ffprobe}`,
  };
}

export function isPlatformSupported(
  platform: Platform = getPlatform(),
  architecture: Architecture = getArchitecture()
): boolean {
  const platformMappings = PLATFORM_MAPPINGS[platform];
  if (!platformMappings) return false;

  const binaries = platformMappings[architecture];
  return binaries !== undefined && binaries.length >= 2;
}

export function isWindows(): boolean {
  return os.platform() === "win32";
}
