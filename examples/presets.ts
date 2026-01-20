/**
 * Presets usage examples
 * Demonstrates using the built-in conversion presets
 */

import path from "path";
import fs from "fs";
import {
  toMP4,
  toWebM,
  extractAudioPreset,
  createGif,
  screenshot,
  downloadBinaries,
  areBinariesDownloaded,
} from "../src";

async function main(): Promise<void> {
  // Ensure FFmpeg binaries are available
  if (!areBinariesDownloaded()) {
    console.log("Downloading FFmpeg binaries...\n");
    await downloadBinaries();
  }

  // Use samples/sample.webm as default, or take from command line
  const inputFile =
    process.argv[2] ?? path.join(__dirname, "..", "samples", "sample.webm");

  // Ensure outputs directory exists
  const outputsDir = path.join(__dirname, "..", "outputs");
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }

  console.log(`\n📁 Input: ${inputFile}\n`);

  // Example 1: Convert to MP4
  console.log("1️⃣ Converting to MP4 (H.264/AAC)...");
  try {
    const result = await toMP4(
      inputFile,
      path.join(outputsDir, "output_h264.mp4"),
      {
        quality: "medium",
      }
    )
      .on("progress", (p) => process.stdout.write(`\r   ${p.timemark}`))
      .run();
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 2: Convert to WebM
  console.log("2️⃣ Converting to WebM (VP9/Opus)...");
  try {
    const result = await toWebM(
      inputFile,
      path.join(outputsDir, "output_vp9.webm"),
      {
        quality: "medium",
      }
    )
      .on("progress", (p) => process.stdout.write(`\r   ${p.timemark}`))
      .run();
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 3: Extract audio
  console.log("3️⃣ Extracting audio to MP3...");
  try {
    const result = await extractAudioPreset(
      inputFile,
      path.join(outputsDir, "output_audio.mp3"),
      {
        format: "mp3",
        bitrate: "192k",
      }
    )
      .on("progress", (p) => process.stdout.write(`\r   ${p.timemark}`))
      .run();
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 4: Take screenshot
  console.log("4️⃣ Taking screenshot at 5 seconds...");
  try {
    const result = await screenshot(
      inputFile,
      path.join(outputsDir, "screenshot.jpg"),
      {
        time: 5,
        size: "1280x720",
      }
    ).run();
    console.log(`   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 5: Create GIF
  console.log("5️⃣ Creating GIF (first 5 seconds)...");
  try {
    const result = await createGif(
      inputFile,
      path.join(outputsDir, "animation.gif"),
      {
        start: 0,
        duration: 5,
        fps: 10,
        width: 320,
      }
    ).run();
    console.log(`   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  console.log("🎉 All presets demonstrated!\n");
}

main().catch(console.error);
