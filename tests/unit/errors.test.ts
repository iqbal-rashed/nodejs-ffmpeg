/**
 * Unit tests for error classes
 */

import { describe, it, expect } from "vitest";
import {
  FFmpegError,
  FFmpegNotFoundError,
  FFmpegExitError,
  FFmpegTimeoutError,
  DownloadError,
  UnsupportedPlatformError,
  ValidationError,
} from "../../src/utils/errors.js";

describe("FFmpegError", () => {
  it("should create with message", () => {
    const error = new FFmpegError("Test error");
    expect(error.message).toBe("Test error");
    expect(error.name).toBe("FFmpegError");
  });

  it("should store command", () => {
    const error = new FFmpegError("Test error", "ffmpeg -i input.mp4");
    expect(error.command).toBe("ffmpeg -i input.mp4");
  });

  it("should be instanceof Error", () => {
    const error = new FFmpegError("Test");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("FFmpegNotFoundError", () => {
  it("should create with binary name", () => {
    const error = new FFmpegNotFoundError("FFmpeg");
    expect(error.message).toContain("FFmpeg not found");
    expect(error.name).toBe("FFmpegNotFoundError");
  });

  it("should include path if provided", () => {
    const error = new FFmpegNotFoundError("FFmpeg", "/usr/bin/ffmpeg");
    expect(error.message).toContain("/usr/bin/ffmpeg");
  });
});

describe("FFmpegExitError", () => {
  it("should store exit code and stderr", () => {
    const error = new FFmpegExitError(1, "Error output", "ffmpeg command");
    expect(error.exitCode).toBe(1);
    expect(error.stderr).toBe("Error output");
    expect(error.command).toBe("ffmpeg command");
    expect(error.name).toBe("FFmpegExitError");
  });

  it("should include exit code in message", () => {
    const error = new FFmpegExitError(255, "Failed");
    expect(error.message).toContain("255");
  });
});

describe("FFmpegTimeoutError", () => {
  it("should store timeout value", () => {
    const error = new FFmpegTimeoutError(30000, "ffmpeg command");
    expect(error.timeoutMs).toBe(30000);
    expect(error.command).toBe("ffmpeg command");
    expect(error.name).toBe("FFmpegTimeoutError");
  });

  it("should include timeout in message", () => {
    const error = new FFmpegTimeoutError(5000);
    expect(error.message).toContain("5000");
  });
});

describe("DownloadError", () => {
  it("should create with message", () => {
    const error = new DownloadError("Download failed");
    expect(error.message).toBe("Download failed");
    expect(error.name).toBe("DownloadError");
  });

  it("should store URL and status code", () => {
    const error = new DownloadError(
      "Not found",
      "https://example.com/file",
      404
    );
    expect(error.url).toBe("https://example.com/file");
    expect(error.statusCode).toBe(404);
  });
});

describe("UnsupportedPlatformError", () => {
  it("should store platform and architecture", () => {
    const error = new UnsupportedPlatformError("freebsd", "mips");
    expect(error.platform).toBe("freebsd");
    expect(error.architecture).toBe("mips");
    expect(error.name).toBe("UnsupportedPlatformError");
  });

  it("should include platform info in message", () => {
    const error = new UnsupportedPlatformError("aix", "s390");
    expect(error.message).toContain("aix");
    expect(error.message).toContain("s390");
  });
});

describe("ValidationError", () => {
  it("should create with message", () => {
    const error = new ValidationError("Invalid input");
    expect(error.message).toBe("Invalid input");
    expect(error.name).toBe("ValidationError");
  });

  it("should be instanceof Error", () => {
    const error = new ValidationError("Test");
    expect(error).toBeInstanceOf(Error);
  });
});
