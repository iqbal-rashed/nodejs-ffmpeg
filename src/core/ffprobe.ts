import { getFFprobePath } from "../binary/paths";
import { spawnProcess } from "../utils/process";
import { validateFileExists, isValidUrl } from "../utils/validation";
import { FFmpegError, FFmpegExitError } from "../utils/errors";
import { probeCache } from "../utils/cache";
import type {
  FFprobeResult,
  FFprobeOptions,
  StreamInfo,
  FormatInfo,
} from "../types";

export class FFprobe {
  private readonly ffprobePath: string;
  private readonly options: FFprobeOptions;

  constructor(options: FFprobeOptions = {}) {
    this.ffprobePath = options.ffprobePath ?? getFFprobePath();
    this.options = options;
  }

  async getMetadata(filePath: string): Promise<FFprobeResult> {
    // Check cache first for file paths (not URLs)
    if (!isValidUrl(filePath)) {
      validateFileExists(filePath, "Input file");

      const cached = probeCache.get(filePath);
      if (cached) {
        return cached;
      }
    }

    const args = [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      "-show_chapters",
    ];

    if (this.options.selectStreams) {
      args.push("-select_streams", this.options.selectStreams);
    }

    args.push(filePath);

    const result = await spawnProcess(this.ffprobePath, args, {
      timeout: this.options.timeout ?? 0,
    });

    if (result.exitCode !== 0) {
      throw new FFmpegExitError(
        result.exitCode,
        result.stderr,
        `ffprobe ${args.join(" ")}`
      );
    }

    try {
      const metadata = JSON.parse(result.stdout) as FFprobeResult;

      // Cache the result for file paths
      if (!isValidUrl(filePath)) {
        probeCache.set(filePath, metadata);
      }

      return metadata;
    } catch {
      throw new FFmpegError(`Failed to parse FFprobe output: ${result.stdout}`);
    }
  }

  async getFormat(filePath: string): Promise<FormatInfo> {
    const metadata = await this.getMetadata(filePath);
    return metadata.format;
  }

  async getStreams(filePath: string): Promise<StreamInfo[]> {
    const metadata = await this.getMetadata(filePath);
    return metadata.streams;
  }

  async getVideoStreams(filePath: string): Promise<StreamInfo[]> {
    const ffprobe = new FFprobe({
      ...this.options,
      selectStreams: "v",
    });
    const streams = await ffprobe.getStreams(filePath);
    return streams.filter((s) => s.codec_type === "video");
  }

  async getAudioStreams(filePath: string): Promise<StreamInfo[]> {
    const ffprobe = new FFprobe({
      ...this.options,
      selectStreams: "a",
    });
    const streams = await ffprobe.getStreams(filePath);
    return streams.filter((s) => s.codec_type === "audio");
  }

  async getDuration(filePath: string): Promise<number> {
    const format = await this.getFormat(filePath);
    return parseFloat(format.duration);
  }

  async getResolution(
    filePath: string
  ): Promise<{ width: number; height: number } | null> {
    const streams = await this.getVideoStreams(filePath);
    const videoStream = streams[0];

    if (!videoStream?.width || !videoStream.height) {
      return null;
    }

    return {
      width: videoStream.width,
      height: videoStream.height,
    };
  }

  async getCodecs(
    filePath: string
  ): Promise<{ video?: string; audio?: string }> {
    const streams = await this.getStreams(filePath);

    const videoStream = streams.find((s) => s.codec_type === "video");
    const audioStream = streams.find((s) => s.codec_type === "audio");

    const result: { video?: string; audio?: string } = {};
    if (videoStream) {
      result.video = videoStream.codec_name;
    }
    if (audioStream) {
      result.audio = audioStream.codec_name;
    }

    return result;
  }

  async getBitrate(filePath: string): Promise<number> {
    const format = await this.getFormat(filePath);
    return parseInt(format.bit_rate, 10);
  }

  async hasVideo(filePath: string): Promise<boolean> {
    const streams = await this.getVideoStreams(filePath);
    return streams.length > 0;
  }

  async hasAudio(filePath: string): Promise<boolean> {
    const streams = await this.getAudioStreams(filePath);
    return streams.length > 0;
  }

