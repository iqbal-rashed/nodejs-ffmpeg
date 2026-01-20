/**
 * Unit tests for platform detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PLATFORM_MAPPINGS,
  getBinaryNames,
  getDownloadUrls,
  isPlatformSupported,
  DOWNLOAD_BASE_URL,
} from "../../src/binary/platform.js";

describe("PLATFORM_MAPPINGS", () => {
  it("should have mappings for win32", () => {
    expect(PLATFORM_MAPPINGS.win32).toBeDefined();
    expect(PLATFORM_MAPPINGS.win32.x64).toHaveLength(2);
    expect(PLATFORM_MAPPINGS.win32.x64[0]).toContain("ffmpeg.exe");
    expect(PLATFORM_MAPPINGS.win32.x64[1]).toContain("ffprobe.exe");
  });

  it("should have mappings for linux", () => {
    expect(PLATFORM_MAPPINGS.linux).toBeDefined();
    expect(PLATFORM_MAPPINGS.linux.x64).toHaveLength(2);
  });

  it("should have mappings for darwin", () => {
    expect(PLATFORM_MAPPINGS.darwin).toBeDefined();
    expect(PLATFORM_MAPPINGS.darwin.arm64).toHaveLength(2);
  });

  it("should have mappings for android", () => {
    expect(PLATFORM_MAPPINGS.android).toBeDefined();
    expect(PLATFORM_MAPPINGS.android.arm64).toHaveLength(2);
  });
});

describe("getBinaryNames", () => {
  it("should return correct names for win32 x64", () => {
    const names = getBinaryNames("win32", "x64");
    expect(names.ffmpeg).toBe("win-x64-ffmpeg.exe");
    expect(names.ffprobe).toBe("win-x64-ffprobe.exe");
  });

  it("should return correct names for linux x64", () => {
    const names = getBinaryNames("linux", "x64");
    expect(names.ffmpeg).toBe("linux-x64-ffmpeg");
    expect(names.ffprobe).toBe("linux-x64-ffprobe");
  });

  it("should return correct names for darwin arm64", () => {
    const names = getBinaryNames("darwin", "arm64");
    expect(names.ffmpeg).toBe("macos-arm64-ffmpeg");
    expect(names.ffprobe).toBe("macos-arm64-ffprobe");
  });

  it("should throw for unsupported platform", () => {
    expect(() => getBinaryNames("freebsd" as any, "x64")).toThrow();
  });

  it("should throw for unsupported architecture", () => {
    expect(() => getBinaryNames("linux", "mips" as any)).toThrow();
  });
});

describe("getDownloadUrls", () => {
  it("should return correct URLs for win32 x64", () => {
    const urls = getDownloadUrls("win32", "x64");
    expect(urls.ffmpeg).toBe(`${DOWNLOAD_BASE_URL}/win-x64-ffmpeg.exe`);
    expect(urls.ffprobe).toBe(`${DOWNLOAD_BASE_URL}/win-x64-ffprobe.exe`);
  });

  it("should return correct URLs for linux arm64", () => {
    const urls = getDownloadUrls("linux", "arm64");
    expect(urls.ffmpeg).toBe(`${DOWNLOAD_BASE_URL}/linux-arm64-ffmpeg`);
    expect(urls.ffprobe).toBe(`${DOWNLOAD_BASE_URL}/linux-arm64-ffprobe`);
  });
});

describe("isPlatformSupported", () => {
  it("should return true for supported combinations", () => {
    expect(isPlatformSupported("win32", "x64")).toBe(true);
    expect(isPlatformSupported("linux", "x64")).toBe(true);
    expect(isPlatformSupported("darwin", "arm64")).toBe(true);
    expect(isPlatformSupported("android", "arm64")).toBe(true);
  });

  it("should return false for unsupported combinations", () => {
    expect(isPlatformSupported("freebsd" as any, "x64")).toBe(false);
    expect(isPlatformSupported("linux", "mips" as any)).toBe(false);
    expect(isPlatformSupported("win32", "arm" as any)).toBe(false);
  });
});
