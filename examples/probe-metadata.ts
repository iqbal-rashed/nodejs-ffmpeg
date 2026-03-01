/**
 * FFprobe metadata extraction example
 * Demonstrates how to extract and display media file information
 */

import path from "path";
import { FFprobe, downloadBinaries, areBinariesDownloaded } from "../src";

async function main(): Promise<void> {
  // Ensure FFmpeg binaries are available
  if (!areBinariesDownloaded()) {
    console.log("Downloading FFmpeg binaries...");
    await downloadBinaries();
    console.log("Download complete!\n");
  }

  // Use fixtures/test-video.mp4 as default, or take from command line
  const inputFile =
    process.argv[2] ?? path.join(__dirname, "..", "fixtures", "test-video.mp4");

  const ffprobe = new FFprobe();

  try {
    console.log(`\n📁 File: ${inputFile}\n`);

    // Get full metadata
    const metadata = await ffprobe.getMetadata(inputFile);

    // Format info
    console.log("📋 Format Information:");
    console.log(`   Container: ${metadata.format.format_long_name}`);
    console.log(
      `   Duration: ${formatDuration(parseFloat(metadata.format.duration))}`
    );
    console.log(`   Size: ${formatBytes(parseInt(metadata.format.size))}`);
    console.log(
      `   Bitrate: ${formatBitrate(parseInt(metadata.format.bit_rate))}`
    );

    // Video streams
    const videoStreams = metadata.streams.filter(
      (s) => s.codec_type === "video"
    );
    if (videoStreams.length > 0) {
      console.log("\n🎬 Video Streams:");
      for (const stream of videoStreams) {
        console.log(`   Stream #${stream.index}:`);
        console.log(`     Codec: ${stream.codec_long_name}`);
        console.log(`     Resolution: ${stream.width}x${stream.height}`);
        console.log(`     Frame rate: ${stream.r_frame_rate}`);
        if (stream.bit_rate) {
          console.log(
            `     Bitrate: ${formatBitrate(parseInt(stream.bit_rate))}`
          );
        }
        if (stream.pix_fmt) {
          console.log(`     Pixel format: ${stream.pix_fmt}`);
        }
      }
    }

    // Audio streams
    const audioStreams = metadata.streams.filter(
      (s) => s.codec_type === "audio"
    );
    if (audioStreams.length > 0) {
      console.log("\n🔊 Audio Streams:");
      for (const stream of audioStreams) {
        console.log(`   Stream #${stream.index}:`);
        console.log(`     Codec: ${stream.codec_long_name}`);
        console.log(`     Sample rate: ${stream.sample_rate} Hz`);
        console.log(
          `     Channels: ${stream.channels} (${stream.channel_layout ?? "unknown layout"})`
        );
        if (stream.bit_rate) {
          console.log(
            `     Bitrate: ${formatBitrate(parseInt(stream.bit_rate))}`
          );
        }
      }
    }

    // Subtitle streams
    const subtitleStreams = metadata.streams.filter(
      (s) => s.codec_type === "subtitle"
    );
    if (subtitleStreams.length > 0) {
      console.log("\n📝 Subtitle Streams:");
      for (const stream of subtitleStreams) {
        const lang = stream.tags?.language ?? "unknown";
        console.log(
          `   Stream #${stream.index}: ${stream.codec_name} (${lang})`
        );
      }
    }

    // Chapters
    if (metadata.chapters && metadata.chapters.length > 0) {
      console.log("\n📑 Chapters:");
      for (const chapter of metadata.chapters) {
        const title = chapter.tags?.title ?? `Chapter ${chapter.id}`;
        console.log(`   ${chapter.start_time} - ${chapter.end_time}: ${title}`);
      }
    }

    console.log("");
  } catch (error) {
    console.error("❌ Failed to read metadata:", error);
    process.exit(1);
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(2);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function formatBitrate(bps: number): string {
  if (bps >= 1000000) {
    return `${(bps / 1000000).toFixed(2)} Mbps`;
  }
  return `${(bps / 1000).toFixed(0)} kbps`;
}

main().catch(console.error);
