import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { validateFileExists, isValidUrl } from "./validation";
import { ValidationError } from "./errors";

/**
 * Validate input file path or buffer
 */
export function validateInput(input: string | Buffer | ReadableStream): void {
  if (Buffer.isBuffer(input) || input instanceof ReadableStream) {
    return; // Buffers and streams are always valid
  }

  if (!isValidUrl(input)) {
    validateFileExists(input, "Input file");
  }
}

/**
 * Validate output path - ensure directory exists
 */
export function validateOutputPath(outputPath: string): void {
  const dir = dirname(outputPath);

  if (!existsSync(dir)) {
    throw new ValidationError(
      `Output directory does not exist: ${dir}. Create it first or ensure the path is correct.`
    );
  }
}

/**
 * Validate video codec
 */
export function validateVideoCodec(codec: string): void {
  if (!codec || codec.trim().length === 0) {
    throw new ValidationError("Video codec cannot be empty");
  }
}

/**
 * Validate audio codec
 */
export function validateAudioCodec(codec: string): void {
  if (!codec || codec.trim().length === 0) {
    throw new ValidationError("Audio codec cannot be empty");
  }
}

/**
 * Validate quality value (CRF)
 */
export function validateQuality(crf: number): void {
  if (crf < 0 || crf > 51) {
    throw new ValidationError(
      `CRF quality must be between 0 and 51, got ${crf}`
    );
  }
}

/**
 * Validate bitrate string (e.g., "1M", "500k")
 */
export function validateBitrate(bitrate: string): void {
  const match = /^(\d+(?:\.\d+)?)(k|M|G)?$/i.exec(bitrate);
  if (!match) {
    throw new ValidationError(
      `Invalid bitrate format: "${bitrate}". Expected format: "1M", "500k", etc.`
    );
  }
}

/**
 * Validate resolution (e.g., "1920x1080", "1280x720")
 */
export function validateResolution(resolution: string): void {
  const match = /^(\d+)x(\d+)$/.exec(resolution);
  if (!match) {
    throw new ValidationError(
      `Invalid resolution format: "${resolution}". Expected format: "1920x1080"`
    );
  }

  const width = match[1];
  const height = match[2];

  if (!width || !height) {
    throw new ValidationError(`Invalid resolution format: "${resolution}"`);
  }

  const w = parseInt(width, 10);
  const h = parseInt(height, 10);

  if (w < 1 || h < 1) {
    throw new ValidationError(
      `Invalid resolution dimensions: ${resolution}. Width and height must be positive numbers.`
    );
  }

  if (w > 7680 || h > 4320) {
    throw new ValidationError(
      `Resolution too large: ${resolution}. Maximum supported is 7680x4320 (8K).`
    );
  }
}

/**
 * Validate frame rate
 */
export function validateFrameRate(fps: number): void {
  if (fps <= 0 || fps > 120) {
    throw new ValidationError(
      `Invalid frame rate: ${fps}. Must be between 0 and 120 fps.`
    );
  }
}

/**
 * Validate sample rate
 */
export function validateSampleRate(sampleRate: number): void {
  const validSampleRates = [
    8000, 11025, 16000, 22050, 32000, 44100, 48000, 96000, 192000,
  ];

  if (!validSampleRates.includes(sampleRate)) {
    throw new ValidationError(
      `Invalid sample rate: ${sampleRate}. Valid values are: ${validSampleRates.join(", ")} Hz`
    );
  }
}

/**
 * Validate time value (seconds or HH:MM:SS format)
 */
export function validateTime(time: string | number): void {
  if (typeof time === "number") {
    if (time < 0) {
      throw new ValidationError(`Time cannot be negative: ${time}`);
    }
    return;
  }

  // Check HH:MM:SS or MM:SS format
  const timeFormatRegex = /^(\d+):(\d{2}):(\d{2})$|^(\d+):(\d{2})$/;
  if (!timeFormatRegex.test(time)) {
    throw new ValidationError(
      `Invalid time format: "${time}". Expected format: "00:00:10" or "00:10" or seconds as number`
    );
  }
}

/**
 * Validate speed factor
 */
export function validateSpeed(speed: number): void {
  if (speed <= 0 || speed > 100) {
    throw new ValidationError(
      `Invalid speed factor: ${speed}. Must be between 0 and 100.`
    );
  }
}

/**
 * Validate rotation angle
 */
export function validateRotation(
  angle: 90 | 180 | 270 | "cw" | "ccw" | "flip" | "vflip"
): void {
  const validAngles = [90, 180, 270, "cw", "ccw", "flip", "vflip"];

  if (!validAngles.includes(angle)) {
    throw new ValidationError(
      `Invalid rotation angle: ${angle}. Valid values are: ${validAngles.join(", ")}`
    );
  }
}

/**
 * Validate watermark options
 */
export function validateWatermarkOpacity(opacity: number): void {
  if (opacity < 0 || opacity > 1) {
    throw new ValidationError(
      `Watermark opacity must be between 0 and 1, got ${opacity}`
    );
  }
}
