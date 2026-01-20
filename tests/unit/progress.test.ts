/**
 * Unit tests for progress parsing utilities
 */

import { describe, it, expect } from "vitest";
import {
  parseProgress,
  parseTimemark,
  calculatePercent,
  formatTimemark,
} from "../../src/utils/progress.js";

describe("parseProgress", () => {
  it("should parse a complete FFmpeg progress line", () => {
    const line =
      "frame=  120 fps= 30 q=28.0 size=    1024kB time=00:00:04.00 bitrate= 2097.2kbits/s speed=1.5x";

    const result = parseProgress(line);

    expect(result).not.toBeNull();
    expect(result?.frames).toBe(120);
    expect(result?.currentFps).toBe(30);
    expect(result?.targetSize).toBe(1024 * 1024);
    expect(result?.timemark).toBe("00:00:04.00");
    expect(result?.currentKbps).toBe(2097.2);
  });

  it("should return null for non-progress lines", () => {
    const line = "Stream mapping:";
    expect(parseProgress(line)).toBeNull();
  });

  it("should handle partial progress lines", () => {
    const line = "frame=   50 fps=0.0 q=0.0 size=       0kB time=00:00:01.00";

    const result = parseProgress(line);

    expect(result).not.toBeNull();
    expect(result?.frames).toBe(50);
    expect(result?.currentFps).toBe(0);
    expect(result?.timemark).toBe("00:00:01.00");
  });

  it("should handle size without frame", () => {
    const line = "size=    512kB time=00:00:02.50 bitrate= 1677.7kbits/s";

    const result = parseProgress(line);

    expect(result).not.toBeNull();
    expect(result?.frames).toBe(0);
    expect(result?.targetSize).toBe(512 * 1024);
    expect(result?.timemark).toBe("00:00:02.50");
  });
});

describe("parseTimemark", () => {
  it("should parse HH:MM:SS.ms format", () => {
    expect(parseTimemark("01:30:45.50")).toBeCloseTo(5445.5);
  });

  it("should parse MM:SS.ms format", () => {
    expect(parseTimemark("05:30.25")).toBeCloseTo(330.25);
  });

  it("should parse SS.ms format", () => {
    expect(parseTimemark("45.75")).toBeCloseTo(45.75);
  });

  it("should parse whole seconds", () => {
    expect(parseTimemark("120")).toBe(120);
  });

  it("should handle zero", () => {
    expect(parseTimemark("00:00:00.00")).toBe(0);
  });
});

describe("calculatePercent", () => {
  it("should calculate progress percentage", () => {
    expect(calculatePercent("00:00:30.00", 60)).toBeCloseTo(50);
  });

  it("should return 0 for zero duration", () => {
    expect(calculatePercent("00:00:10.00", 0)).toBe(0);
  });

  it("should cap at 100%", () => {
    expect(calculatePercent("00:01:30.00", 60)).toBe(100);
  });

  it("should not go below 0%", () => {
    expect(calculatePercent("00:00:00.00", 60)).toBe(0);
  });

  it("should handle precise calculations", () => {
    expect(calculatePercent("00:00:15.00", 60)).toBeCloseTo(25);
    expect(calculatePercent("00:00:45.00", 60)).toBeCloseTo(75);
  });
});

describe("formatTimemark", () => {
  it("should format seconds to timemark", () => {
    expect(formatTimemark(3661.5)).toBe("01:01:01.50");
  });

  it("should format zero", () => {
    expect(formatTimemark(0)).toBe("00:00:00.00");
  });

  it("should handle large hours", () => {
    expect(formatTimemark(36000)).toBe("10:00:00.00");
  });

  it("should format sub-minute values", () => {
    expect(formatTimemark(45.25)).toBe("00:00:45.25");
  });
});
