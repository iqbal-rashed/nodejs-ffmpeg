/**
 * Streaming and HLS example
 * Demonstrates creating HLS/DASH output for adaptive streaming
 */

import path from "path";
import fs from "fs";
import {
  FFmpeg,
  toHLS,
  toDASH,
  downloadBinaries,
  areBinariesDownloaded,
} from "../src";

async function main(): Promise<void> {
  // Ensure FFmpeg binaries are available
  if (!areBinariesDownloaded()) {
    console.log("Downloading FFmpeg binaries...\n");
    await downloadBinaries();
  }

  // Use fixtures/test-video.mp4 as default, or take from command line
  const inputFile =
    process.argv[2] ?? path.join(__dirname, "..", "fixtures", "test-video.mp4");

  // Ensure outputs directory exists
  const outputsDir = path.join(__dirname, "..", "outputs");
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }

  console.log(`\n📁 Input: ${inputFile}\n`);

  // Create output directories
  const hlsDir = path.join(outputsDir, "hls");
  const dashDir = path.join(outputsDir, "dash");

  if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir, { recursive: true });
  if (!fs.existsSync(dashDir)) fs.mkdirSync(dashDir, { recursive: true });

  // Example 1: Create HLS output
  console.log("1️⃣ Creating HLS (HTTP Live Streaming) output...");
  try {
    const result = await toHLS(inputFile, hlsDir, {
      segmentDuration: 4,
      playlistName: "master.m3u8",
    })
      .on("progress", (p) => process.stdout.write(`\r   ${p.timemark}`))
      .run();
    console.log(
      `\n   ✅ Created ${hlsDir}/master.m3u8 in ${result.duration}ms`
    );
    console.log(`   📂 Segments saved to ${hlsDir}/\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 2: Create DASH output
  console.log("2️⃣ Creating DASH (Dynamic Adaptive Streaming) output...");
  try {
    const result = await toDASH(inputFile, dashDir, {
      segmentDuration: 4,
      manifestName: "manifest.mpd",
    })
      .on("progress", (p) => process.stdout.write(`\r   ${p.timemark}`))
      .run();
    console.log(
      `\n   ✅ Created ${dashDir}/manifest.mpd in ${result.duration}ms`
    );
    console.log(`   📂 Segments saved to ${dashDir}/\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 3: Create multi-bitrate HLS
  console.log("3️⃣ Creating multi-bitrate HLS variants...");
  try {
    // Create 720p variant
    await new FFmpeg()
      .input(inputFile)
      .output(path.join(hlsDir, "720p.m3u8"))
      .format("hls")
      .videoFilter("scale=-1:720")
      .videoBitrate("2500k")
      .audioBitrate("128k")
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions(
        "-hls_time",
        "4",
        "-hls_list_size",
        "0",
        "-hls_segment_filename",
        path.join(hlsDir, "720p_%03d.ts")
      )
      .overwrite()
      .run();
    console.log("   ✅ Created 720p variant");

    // Create 480p variant
    await new FFmpeg()
      .input(inputFile)
      .output(path.join(hlsDir, "480p.m3u8"))
      .format("hls")
      .videoFilter("scale=-1:480")
      .videoBitrate("1000k")
      .audioBitrate("96k")
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions(
        "-hls_time",
        "4",
        "-hls_list_size",
        "0",
        "-hls_segment_filename",
        path.join(hlsDir, "480p_%03d.ts")
      )
      .overwrite()
      .run();
    console.log("   ✅ Created 480p variant\n");
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  console.log("🎉 Streaming outputs created!\n");
  console.log("📋 To serve HLS:");
  console.log(`   npx serve ${hlsDir}\n`);
}

main().catch(console.error);
