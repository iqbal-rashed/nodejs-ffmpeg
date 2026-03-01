/**
 * Integration tests for FFprobe with real video files
 * These tests require FFmpeg binaries to be downloaded
 */

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { mkdir, rm, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import {
  FFprobe,
  createFFprobe,
  getMetadata,
  getDuration,
  getVideoCodec,
  getAudioCodec,
  getDefaultBinaryDir,
  getPackageRoot,
  runCommand,
} from "../../src/index.js";
import { existsSync } from "node:fs";
import { getBinaryNames } from "../../src/binary/platform.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES_DIR = join(getPackageRoot(), "fixtures");
const TEST_VIDEO = join(FIXTURES_DIR, "test-video.mp4");
const TEST_AUDIO = join(FIXTURES_DIR, "test-audio.mp3");

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
const ffmpegPath = binaryCheck.ffmpeg;
const ffprobePath = binaryCheck.ffprobe;

describe("FFprobe Integration Tests", () => {
  beforeAll(async () => {
    if (!binariesAvailable) {
      console.warn("FFmpeg binaries not found. Skipping integration tests.");
      return;
    }

    // Create fixtures directory
    try {
      await mkdir(FIXTURES_DIR, { recursive: true });
    } catch {
      // Directory may already exist
    }

    // Create test video using FFmpeg
    try {
      await access(TEST_VIDEO);
    } catch {
      // Generate test video: 5 seconds, 1280x720, 30fps with audio
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

    // Create test audio file
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
  });

  beforeEach(async () => {
    // Clear cache before each test
    const { probeCache } = await import("../../src/utils/cache.js");
    probeCache.clear();
  });

  describe.runIf(binariesAvailable)("with real video file", () => {
    describe("getMetadata", () => {
      it("should extract complete metadata from video file", async () => {
        const ffprobe = new FFprobe();
        const metadata = await ffprobe.getMetadata(TEST_VIDEO);

        expect(metadata).toHaveProperty("format");
        expect(metadata).toHaveProperty("streams");
        expect(metadata.streams).toBeInstanceOf(Array);
        expect(metadata.streams.length).toBeGreaterThanOrEqual(2); // Video + Audio
      });

      it("should have correct format information", async () => {
        const ffprobe = new FFprobe();
        const metadata = await ffprobe.getMetadata(TEST_VIDEO);

        expect(metadata.format.format_name).toContain("mp4");
        expect(parseFloat(metadata.format.duration)).toBeCloseTo(5, 0);
        expect(parseInt(metadata.format.bit_rate, 10)).toBeGreaterThan(0);
      });

      it("should have video stream with correct properties", async () => {
        const ffprobe = new FFprobe();
        const metadata = await ffprobe.getMetadata(TEST_VIDEO);

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === "video"
        );
        expect(videoStream).toBeDefined();
        expect(videoStream?.codec_name).toBe("h264");
        expect(videoStream?.width).toBe(1280);
        expect(videoStream?.height).toBe(720);
        expect(videoStream?.r_frame_rate).toBe("30/1");
      });

      it("should have audio stream with correct properties", async () => {
        const ffprobe = new FFprobe();
        const metadata = await ffprobe.getMetadata(TEST_VIDEO);

        const audioStream = metadata.streams.find(
          (s) => s.codec_type === "audio"
        );
        expect(audioStream).toBeDefined();
        expect(audioStream?.codec_name).toBe("aac");
        expect(audioStream?.channels).toBeGreaterThanOrEqual(1);
      });
    });

    describe("getFormat", () => {
      it("should return format info", async () => {
        const ffprobe = new FFprobe();
        const format = await ffprobe.getFormat(TEST_VIDEO);

        expect(format.filename).toBe(TEST_VIDEO);
        expect(parseFloat(format.duration)).toBeGreaterThan(0);
      });
    });

    describe("getStreams", () => {
      it("should return all streams", async () => {
        const ffprobe = new FFprobe();
        const streams = await ffprobe.getStreams(TEST_VIDEO);

        expect(streams.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe("getVideoStreams", () => {
      it("should return only video streams", async () => {
        const ffprobe = new FFprobe();
        const videoStreams = await ffprobe.getVideoStreams(TEST_VIDEO);

        expect(videoStreams.length).toBe(1);
        expect(videoStreams[0].codec_type).toBe("video");
      });
    });

    describe("getAudioStreams", () => {
      it("should return only audio streams", async () => {
        const ffprobe = new FFprobe();
        const audioStreams = await ffprobe.getAudioStreams(TEST_VIDEO);

        expect(audioStreams.length).toBe(1);
        expect(audioStreams[0].codec_type).toBe("audio");
      });
    });

    describe("getDuration", () => {
      it("should return correct duration", async () => {
        const ffprobe = new FFprobe();
        const duration = await ffprobe.getDuration(TEST_VIDEO);

        expect(duration).toBeCloseTo(5, 0);
      });
    });

    describe("getResolution", () => {
      it("should return correct resolution", async () => {
        const ffprobe = new FFprobe();
        const resolution = await ffprobe.getResolution(TEST_VIDEO);

        expect(resolution).toEqual({ width: 1280, height: 720 });
      });
    });

    describe("getCodecs", () => {
      it("should return video and audio codecs", async () => {
        const ffprobe = new FFprobe();
        const codecs = await ffprobe.getCodecs(TEST_VIDEO);

        expect(codecs.video).toBe("h264");
        expect(codecs.audio).toBe("aac");
      });
    });

    describe("getBitrate", () => {
      it("should return positive bitrate", async () => {
        const ffprobe = new FFprobe();
        const bitrate = await ffprobe.getBitrate(TEST_VIDEO);

        expect(bitrate).toBeGreaterThan(0);
      });
    });

    describe("hasVideo/hasAudio", () => {
      it("should detect video and audio streams", async () => {
        const ffprobe = new FFprobe();

        const hasVideo = await ffprobe.hasVideo(TEST_VIDEO);
        const hasAudio = await ffprobe.hasAudio(TEST_VIDEO);

        expect(hasVideo).toBe(true);
        expect(hasAudio).toBe(true);
      });
    });

    describe("getVideoCodec", () => {
      it("should return video codec", async () => {
        const ffprobe = new FFprobe();
        const codec = await ffprobe.getVideoCodec(TEST_VIDEO);

        expect(codec).toBe("h264");
      });
    });

    describe("getAudioCodec", () => {
      it("should return audio codec", async () => {
        const ffprobe = new FFprobe();
        const codec = await ffprobe.getAudioCodec(TEST_VIDEO);

        expect(codec).toBe("aac");
      });
    });

    describe("getAspectRatio", () => {
      it("should return correct aspect ratio", async () => {
        const ffprobe = new FFprobe();
        const ratio = await ffprobe.getAspectRatio(TEST_VIDEO);

        expect(ratio).toBe("16:9");
      });
    });

    describe("getFrameRate", () => {
      it("should return correct frame rate", async () => {
        const ffprobe = new FFprobe();
        const fps = await ffprobe.getFrameRate(TEST_VIDEO);

        expect(fps).toBe(30);
      });
    });

    describe("getPixelFormat", () => {
      it("should return pixel format", async () => {
        const ffprobe = new FFprobe();
        const pixelFormat = await ffprobe.getPixelFormat(TEST_VIDEO);

        expect(pixelFormat).toBe("yuv420p");
      });
    });

    describe("getAudioSampleRate", () => {
      it("should return sample rate", async () => {
        const ffprobe = new FFprobe();
        const sampleRate = await ffprobe.getAudioSampleRate(TEST_VIDEO);

        expect(sampleRate).toBeGreaterThan(0);
      });
    });

    describe("getAudioChannels", () => {
      it("should return channel count", async () => {
        const ffprobe = new FFprobe();
        const channels = await ffprobe.getAudioChannels(TEST_VIDEO);

        expect(channels).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe.runIf(binariesAvailable)("with audio-only file", () => {
    describe("getCodecs", () => {
      it("should return only audio codec for mp3", async () => {
        const ffprobe = new FFprobe();
        const codecs = await ffprobe.getCodecs(TEST_AUDIO);

        expect(codecs.video).toBeUndefined();
        expect(codecs.audio).toBeDefined();
      });
    });

    describe("hasVideo", () => {
      it("should return false for audio file", async () => {
        const ffprobe = new FFprobe();
        const hasVideo = await ffprobe.hasVideo(TEST_AUDIO);

        expect(hasVideo).toBe(false);
      });
    });

    describe("hasAudio", () => {
      it("should return true for audio file", async () => {
        const ffprobe = new FFprobe();
        const hasAudio = await ffprobe.hasAudio(TEST_AUDIO);

        expect(hasAudio).toBe(true);
      });
    });

    describe("getResolution", () => {
      it("should return null for audio file", async () => {
        const ffprobe = new FFprobe();
        const resolution = await ffprobe.getResolution(TEST_AUDIO);

        expect(resolution).toBeNull();
      });
    });
  });

  describe.runIf(binariesAvailable)("convenience functions", () => {
    it("getMetadata should work without creating instance", async () => {
      const metadata = await getMetadata(TEST_VIDEO);

      expect(metadata).toHaveProperty("format");
      expect(metadata).toHaveProperty("streams");
    });

    it("getDuration should work without creating instance", async () => {
      const duration = await getDuration(TEST_VIDEO);

      expect(duration).toBeGreaterThan(0);
    });

    it("getVideoCodec should work without creating instance", async () => {
      const codec = await getVideoCodec(TEST_VIDEO);

      expect(codec).toBe("h264");
    });

    it("getAudioCodec should work without creating instance", async () => {
      const codec = await getAudioCodec(TEST_VIDEO);

      expect(codec).toBe("aac");
    });
  });

  describe.runIf(binariesAvailable)("caching behavior", () => {
    it.skip("should cache results and reuse them (cache module tested in unit tests)", async () => {
      // This is tested in unit tests - cache behavior is mocked there
    });
  });

  describe.runIf(binariesAvailable)("createFFprobe", () => {
    it("should create FFprobe instance with options", async () => {
      const ffprobe = createFFprobe({ timeout: 10000 });
      const metadata = await ffprobe.getMetadata(TEST_VIDEO);

      expect(metadata).toHaveProperty("format");
    });
  });
});
