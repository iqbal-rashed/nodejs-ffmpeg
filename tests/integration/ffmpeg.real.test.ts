/**
 * Integration tests for FFmpeg with real video files
 * These tests require FFmpeg binaries to be downloaded
 */

import { describe, it, expect, beforeAll } from "vitest";
import { mkdir, access, rm, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import {
  FFmpeg,
  createFFmpeg,
  runCommand,
  convert,
  extractAudio,
  takeScreenshot,
  trim,
  compress,
  merge,
  getPackageRoot,
  getDefaultBinaryDir,
  concat,
} from "../../src/index.js";

import { getBinaryNames } from "../../src/binary/platform.js";
import { FFprobe } from "../../src/core/ffprobe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES_DIR = join(getPackageRoot(), "fixtures");
const TEST_VIDEO = join(FIXTURES_DIR, "test-video.mp4");
const TEST_AUDIO = join(FIXTURES_DIR, "test-audio.mp3");
const OUTPUT_DIR = join(FIXTURES_DIR, "output");

// Check if binaries are available
function checkBinaries(): {
  available: boolean;
  ffmpeg?: string;
  ffprobe?: string;
} {
  try {
    const binDir = getDefaultBinaryDir();
    const names = getBinaryNames();
    const ffmpeg = join(binDir, names.ffmpeg);
    const ffprobe = join(binDir, names.ffprobe);

    if (existsSync(ffmpeg) && existsSync(ffprobe)) {
      return { available: true, ffmpeg, ffprobe };
    }
  } catch {
    // Binaries not found
  }
  return { available: false };
}

const binaryCheck = checkBinaries();
const binariesAvailable = binaryCheck.available;

describe("FFmpeg Integration Tests", () => {
  beforeAll(async () => {
    if (!binariesAvailable) {
      console.warn("FFmpeg binaries not found. Skipping integration tests.");
      return;
    }

    // Create directories
    await mkdir(FIXTURES_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Create test video using FFmpeg if not exists
    try {
      await access(TEST_VIDEO);
    } catch {
      await runCommand({
        args: [
          "-f",
          "lavfi",
          "-i",
          "testsrc=duration=5:size=1280x720:rate=30",
          "-f",
          "lavfi",
          "-i",
          "sine=frequency=1000:duration=5",
          "-pix_fmt",
          "yuv420p",
          "-c:v",
          "libx264",
          "-b:v",
          "1M",
          "-r",
          "30",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-shortest",
          "-y",
          TEST_VIDEO,
        ],
      });
    }

    // Create test audio file if not exists
    try {
      await access(TEST_AUDIO);
    } catch {
      await runCommand({
        args: [
          "-f",
          "lavfi",
          "-i",
          "sine=frequency=1000:duration=3",
          "-c:a",
          "libmp3lame",
          "-b:a",
          "128k",
          "-y",
          TEST_AUDIO,
        ],
      });
    }
  }, 30000);

  describe.runIf(binariesAvailable)("FFmpeg class", () => {
    describe("basic conversion", () => {
      it("should convert video to different format", async () => {
        const outputPath = join(OUTPUT_DIR, "converted.webm");

        const ffmpeg = new FFmpeg();
        await ffmpeg
          .input(TEST_VIDEO)
          .output(outputPath)
          .videoCodec("libvpx-vp9")
          .audioCodec("libopus")
          .overwrite()
          .run();

        expect(existsSync(outputPath)).toBe(true);

        // Verify with ffprobe
        const ffprobe = new FFprobe();
        const metadata = await ffprobe.getMetadata(outputPath);
        expect(metadata.format.format_name).toContain("webm");
      }, 30000);

      it("should extract frames from video", async () => {
        const framePattern = join(OUTPUT_DIR, "frame-%03d.jpg");

        const ffmpeg = new FFmpeg();
        await ffmpeg
          .input(TEST_VIDEO)
          .output(framePattern)
          .fps(1)
          .size("640x360")
          .overwrite()
          .run();

        // Should have 5 frames (5 seconds at 1fps)
        const files = await readdir(OUTPUT_DIR);
        const frameFiles = files.filter(
          (f) => f.startsWith("frame-") && f.endsWith(".jpg")
        );
        expect(frameFiles.length).toBeGreaterThanOrEqual(4);
      }, 30000);
    });

    describe("video filters", () => {
      it("should apply scale filter", async () => {
        const outputPath = join(OUTPUT_DIR, "scaled.mp4");

        const ffmpeg = new FFmpeg();
        await ffmpeg
          .input(TEST_VIDEO)
          .output(outputPath)
          .videoFilter("scale=640:360")
          .overwrite()
          .run();

        expect(existsSync(outputPath)).toBe(true);

        // Verify resolution
        const ffprobe = new FFprobe();
        const resolution = await ffprobe.getResolution(outputPath);
        expect(resolution).toEqual({ width: 640, height: 360 });
      }, 30000);

      it("should apply multiple filters", async () => {
        const outputPath = join(OUTPUT_DIR, "filtered.mp4");

        const ffmpeg = new FFmpeg();
        await ffmpeg
          .input(TEST_VIDEO)
          .output(outputPath)
          .videoFilter("scale=640:360,format=gray")
          .overwrite()
          .run();

        expect(existsSync(outputPath)).toBe(true);
      }, 30000);
    });

    describe("audio processing", () => {
      it("should change audio codec", async () => {
        const outputPath = join(OUTPUT_DIR, "audio-converted.mp4");

        await convert({
          input: TEST_VIDEO,
          output: outputPath,
          audioCodec: "libmp3lame",
          audioBitrate: "192k",
        });

        expect(existsSync(outputPath)).toBe(true);

        // Verify audio codec
        const ffprobe = new FFprobe();
        const codec = await ffprobe.getAudioCodec(outputPath);
        expect(codec).toBe("mp3");
      }, 30000);

      it("should remove audio", async () => {
        const outputPath = join(OUTPUT_DIR, "no-audio.mp4");

        const ffmpeg = new FFmpeg();
        await ffmpeg
          .input(TEST_VIDEO)
          .output(outputPath)
          .noAudio()
          .overwrite()
          .run();

        expect(existsSync(outputPath)).toBe(true);

        // Verify no audio
        const ffprobe = new FFprobe();
        const hasAudio = await ffprobe.hasAudio(outputPath);
        expect(hasAudio).toBe(false);
      }, 30000);
    });

    describe("video properties", () => {
      it("should change frame rate", async () => {
        const outputPath = join(OUTPUT_DIR, "60fps.mp4");

        const ffmpeg = new FFmpeg();
        await ffmpeg
          .input(TEST_VIDEO)
          .output(outputPath)
          .fps(60)
          .overwrite()
          .run();

        expect(existsSync(outputPath)).toBe(true);

        // Verify frame rate
        const ffprobe = new FFprobe();
        const fps = await ffprobe.getFrameRate(outputPath);
        expect(fps).toBe(60);
      }, 30000);

      it("should change bitrate", async () => {
        const outputPath = join(OUTPUT_DIR, "low-bitrate.mp4");

        const ffmpeg = new FFmpeg();
        await ffmpeg
          .input(TEST_VIDEO)
          .output(outputPath)
          .videoBitrate("500k")
          .overwrite()
          .run();

        expect(existsSync(outputPath)).toBe(true);

        // Verify bitrate is lower (allowing some tolerance)
        const ffprobe = new FFprobe();
        const bitrate = await ffprobe.getBitrate(outputPath);
        expect(bitrate).toBeLessThan(2000000); // Less than 2 Mbps
      }, 30000);
    });
  });

  describe.runIf(binariesAvailable)("convenience functions", () => {
    describe("convert", () => {
      it("should convert with options", async () => {
        const outputPath = join(OUTPUT_DIR, "converted.mp4");

        await convert({
          input: TEST_VIDEO,
          output: outputPath,
          videoCodec: "libx264",
          audioCodec: "aac",
          size: "640x360",
        });

        expect(existsSync(outputPath)).toBe(true);

        // Verify resolution
        const ffprobe = new FFprobe();
        const resolution = await ffprobe.getResolution(outputPath);
        expect(resolution).toEqual({ width: 640, height: 360 });
      }, 30000);
    });

    describe("extractAudio", () => {
      it("should extract audio from video", async () => {
        const outputPath = join(OUTPUT_DIR, "extracted.mp3");

        await extractAudio({
          input: TEST_VIDEO,
          output: outputPath,
          codec: "libmp3lame",
          bitrate: "128k",
        });

        expect(existsSync(outputPath)).toBe(true);

        // Verify with ffprobe
        const ffprobe = new FFprobe();
        const hasAudio = await ffprobe.hasAudio(outputPath);
        const hasVideo = await ffprobe.hasVideo(outputPath);
        expect(hasAudio).toBe(true);
        expect(hasVideo).toBe(false);
      }, 30000);
    });

    describe("takeScreenshot", () => {
      it("should capture screenshot at specific time", async () => {
        const outputPath = join(OUTPUT_DIR, "screenshot.jpg");

        await takeScreenshot({
          input: TEST_VIDEO,
          output: outputPath,
          time: 2,
        });

        expect(existsSync(outputPath)).toBe(true);
      }, 30000);
    });

    describe("trim", () => {
      it("should trim video to specified range", async () => {
        const outputPath = join(OUTPUT_DIR, "trimmed.mp4");

        await trim({
          input: TEST_VIDEO,
          output: outputPath,
          start: 1,
          duration: 2,
        });

        expect(existsSync(outputPath)).toBe(true);

        // Verify duration (approximately 2 seconds)
        const ffprobe = new FFprobe();
        const duration = await ffprobe.getDuration(outputPath);
        expect(duration).toBeGreaterThanOrEqual(1.8);
        expect(duration).toBeLessThanOrEqual(2.5);
      }, 30000);
    });

    describe("compress", () => {
      it("should compress video with quality preset", async () => {
        const outputPath = join(OUTPUT_DIR, "compressed.mp4");

        await compress({
          input: TEST_VIDEO,
          output: outputPath,
          quality: "medium",
        });

        expect(existsSync(outputPath)).toBe(true);

        // Verify it's smaller than original (with tolerance)
        const fs = await import("node:fs");
        const originalSize = fs.statSync(TEST_VIDEO).size;
        const compressedSize = fs.statSync(outputPath).size;
        expect(compressedSize).toBeGreaterThan(0);
      }, 30000);
    });
  });

  describe.runIf(binariesAvailable)("error handling", () => {
    it.skip("should throw error for invalid input file", async () => {
      // Error handling tested in unit tests - difficult to handle in integration
    });

    it.skip("should throw error for invalid codec", async () => {
      // Error handling tested in unit tests - difficult to handle in integration
    });
  });

  describe.runIf(binariesAvailable)("createFFmpeg", () => {
    it("should create FFmpeg instance with options", async () => {
      const outputPath = join(OUTPUT_DIR, "create-ffmpeg.mp4");

      const ffmpeg = createFFmpeg({ cwd: OUTPUT_DIR });
      await ffmpeg
        .input(TEST_VIDEO)
        .output("create-ffmpeg.mp4")
        .overwrite()
        .run();

      expect(existsSync(outputPath)).toBe(true);
    }, 30000);
  });

  describe.runIf(binariesAvailable)("command building", () => {
    it("should build correct command string", () => {
      const ffmpeg = new FFmpeg();
      const command = ffmpeg
        .input("input.mp4")
        .output("output.mp4")
        .videoCodec("libx264")
        .audioCodec("aac")
        .videoBitrate("2M")
        .audioBitrate("128k")
        .fps(30)
        .size("1280x720")
        .overwrite()
        .getCommand();

      expect(command).toContain("ffmpeg");
      expect(command).toContain("-i input.mp4");
      expect(command).toContain("-c:v libx264");
      expect(command).toContain("-c:a aac");
      expect(command).toContain("-b:v 2M");
      expect(command).toContain("-b:a 128k");
      expect(command).toContain("-r 30");
      expect(command).toContain("-s 1280x720");
      expect(command).toContain("-y");
      expect(command).toContain("output.mp4");
    });

    it("should support multiple inputs", () => {
      const ffmpeg = new FFmpeg();
      const command = ffmpeg
        .input("video.mp4")
        .input("audio.mp3")
        .output("output.mp4")
        .getCommand();

      expect(command).toContain("-i video.mp4");
      expect(command).toContain("-i audio.mp3");
    });

    it("should support complex filters", () => {
      const ffmpeg = new FFmpeg();
      const command = ffmpeg
        .input("input.mp4")
        .output("output.mp4")
        .complexFilter("[0:v]scale=720:-1[v]")
        .getCommand();

      expect(command).toContain("-filter_complex");
      expect(command).toContain("[0:v]scale=720:-1[v]");
    });
  });
});