  /**
   * Get video codec name
   */
  async getVideoCodec(filePath: string): Promise<string | undefined> {
    const streams = await this.getStreams(filePath);
    const videoStream = streams.find((s) => s.codec_type === "video");
    return videoStream?.codec_name;
  }

  /**
   * Get audio codec name
   */
  async getAudioCodec(filePath: string): Promise<string | undefined> {
    const streams = await this.getStreams(filePath);
    const audioStream = streams.find((s) => s.codec_type === "audio");
    return audioStream?.codec_name;
  }

  /**
   * Get aspect ratio as a string (e.g., "16:9", "4:3")
   */
  async getAspectRatio(filePath: string): Promise<string | undefined> {
    const streams = await this.getVideoStreams(filePath);
    const videoStream = streams[0];

    if (!videoStream) return undefined;

    const { width, height } = videoStream;
    if (!width || !height) return undefined;

    // Calculate GCD
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);

    return `${width / divisor}:${height / divisor}`;
  }

  /**
   * Get frame rate as a number
   */
  async getFrameRate(filePath: string): Promise<number | undefined> {
    const streams = await this.getVideoStreams(filePath);
    const videoStream = streams[0];

    if (!videoStream?.r_frame_rate) return undefined;

    const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
    if (num === undefined) return undefined;
    return den ? num / den : num;
  }

  /**
   * Get pixel format
   */
  async getPixelFormat(filePath: string): Promise<string | undefined> {
    const streams = await this.getVideoStreams(filePath);
    return streams[0]?.pix_fmt;
  }

  /**
   * Get audio sample rate
   */
  async getAudioSampleRate(filePath: string): Promise<number | undefined> {
    const streams = await this.getAudioStreams(filePath);
    const rate = streams[0]?.sample_rate;
    return rate ? parseInt(rate, 10) : undefined;
  }

  /**
   * Get number of audio channels
   */
  async getAudioChannels(filePath: string): Promise<number | undefined> {
    const streams = await this.getAudioStreams(filePath);
    return streams[0]?.channels;
  }
}

export function createFFprobe(options?: FFprobeOptions): FFprobe {
  return new FFprobe(options);
}

export async function getMetadata(
  filePath: string,
  options?: FFprobeOptions
): Promise<FFprobeResult> {
  const ffprobe = new FFprobe(options);
  return ffprobe.getMetadata(filePath);
}

export async function getDuration(
  filePath: string,
  options?: FFprobeOptions
): Promise<number> {
  const ffprobe = new FFprobe(options);
  return ffprobe.getDuration(filePath);
}

/**
 * Get video codec name for a file
 */
export async function getVideoCodec(
  filePath: string,
  options?: FFprobeOptions
): Promise<string | undefined> {
  const ffprobe = new FFprobe(options);
  return ffprobe.getVideoCodec(filePath);
}

/**
 * Get audio codec name for a file
 */
export async function getAudioCodec(
  filePath: string,
  options?: FFprobeOptions
): Promise<string | undefined> {
  const ffprobe = new FFprobe(options);
  return ffprobe.getAudioCodec(filePath);
}

/**
 * Get aspect ratio as a string (e.g., "16:9", "4:3")
 */
export async function getAspectRatio(
  filePath: string,
  options?: FFprobeOptions
): Promise<string | undefined> {
  const ffprobe = new FFprobe(options);
  return ffprobe.getAspectRatio(filePath);
}

/**
 * Get frame rate as a number
 */
export async function getFrameRate(
  filePath: string,
  options?: FFprobeOptions
): Promise<number | undefined> {
  const ffprobe = new FFprobe(options);
  return ffprobe.getFrameRate(filePath);
}

/**
 * Get pixel format
 */
export async function getPixelFormat(
  filePath: string,
  options?: FFprobeOptions
): Promise<string | undefined> {
  const ffprobe = new FFprobe(options);
  return ffprobe.getPixelFormat(filePath);
}

/**
 * Get audio sample rate
 */
export async function getAudioSampleRate(
  filePath: string,
  options?: FFprobeOptions
): Promise<number | undefined> {
  const ffprobe = new FFprobe(options);
  return ffprobe.getAudioSampleRate(filePath);
}

/**
 * Get number of audio channels
 */
export async function getAudioChannels(
  filePath: string,
  options?: FFprobeOptions
): Promise<number | undefined> {
  const ffprobe = new FFprobe(options);
  return ffprobe.getAudioChannels(filePath);
}
