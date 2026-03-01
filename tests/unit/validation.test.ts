/**
 * Unit tests for validation utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validatePath,
  validatePositiveNumber,
  validateVideoSize,
  isValidUrl,
  sanitizePath,
} from "../../src/utils/validation";
import { validateBitrate } from "../../src/utils/validators";
import { ValidationError } from "../../src/utils/errors";

describe("validatePath", () => {
  it("should not throw for valid path", () => {
    expect(() => validatePath("/path/to/file.mp4")).not.toThrow();
    expect(() => validatePath("C:\\Videos\\file.mp4")).not.toThrow();
  });

  it("should throw for empty path", () => {
    expect(() => validatePath("")).toThrow(ValidationError);
    expect(() => validatePath("", "Input")).toThrow("Input is required");
  });

  it("should throw for non-string path", () => {
    expect(() => validatePath(null as any)).toThrow(ValidationError);
    expect(() => validatePath(undefined as any)).toThrow(ValidationError);
  });
});

describe("validatePositiveNumber", () => {
  it("should not throw for positive numbers", () => {
    expect(() => validatePositiveNumber(1)).not.toThrow();
    expect(() => validatePositiveNumber(100)).not.toThrow();
    expect(() => validatePositiveNumber(0.5)).not.toThrow();
  });

  it("should throw for zero", () => {
    expect(() => validatePositiveNumber(0)).toThrow(ValidationError);
  });

  it("should throw for negative numbers", () => {
    expect(() => validatePositiveNumber(-1)).toThrow(ValidationError);
  });

  it("should throw for NaN", () => {
    expect(() => validatePositiveNumber(NaN)).toThrow(ValidationError);
  });
});

describe("validateBitrate", () => {
  it("should not throw for valid bitrate formats", () => {
    expect(() => validateBitrate("128k")).not.toThrow();
    expect(() => validateBitrate("2M")).not.toThrow();
    expect(() => validateBitrate("1500")).not.toThrow();
    expect(() => validateBitrate("320K")).not.toThrow();
  });

  it("should throw for invalid bitrate formats", () => {
    expect(() => validateBitrate("invalid")).toThrow(ValidationError);
    expect(() => validateBitrate("128kb")).toThrow(ValidationError);
    expect(() => validateBitrate("-100k")).toThrow(ValidationError);
  });
});

describe("validateVideoSize", () => {
  it("should not throw for WxH format", () => {
    expect(() => validateVideoSize("1920x1080")).not.toThrow();
    expect(() => validateVideoSize("1280x720")).not.toThrow();
  });

  it("should not throw for W:H format", () => {
    expect(() => validateVideoSize("1920:1080")).not.toThrow();
  });

  it("should not throw for predefined sizes", () => {
    expect(() => validateVideoSize("hd720")).not.toThrow();
    expect(() => validateVideoSize("hd1080")).not.toThrow();
    expect(() => validateVideoSize("vga")).not.toThrow();
    expect(() => validateVideoSize("4k")).not.toThrow();
  });

  it("should throw for invalid formats", () => {
    expect(() => validateVideoSize("1920")).toThrow(ValidationError);
    expect(() => validateVideoSize("invalid")).toThrow(ValidationError);
  });
});

describe("isValidUrl", () => {
  it("should return true for valid URLs", () => {
    expect(isValidUrl("https://example.com/video.mp4")).toBe(true);
    expect(isValidUrl("http://localhost:8080/stream")).toBe(true);
    expect(isValidUrl("rtmp://server/live/stream")).toBe(true);
  });

  it("should return false for invalid URLs", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("/local/path/file.mp4")).toBe(false);
    expect(isValidUrl("")).toBe(false);
  });
});

describe("sanitizePath", () => {
  it("should remove null bytes", () => {
    expect(sanitizePath("file\0.mp4")).toBe("file.mp4");
  });

  it("should keep valid paths unchanged", () => {
    expect(sanitizePath("/path/to/file.mp4")).toBe("/path/to/file.mp4");
    expect(sanitizePath("C:\\Videos\\file.mp4")).toBe("C:\\Videos\\file.mp4");
  });
});
