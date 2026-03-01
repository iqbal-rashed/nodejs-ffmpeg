/**
 * Advanced filters example
 * Demonstrates using FFmpeg filters for video effects
 */

import path from "path";
import fs from "fs";
import { FFmpeg, downloadBinaries, areBinariesDownloaded } from "../src";

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

  // Example 1: Scale and crop
  console.log("1️⃣ Scale to 720p...");
  try {
    await new FFmpeg()
      .input(inputFile)
      .output(path.join(outputsDir, "output_720p.mp4"))
      .videoFilter("scale=-1:720")
      .videoCodec("libx264")
      .audioCodec("copy")
      .overwrite()
      .run();
    console.log("   ✅ Created output_720p.mp4\n");
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 2: Add blur effect
  console.log("2️⃣ Adding blur effect...");
  try {
    await new FFmpeg()
      .input(inputFile)
      .output(path.join(outputsDir, "output_blur.mp4"))
      .videoFilter("boxblur=5:5")
      .videoCodec("libx264")
      .audioCodec("copy")
      .overwrite()
      .run();
    console.log("   ✅ Created output_blur.mp4\n");
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 3: Grayscale
  console.log("3️⃣ Converting to grayscale...");
  try {
    await new FFmpeg()
      .input(inputFile)
      .output(path.join(outputsDir, "output_grayscale.mp4"))
      .videoFilter("colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3")
      .videoCodec("libx264")
      .audioCodec("copy")
      .overwrite()
      .run();
    console.log("   ✅ Created output_grayscale.mp4\n");
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 4: Rotate 90 degrees
  console.log("4️⃣ Rotating 90 degrees clockwise...");
  try {
    await new FFmpeg()
      .input(inputFile)
      .output(path.join(outputsDir, "output_rotated.mp4"))
      .videoFilter("transpose=1")
      .videoCodec("libx264")
      .audioCodec("copy")
      .overwrite()
      .run();
    console.log("   ✅ Created output_rotated.mp4\n");
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 5: Add text overlay
  console.log("5️⃣ Adding text overlay...");
  try {
    await new FFmpeg()
      .input(inputFile)
      .output(path.join(outputsDir, "output_text.mp4"))
      .videoFilter(
        "drawtext=text='Sample Text':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-th-20"
      )
      .videoCodec("libx264")
      .audioCodec("copy")
      .overwrite()
      .run();
    console.log("   ✅ Created output_text.mp4\n");
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 6: Fade in/out
  console.log("6️⃣ Adding fade in/out effects...");
  try {
    await new FFmpeg()
      .input(inputFile)
      .output(path.join(outputsDir, "output_fade.mp4"))
      .videoFilter("fade=t=in:st=0:d=1,fade=t=out:st=4:d=1")
      .audioFilter("afade=t=in:st=0:d=1,afade=t=out:st=4:d=1")
      .duration(5)
      .videoCodec("libx264")
      .audioCodec("aac")
      .overwrite()
      .run();
    console.log("   ✅ Created output_fade.mp4\n");
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  console.log("🎉 All filter examples completed!\n");
}

main().catch(console.error);
