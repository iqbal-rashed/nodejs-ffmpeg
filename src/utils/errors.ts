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
