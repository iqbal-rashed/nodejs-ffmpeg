/**
 * Object-based API examples
 * Demonstrates the new standalone function API with object configuration
 */

import path from "path";
import fs from "fs";
import {
  convert,
  extractAudio,
  takeScreenshot,
  trim,
  compress,
  toGif,
  changeSpeed,
  rotate,
  downloadBinaries,
  areBinariesDownloaded,
} from "../src";

async function main(): Promise<void> {
  // Ensure FFmpeg binaries are available
  if (!areBinariesDownloaded()) {
    console.log("Downloading FFmpeg binaries...\n");
    await downloadBinaries();
  }

  const inputFile =
    process.argv[2] ?? path.join(__dirname, "..", "samples", "sample.webm");

  // Ensure outputs directory exists
  const outputsDir = path.join(__dirname, "..", "outputs");
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }

  console.log(`\n📁 Input: ${inputFile}\n`);

  // Example 1: Simple conversion with convert()
  console.log("1️⃣ Convert to MP4 (object-based)...");
  try {
    const result = await convert({
      input: inputFile,
      output: path.join(outputsDir, "converted.mp4"),
      videoCodec: "libx264",
      audioCodec: "aac",
      crf: 23,
      preset: "fast",
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 2: Extract audio
  console.log("2️⃣ Extract audio as MP3...");
  try {
    const result = await extractAudio({
      input: inputFile,
      output: path.join(outputsDir, "audio.mp3"),
      format: "mp3",
      bitrate: "192k",
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 3: Take a screenshot
  console.log("3️⃣ Take screenshot at 2 seconds...");
  try {
    const result = await takeScreenshot({
      input: inputFile,
      output: path.join(outputsDir, "frame.jpg"),
      time: 2,
      width: 1280,
      quality: 2,
    });
    console.log(`   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 4: Trim video
  console.log("4️⃣ Trim first 5 seconds...");
  try {
    const result = await trim({
      input: inputFile,
      output: path.join(outputsDir, "trimmed.mp4"),
      start: 0,
      duration: 5,
      copy: true, // Fast mode, no re-encoding
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 5: Compress video
  console.log("5️⃣ Compress video (medium quality)...");
  try {
    const result = await compress({
      input: inputFile,
      output: path.join(outputsDir, "compressed.mp4"),
      quality: "medium",
      preset: "fast",
      audioBitrate: "96k",
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 6: Create GIF
  console.log("6️⃣ Create animated GIF...");
  try {
    const result = await toGif({
      input: inputFile,
      output: path.join(outputsDir, "preview.gif"),
      start: 0,
      duration: 3,
      fps: 10,
      width: 320,
      loop: 0, // Infinite loop
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 7: Change speed
  console.log("7️⃣ Speed up video 2x...");
  try {
    const result = await changeSpeed({
      input: inputFile,
      output: path.join(outputsDir, "fast.mp4"),
      speed: 2,
      adjustAudio: true,
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 8: Rotate video
  console.log("8️⃣ Rotate video 90° clockwise...");
  try {
    const result = await rotate({
      input: inputFile,
      output: path.join(outputsDir, "rotated.mp4"),
      angle: 90,
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  console.log("🎉 All object-based API examples completed!\n");
}

main().catch(console.error);
