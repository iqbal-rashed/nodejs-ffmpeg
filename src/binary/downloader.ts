import {
  createWriteStream,
  mkdirSync,
  chmodSync,
  existsSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import { getDownloadUrls, getBinaryNames, isWindows } from "./platform";
import { getDefaultBinaryDir } from "./paths";
import { DownloadError } from "../utils/errors";
import type { DownloadOptions, DownloadProgress, BinaryInfo } from "../types";

async function downloadFile(
  url: string,
  destination: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  const filename = url.split("/").pop() ?? "unknown";

  const response = await fetch(url, {
    headers: { "User-Agent": "nodejs-ffmpeg" },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new DownloadError(
      `Failed to download ${filename}: ${response.status} ${response.statusText}`,
      url,
      response.status
    );
  }

  if (!response.body) {
    throw new DownloadError(`No response body received for ${filename}`, url);
  }

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let downloaded = 0;
  let lastReportedPercent = -1;

  const fileStream = createWriteStream(destination);

  try {
    for await (const chunk of response.body) {
      const value = chunk as Uint8Array;
      downloaded += value.length;
      fileStream.write(Buffer.from(value));

      if (onProgress) {
        const percent = total > 0 ? Math.round((downloaded / total) * 100) : 0;
        if (percent !== lastReportedPercent) {
          lastReportedPercent = percent;
          onProgress({ filename, downloaded, total, percent });
        }
      }
    }

    await new Promise<void>((resolve, reject) => {
      fileStream.end((err?: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    fileStream.close();
    if (existsSync(destination)) {
      unlinkSync(destination);
    }
    throw error;
  }
}

export async function downloadBinaries(
  options: DownloadOptions = {}
): Promise<BinaryInfo> {
  const destination = options.destination ?? getDefaultBinaryDir();

  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true });
  }

  const urls = getDownloadUrls();
  const names = getBinaryNames();

  const ffmpegPath = join(destination, names.ffmpeg);
  const ffprobePath = join(destination, names.ffprobe);

  if (!options.force && existsSync(ffmpegPath) && existsSync(ffprobePath)) {
    return { ffmpegPath, ffprobePath };
  }

  await downloadFile(urls.ffmpeg, ffmpegPath, options.onProgress);
  await downloadFile(urls.ffprobe, ffprobePath, options.onProgress);

  if (!isWindows()) {
    chmodSync(ffmpegPath, 0o755);
    chmodSync(ffprobePath, 0o755);
  }

  return { ffmpegPath, ffprobePath };
}

export function needsDownload(destination?: string): boolean {
  const dir = destination ?? getDefaultBinaryDir();
  const names = getBinaryNames();

  const ffmpegPath = join(dir, names.ffmpeg);
  const ffprobePath = join(dir, names.ffprobe);

  return !existsSync(ffmpegPath) || !existsSync(ffprobePath);
}
