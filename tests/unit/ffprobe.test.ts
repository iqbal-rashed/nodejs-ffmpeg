/**
 * Unit tests for FFprobe class and functions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { FFprobe, createFFprobe, getMetadata, getDuration } from "../../src/core/ffprobe.js";
import { probeCache } from "../../src/utils/cache.js";
import type { FFprobeResult } from "../../src/types";

// Mock dependencies
vi.mock("../../src/binary/paths.js", () => ({
  getFFprobePath: () => "ffprobe",
}));

vi.mock("../../src/utils/process.js", () => ({
  spawnProcess: vi.fn(),
}));

vi.mock("../../src/utils/validation.js", () => ({
  validateFileExists: vi.fn(),
  isValidUrl: (path: string) => path.startsWith("http"),
}));

import { spawnProcess } from "../../src/utils/process.js";

const mockSpawnProcess = vi.mocked(spawnProcess);

// Sample mock FFprobe output
const mockFFprobeResult: FFprobeResult = {
  format: {
    filename: "test.mp4",
    nb_streams: 2,
    nb_programs: 0,
    format_name: "mov,mp4,m4a,3gp,3g2,mj2",
    format_long_name: "QuickTime / MOV",
    start_time: "0.000000",
    duration: "60.000000",
    size: "12345678",
    bit_rate: "1645000",
    probe_score: 100,
    tags: {
      major_brand: "isom",
      minor_version: "512",
      compatible_brands: "isomiso2avc1mp41",
    },
  },
  streams: [
    {
      index: 0,
      codec_name: "h264",
      codec_long_name: "H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10",
      profile: "High",
      codec_type: "video",
      codec_tag_string: "avc1",
      codec_tag: "0x31637661",
      width: 1920,
      height: 1080,
      coded_width: 1920,
      coded_height: 1080,
      closed_captions: 0,
      has_b_frames: 2,
      sample_aspect_ratio: "1:1",
      display_aspect_ratio: "16:9",
      pix_fmt: "yuv420p",
      level: 40,
      color_range: "tv",
      color_space: "bt709",
      color_transfer: "bt709",
      color_primaries: "bt709",
      chroma_location: "left",
      field_order: "progressive",
      refs: 1,
      is_avc: "true",
      nal_length_size: "4",
      r_frame_rate: "30/1",
      avg_frame_rate: "30/1",
      time_base: "1/90000",
      start_pts: 0,
      start_time: "0.000000",
      duration_ts: 5400000,
      duration: "60.000000",
      bit_rate: "1500000",
      bits_per_raw_sample: "8",
      nb_frames: "1800",
      disposition: {
        default: 1,
        dub: 0,
        original: 0,
        comment: 0,
        lyrics: 0,
        karaoke: 0,
        forced: 0,
        hearing_impaired: 0,
        visual_impaired: 0,
        clean_effects: 0,
        attached_pic: 0,
        timed_thumbnails: 0,
      },
      tags: {
        language: "und",
        handler_name: "VideoHandler",
        vendor_id: "[0][0][0][0]",
      },
    },
    {
      index: 1,
      codec_name: "aac",
      codec_long_name: "AAC (Advanced Audio Coding)",
      profile: "LC",
      codec_type: "audio",
      codec_tag_string: "mp4a",
      codec_tag: "0x6134706d",
      sample_fmt: "fltp",
      sample_rate: "48000",
      channels: 2,
      channel_layout: "stereo",
      bits_per_sample: 0,
      r_frame_rate: "0/0",
      avg_frame_rate: "0/0",
      time_base: "1/48000",
      start_pts: 0,
      start_time: "0.000000",
      duration_ts: 2880000,
      duration: "60.000000",
      bit_rate: "128000",
      nb_frames: "2813",
      disposition: {
        default: 1,
        dub: 0,
        original: 0,
        comment: 0,
        lyrics: 0,
        karaoke: 0,
        forced: 0,
        hearing_impaired: 0,
        visual_impaired: 0,
        clean_effects: 0,
        attached_pic: 0,
        timed_thumbnails: 0,
      },
      tags: {
        language: "und",
        handler_name: "SoundHandler",
        vendor_id: "[0][0][0][0]",
      },
    },
  ],
  chapters: [],
};

describe("FFprobe", () => {
  beforeEach(() => {
    probeCache.clear();
    mockSpawnProcess.mockReset();
  });

  describe("constructor", () => {
    it("should create instance with default options", () => {
      const ffprobe = new FFprobe();
      expect(ffprobe).toBeInstanceOf(FFprobe);
    });

    it("should accept custom ffprobe path", () => {
      const ffprobe = new FFprobe({ ffprobePath: "/custom/ffprobe" });
      expect(ffprobe).toBeInstanceOf(FFprobe);
    });

    it("should accept timeout option", () => {
      const ffprobe = new FFprobe({ timeout: 30000 });
      expect(ffprobe).toBeInstanceOf(FFprobe);
    });
  });

  describe("getMetadata", () => {
    it("should return metadata for a file", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const result = await ffprobe.getMetadata("/path/to/video.mp4");

      expect(result).toEqual(mockFFprobeResult);
      expect(mockSpawnProcess).toHaveBeenCalledWith(
        "ffprobe",
        [
          "-v",
          "quiet",
          "-print_format",
          "json",
          "-show_format",
          "-show_streams",
          "-show_chapters",
          "/path/to/video.mp4",
        ],
        { timeout: 0 }
      );
    });

    it("should cache results for file paths", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const result1 = await ffprobe.getMetadata("/path/to/video.mp4");
      const result2 = await ffprobe.getMetadata("/path/to/video.mp4");

      expect(result1).toEqual(result2);
      expect(mockSpawnProcess).toHaveBeenCalledTimes(1);
    });

    it("should not cache results for URLs", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      await ffprobe.getMetadata("http://example.com/video.mp4");
      await ffprobe.getMetadata("http://example.com/video.mp4");

      expect(mockSpawnProcess).toHaveBeenCalledTimes(2);
    });

    it("should use cached result if available", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      await ffprobe.getMetadata("/path/to/video.mp4");

      // Second call should use cache
      mockSpawnProcess.mockClear();
      const result = await ffprobe.getMetadata("/path/to/video.mp4");

      expect(mockSpawnProcess).not.toHaveBeenCalled();
      expect(result).toEqual(mockFFprobeResult);
    });

    it("should throw FFmpegExitError on non-zero exit code", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 1,
        stdout: "",
        stderr: "Error: Invalid file format",
      });

      const ffprobe = new FFprobe();
      await expect(ffprobe.getMetadata("/path/to/invalid.mp4")).rejects.toThrow(
        "FFmpeg exited with code 1"
      );
    });

    it("should throw FFmpegError on invalid JSON output", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: "invalid json",
        stderr: "",
      });

      const ffprobe = new FFprobe();
      await expect(ffprobe.getMetadata("/path/to/video.mp4")).rejects.toThrow(
        "Failed to parse FFprobe output"
      );
    });

    it("should respect timeout option", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe({ timeout: 5000 });
      await ffprobe.getMetadata("/path/to/video.mp4");

      expect(mockSpawnProcess).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        { timeout: 5000 }
      );
    });

    it("should support selectStreams option", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe({ selectStreams: "v" });
      await ffprobe.getMetadata("/path/to/video.mp4");

      expect(mockSpawnProcess).toHaveBeenCalledWith(
        "ffprobe",
        expect.arrayContaining(["-select_streams", "v"]),
        expect.any(Object)
      );
    });
  });

  describe("getFormat", () => {
    it("should return format info", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const format = await ffprobe.getFormat("/path/to/video.mp4");

      expect(format).toEqual(mockFFprobeResult.format);
    });
  });

  describe("getStreams", () => {
    it("should return streams array", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const streams = await ffprobe.getStreams("/path/to/video.mp4");

      expect(streams).toEqual(mockFFprobeResult.streams);
      expect(streams).toHaveLength(2);
    });
  });

  describe("getVideoStreams", () => {
    it("should return only video streams", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const videoStreams = await ffprobe.getVideoStreams("/path/to/video.mp4");

      expect(videoStreams).toHaveLength(1);
      expect(videoStreams[0].codec_type).toBe("video");
    });

    it("should return empty array if no video streams", async () => {
      const audioOnlyResult: FFprobeResult = {
        ...mockFFprobeResult,
        streams: [mockFFprobeResult.streams[1]], // Only audio stream
      };

      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(audioOnlyResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const videoStreams = await ffprobe.getVideoStreams("/path/to/audio.mp3");

      expect(videoStreams).toHaveLength(0);
    });
  });

  describe("getAudioStreams", () => {
    it("should return only audio streams", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const audioStreams = await ffprobe.getAudioStreams("/path/to/video.mp4");

      expect(audioStreams).toHaveLength(1);
      expect(audioStreams[0].codec_type).toBe("audio");
    });
  });

  describe("getDuration", () => {
    it("should return duration as number", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const duration = await ffprobe.getDuration("/path/to/video.mp4");

      expect(duration).toBe(60);
    });
  });

  describe("getResolution", () => {
    it("should return width and height", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const resolution = await ffprobe.getResolution("/path/to/video.mp4");

      expect(resolution).toEqual({ width: 1920, height: 1080 });
    });

    it("should return null if no video stream", async () => {
      const audioOnlyResult: FFprobeResult = {
        ...mockFFprobeResult,
        streams: [mockFFprobeResult.streams[1]],
      };

      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(audioOnlyResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const resolution = await ffprobe.getResolution("/path/to/audio.mp3");

      expect(resolution).toBeNull();
    });
  });

  describe("getCodecs", () => {
    it("should return video and audio codec names", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const codecs = await ffprobe.getCodecs("/path/to/video.mp4");

      expect(codecs).toEqual({ video: "h264", audio: "aac" });
    });

    it("should return empty object for audio-only file", async () => {
      const audioOnlyResult: FFprobeResult = {
        format: mockFFprobeResult.format,
        streams: [
          {
            ...mockFFprobeResult.streams[1],
            codec_type: "audio",
            codec_name: "mp3",
          },
        ],
      };

      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(audioOnlyResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const codecs = await ffprobe.getCodecs("/path/to/audio.mp3");

      expect(codecs).toEqual({ audio: "mp3" });
    });
  });

  describe("getBitrate", () => {
    it("should return bitrate as number", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const bitrate = await ffprobe.getBitrate("/path/to/video.mp4");

      expect(bitrate).toBe(1645000);
    });
  });

  describe("hasVideo", () => {
    it("should return true if video stream exists", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const hasVideo = await ffprobe.hasVideo("/path/to/video.mp4");

      expect(hasVideo).toBe(true);
    });

    it("should return false if no video stream", async () => {
      const audioOnlyResult: FFprobeResult = {
        ...mockFFprobeResult,
        streams: [mockFFprobeResult.streams[1]],
      };

      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(audioOnlyResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const hasVideo = await ffprobe.hasVideo("/path/to/audio.mp3");

      expect(hasVideo).toBe(false);
    });
  });

  describe("hasAudio", () => {
    it("should return true if audio stream exists", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const hasAudio = await ffprobe.hasAudio("/path/to/video.mp4");

      expect(hasAudio).toBe(true);
    });

    it("should return false if no audio stream", async () => {
      const videoOnlyResult: FFprobeResult = {
        ...mockFFprobeResult,
        streams: [mockFFprobeResult.streams[0]],
      };

      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(videoOnlyResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const hasAudio = await ffprobe.hasAudio("/path/to/silent.mp4");

      expect(hasAudio).toBe(false);
    });
  });

  describe("getVideoCodec", () => {
    it("should return video codec name", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const codec = await ffprobe.getVideoCodec("/path/to/video.mp4");

      expect(codec).toBe("h264");
    });

    it("should return undefined if no video stream", async () => {
      const audioOnlyResult: FFprobeResult = {
        ...mockFFprobeResult,
        streams: [mockFFprobeResult.streams[1]],
      };

      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(audioOnlyResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const codec = await ffprobe.getVideoCodec("/path/to/audio.mp3");

      expect(codec).toBeUndefined();
    });
  });

  describe("getAudioCodec", () => {
    it("should return audio codec name", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const codec = await ffprobe.getAudioCodec("/path/to/video.mp4");

      expect(codec).toBe("aac");
    });
  });

  describe("getAspectRatio", () => {
    it("should return aspect ratio string", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const ratio = await ffprobe.getAspectRatio("/path/to/video.mp4");

      expect(ratio).toBe("16:9");
    });

    it("should calculate aspect ratio for non-standard resolution", async () => {
      const customResult: FFprobeResult = {
        ...mockFFprobeResult,
        streams: [
          {
            ...mockFFprobeResult.streams[0],
            width: 1440,
            height: 1080,
          },
        ],
      };

      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(customResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const ratio = await ffprobe.getAspectRatio("/path/to/video.mp4");

      expect(ratio).toBe("4:3");
    });

    it("should return undefined if no video stream", async () => {
      const audioOnlyResult: FFprobeResult = {
        ...mockFFprobeResult,
        streams: [mockFFprobeResult.streams[1]],
      };

      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(audioOnlyResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const ratio = await ffprobe.getAspectRatio("/path/to/audio.mp3");

      expect(ratio).toBeUndefined();
    });
  });

  describe("getFrameRate", () => {
    it("should return frame rate as number", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const fps = await ffprobe.getFrameRate("/path/to/video.mp4");

      expect(fps).toBe(30);
    });

    it("should handle fractional frame rates", async () => {
      const customResult: FFprobeResult = {
        ...mockFFprobeResult,
        streams: [
          {
            ...mockFFprobeResult.streams[0],
            r_frame_rate: "30000/1001",
          },
        ],
      };

      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(customResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const fps = await ffprobe.getFrameRate("/path/to/video.mp4");

      expect(fps).toBeCloseTo(29.97, 2);
    });

    it("should return undefined if no frame rate", async () => {
      const customResult: FFprobeResult = {
        ...mockFFprobeResult,
        streams: [
          {
            ...mockFFprobeResult.streams[0],
            r_frame_rate: undefined as unknown as string,
          },
        ],
      };

      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(customResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const fps = await ffprobe.getFrameRate("/path/to/video.mp4");

      expect(fps).toBeUndefined();
    });
  });

  describe("getPixelFormat", () => {
    it("should return pixel format", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const format = await ffprobe.getPixelFormat("/path/to/video.mp4");

      expect(format).toBe("yuv420p");
    });
  });

  describe("getAudioSampleRate", () => {
    it("should return sample rate as number", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const rate = await ffprobe.getAudioSampleRate("/path/to/video.mp4");

      expect(rate).toBe(48000);
    });

    it("should return undefined if no audio stream", async () => {
      const videoOnlyResult: FFprobeResult = {
        ...mockFFprobeResult,
        streams: [mockFFprobeResult.streams[0]],
      };

      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(videoOnlyResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const rate = await ffprobe.getAudioSampleRate("/path/to/silent.mp4");

      expect(rate).toBeUndefined();
    });
  });

  describe("getAudioChannels", () => {
    it("should return number of channels", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const channels = await ffprobe.getAudioChannels("/path/to/video.mp4");

      expect(channels).toBe(2);
    });

    it("should return undefined if no audio stream", async () => {
      const videoOnlyResult: FFprobeResult = {
        ...mockFFprobeResult,
        streams: [mockFFprobeResult.streams[0]],
      };

      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(videoOnlyResult),
        stderr: "",
      });

      const ffprobe = new FFprobe();
      const channels = await ffprobe.getAudioChannels("/path/to/silent.mp4");

      expect(channels).toBeUndefined();
    });
  });
});

describe("createFFprobe", () => {
  it("should create FFprobe instance", () => {
    const ffprobe = createFFprobe({ timeout: 10000 });
    expect(ffprobe).toBeInstanceOf(FFprobe);
  });
});

describe("convenience functions", () => {
  beforeEach(() => {
    probeCache.clear();
    mockSpawnProcess.mockReset();
  });

  describe("getMetadata", () => {
    it("should get metadata without creating instance", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const result = await getMetadata("/path/to/video.mp4");

      expect(result).toEqual(mockFFprobeResult);
      expect(mockSpawnProcess).toHaveBeenCalled();
    });

    it("should accept options", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      await getMetadata("/path/to/video.mp4", { timeout: 5000 });

      expect(mockSpawnProcess).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        { timeout: 5000 }
      );
    });
  });

  describe("getDuration", () => {
    it("should get duration without creating instance", async () => {
      mockSpawnProcess.mockResolvedValue({
        exitCode: 0,
        stdout: JSON.stringify(mockFFprobeResult),
        stderr: "",
      });

      const duration = await getDuration("/path/to/video.mp4");

      expect(duration).toBe(60);
    });
  });
});
