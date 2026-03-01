export class FFmpegError extends Error {
  constructor(
    message: string,
    public readonly command?: string
  ) {
    super(message);
    this.name = "FFmpegError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class FFmpegNotFoundError extends FFmpegError {
  constructor(binaryName: string, path?: string) {
    const message = path
      ? `${binaryName} not found at path: ${path}`
      : `${binaryName} not found. Please download binaries using downloadBinaries() or set the path manually.`;
    super(message);
    this.name = "FFmpegNotFoundError";
  }
}

export class FFmpegExitError extends FFmpegError {
  constructor(
    public readonly exitCode: number,
    public readonly stderr: string,
    command?: string
  ) {
    super(`FFmpeg exited with code ${exitCode}: ${stderr}`, command);
    this.name = "FFmpegExitError";
  }
}

export class FFmpegTimeoutError extends FFmpegError {
  constructor(
    public readonly timeoutMs: number,
    command?: string
  ) {
    super(`FFmpeg process timed out after ${timeoutMs}ms`, command);
    this.name = "FFmpegTimeoutError";
  }
}

export class DownloadError extends Error {
  constructor(
    message: string,
    public readonly url?: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "DownloadError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnsupportedPlatformError extends Error {
  constructor(
    public readonly platform: string,
    public readonly architecture: string
  ) {
    super(
      `Unsupported platform/architecture combination: ${platform}/${architecture}`
    );
    this.name = "UnsupportedPlatformError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class FFmpegAbortError extends FFmpegError {
  constructor(command?: string) {
    super("FFmpeg operation aborted", command);
    this.name = "FFmpegAbortError";
  }
}

export class InvalidInputError extends FFmpegError {
  constructor(
    public readonly path: string,
    reason?: string
  ) {
    super(
      reason
        ? `Invalid input file "${path}": ${reason}`
        : `Invalid input file: "${path}" does not exist or is not readable`
    );
    this.name = "InvalidInputError";
  }
}

export class CodecNotFoundError extends FFmpegError {
  constructor(
    public readonly codec: string,
    public readonly codecType: "video" | "audio" = "video"
  ) {
    super(
      `${codecType === "video" ? "Video" : "Audio"} codec "${codec}" not found. ` +
        `Run "ffmpeg -codecs" to see available codecs.`
    );
    this.name = "CodecNotFoundError";
  }
}

export class FileExistsError extends FFmpegError {
  constructor(public readonly path: string) {
    super(
      `Output file "${path}" already exists. Set overwrite: true to overwrite.`
    );
    this.name = "FileExistsError";
  }
}
