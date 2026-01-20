import { existsSync } from "node:fs";
import { ValidationError } from "./errors";

export function validateFileExists(filePath: string, name = "File"): void {
  if (!filePath) {
    throw new ValidationError(`${name} path is required`);
  }

  if (!existsSync(filePath)) {
    throw new ValidationError(`${name} does not exist: ${filePath}`);
  }
}

export function validatePath(path: string, name = "Path"): void {
  if (!path || typeof path !== "string") {
    throw new ValidationError(`${name} is required and must be a string`);
  }
}

export function validatePositiveNumber(value: number, name = "Value"): void {
  if (typeof value !== "number" || isNaN(value) || value <= 0) {
    throw new ValidationError(`${name} must be a positive number`);
  }
}

export function validateBitrate(bitrate: string): void {
  if (!/^\d+[kKmM]?$/.test(bitrate)) {
    throw new ValidationError(
      `Invalid bitrate format: ${bitrate}. Expected format: "128k", "1M", or "1500"`
    );
  }
}

export function validateVideoSize(size: string): void {
  const predefinedSizes = [
    "sqcif",
    "qcif",
    "cif",
    "4cif",
    "16cif",
    "qqvga",
    "qvga",
    "vga",
    "svga",
    "xga",
    "uxga",
    "qxga",
    "sxga",
    "qsxga",
    "hsxga",
    "wvga",
    "wxga",
    "wsxga",
    "wuxga",
    "woxga",
    "wqsxga",
    "wquxga",
    "whsxga",
    "whuxga",
    "wqxga",
    "ntsc",
    "pal",
    "qntsc",
    "qpal",
    "sntsc",
    "spal",
    "film",
    "ntsc-film",
    "hdtv",
    "hd720",
    "hd1080",
    "2k",
    "2kflat",
    "2kscope",
    "4k",
    "4kflat",
    "4kscope",
    "nhd",
    "hqvga",
  ];

  if (predefinedSizes.includes(size.toLowerCase())) {
    return;
  }

  if (!/^\d+[x:]\d+$/.test(size)) {
    throw new ValidationError(
      `Invalid video size format: ${size}. Expected format: "1920x1080" or "1280:720"`
    );
  }
}

export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function sanitizePath(filePath: string): string {
  return filePath.replace(/\0/g, "");
}
