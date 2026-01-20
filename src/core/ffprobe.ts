import { getFFprobePath } from "../binary/paths";
import { spawnProcess } from "../utils/process";
import { validateFileExists, isValidUrl } from "../utils/validation";
import { FFmpegError, FFmpegExitError } from "../utils/errors";
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
    if (!isValidUrl(filePath)) {
      validateFileExists(filePath, "Input file");
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
      return JSON.parse(result.stdout) as FFprobeResult;
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
