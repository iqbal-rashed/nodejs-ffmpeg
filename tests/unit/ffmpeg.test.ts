/**
 * Unit tests for FFmpeg command builder
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { FFmpeg } from "../../src/core/ffmpeg.js";

// Mock the binary paths
vi.mock("../../src/binary/paths.js", () => ({
  getFFmpegPath: () => "ffmpeg",
  getFFprobePath: () => "ffprobe",
}));

describe("FFmpeg", () => {
  describe("constructor", () => {
    it("should create instance with default options", () => {
      const ffmpeg = new FFmpeg();
      expect(ffmpeg).toBeInstanceOf(FFmpeg);
    });

    it("should accept custom FFmpeg path", () => {
      const ffmpeg = new FFmpeg({ ffmpegPath: "/custom/ffmpeg" });
      expect(ffmpeg.getCommand()).toContain("/custom/ffmpeg");
    });
  });

  describe("input", () => {
    it("should add input file", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("input.mp4");
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-i");
      expect(args).toContain("input.mp4");
    });

    it("should support multiple inputs", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("video.mp4").input("audio.mp3");
      const args = ffmpeg.buildArgs();
      const inputIndices = args.reduce((acc, arg, i) => {
        if (arg === "-i") acc.push(i);
        return acc;
      }, [] as number[]);
      expect(inputIndices).toHaveLength(2);
    });
  });

  describe("output", () => {
    it("should add output file", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("input.mp4").output("output.mp4");
      const args = ffmpeg.buildArgs();
      expect(args[args.length - 1]).toBe("output.mp4");
    });
  });

  describe("codecs", () => {
    it("should set video codec", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("input.mp4").output("output.mp4").videoCodec("libx264");
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-c:v");
      expect(args).toContain("libx264");
    });

    it("should set audio codec", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("input.mp4").output("output.mp4").audioCodec("aac");
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-c:a");
      expect(args).toContain("aac");
    });
  });

  describe("bitrate", () => {
    it("should set video bitrate", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("input.mp4").output("output.mp4").videoBitrate("2M");
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-b:v");
      expect(args).toContain("2M");
    });

    it("should set audio bitrate", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("input.mp4").output("output.mp4").audioBitrate("128k");
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-b:a");
      expect(args).toContain("128k");
    });
  });

  describe("filters", () => {
    it("should add video filter", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg
        .input("input.mp4")
        .output("output.mp4")
        .videoFilter("scale=1920:1080");
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-vf");
      expect(args).toContain("scale=1920:1080");
    });

    it("should add audio filter", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("input.mp4").output("output.mp4").audioFilter("volume=2");
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-af");
      expect(args).toContain("volume=2");
    });

    it("should add complex filter", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg
        .input("input.mp4")
        .output("output.mp4")
        .complexFilter("[0:v]scale=720:-1[v]");
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-filter_complex");
    });
  });

  describe("options", () => {
    it("should set resolution", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("input.mp4").output("output.mp4").size("1280x720");
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-s");
      expect(args).toContain("1280x720");
    });

    it("should set frame rate", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("input.mp4").output("output.mp4").fps(30);
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-r");
      expect(args).toContain("30");
    });

    it("should set duration", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("input.mp4").output("output.mp4").duration(10);
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-t");
      expect(args).toContain("10");
    });

    it("should disable video", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("input.mp4").output("output.mp3").noVideo();
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-vn");
    });

    it("should disable audio", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.input("input.mp4").output("output.mp4").noAudio();
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-an");
    });

    it("should set overwrite flag", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.overwrite();
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-y");
    });

    it("should set threads", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.threads(4);
      const args = ffmpeg.buildArgs();
      expect(args).toContain("-threads");
      expect(args).toContain("4");
    });
  });

  describe("fluent API", () => {
    it("should support method chaining", () => {
      const ffmpeg = new FFmpeg();
      const result = ffmpeg
        .input("input.mp4")
        .output("output.mp4")
        .videoCodec("libx264")
        .audioCodec("aac")
        .videoBitrate("2M")
        .audioBitrate("128k")
        .overwrite();

      expect(result).toBe(ffmpeg);
    });

    it("should build complete command", () => {
      const ffmpeg = new FFmpeg();
      ffmpeg
        .input("input.mp4")
        .output("output.webm")
        .videoCodec("libvpx-vp9")
        .audioCodec("libopus")
        .videoBitrate("1M")
        .overwrite();

      const command = ffmpeg.getCommand();
      expect(command).toContain("ffmpeg");
      expect(command).toContain("-i input.mp4");
      expect(command).toContain("-c:v libvpx-vp9");
      expect(command).toContain("output.webm");
    });
  });

  describe("clone", () => {
    it("should create a new instance with same options", () => {
      const ffmpeg = new FFmpeg({ cwd: "/tmp" });
      const cloned = ffmpeg.clone();

      expect(cloned).not.toBe(ffmpeg);
      expect(cloned).toBeInstanceOf(FFmpeg);
    });
  });
});
