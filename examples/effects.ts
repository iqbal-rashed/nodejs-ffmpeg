/**
 * Video effects and transformations example
 * Demonstrates various video effects using the object-based API
 */

import path from "path";
import fs from "fs";
import {
  convert,
  rotate,
  changeSpeed,
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

  // Example 1: Rotation variations
  console.log("1️⃣ Rotation examples...");

  const rotations: {
    angle: 90 | 180 | 270 | "flip" | "vflip";
    name: string;
  }[] = [
    { angle: 90, name: "90cw" },
    { angle: 180, name: "180" },
    { angle: 270, name: "90ccw" },
    { angle: "flip", name: "hflip" },
    { angle: "vflip", name: "vflip" },
  ];

  for (const { angle, name } of rotations) {
    try {
      await rotate({
        input: inputFile,
        output: path.join(outputsDir, `effect_${name}.mp4`),
        angle,
      });
      console.log(`   ✅ ${name}`);
    } catch (error) {
      console.log(`   ❌ ${name}: ${error}`);
    }
  }
  console.log("");

  // Example 2: Speed variations
  console.log("2️⃣ Speed examples...");

  const speeds = [0.5, 1.5, 2, 4];
  for (const speed of speeds) {
    try {
      await changeSpeed({
        input: inputFile,
        output: path.join(outputsDir, `effect_speed_${speed}x.mp4`),
        speed,
        adjustAudio: true,
        onProgress: (p) =>
          process.stdout.write(`\r   ${speed}x: ${p.timemark}`),
      });
      console.log(`\n   ✅ ${speed}x speed`);
    } catch (error) {
      console.log(`\n   ❌ ${speed}x: ${error}`);
    }
  }
  console.log("");

  // Example 3: Color adjustments
  console.log("3️⃣ Color effects...");

  const colorEffects = [
    { name: "bright", filter: "eq=brightness=0.15" },
    { name: "contrast", filter: "eq=contrast=1.5" },
    { name: "saturated", filter: "eq=saturation=2" },
    { name: "vintage", filter: "colorbalance=rs=.3:gs=-.1:bs=-.1" },
    { name: "cool", filter: "colortemperature=temperature=10000" },
  ];

  for (const { name, filter } of colorEffects) {
    try {
      await convert({
        input: inputFile,
        output: path.join(outputsDir, `effect_${name}.mp4`),
        videoCodec: "libx264",
        audioCodec: "copy",
        videoFilter: filter,
        duration: 5, // Only first 5 seconds
      });
      console.log(`   ✅ ${name}`);
    } catch (error) {
      console.log(`   ❌ ${name}: ${error}`);
    }
  }
  console.log("");

  // Example 4: Blur and sharpen
  console.log("4️⃣ Blur and sharpen effects...");

  const sharpnessEffects = [
    { name: "blur_light", filter: "boxblur=2:2" },
    { name: "blur_heavy", filter: "boxblur=10:10" },
    { name: "sharpen", filter: "unsharp=5:5:1.5" },
    { name: "denoise", filter: "nlmeans=s=3:p=7:r=5" },
  ];

  for (const { name, filter } of sharpnessEffects) {
    try {
      await convert({
        input: inputFile,
        output: path.join(outputsDir, `effect_${name}.mp4`),
        videoCodec: "libx264",
        audioCodec: "copy",
        videoFilter: filter,
        duration: 5,
      });
      console.log(`   ✅ ${name}`);
    } catch (error) {
      console.log(`   ❌ ${name}: ${error}`);
    }
  }
  console.log("");

  // Example 5: Artistic effects
  console.log("5️⃣ Artistic effects...");

  const artisticEffects = [
    { name: "negative", filter: "negate" },
    {
      name: "sepia",
      filter:
        "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
    },
    { name: "vignette", filter: "vignette=PI/4" },
    { name: "edge_detect", filter: "edgedetect" },
  ];

  for (const { name, filter } of artisticEffects) {
    try {
      await convert({
        input: inputFile,
        output: path.join(outputsDir, `effect_${name}.mp4`),
        videoCodec: "libx264",
        audioCodec: "copy",
        videoFilter: filter,
        duration: 5,
      });
      console.log(`   ✅ ${name}`);
    } catch (error) {
      console.log(`   ❌ ${name}: ${error}`);
    }
  }

  console.log("\n🎉 All effects examples completed!\n");
}

main().catch(console.error);
