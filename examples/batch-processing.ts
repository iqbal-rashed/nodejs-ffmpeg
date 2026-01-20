/**
 * Batch processing example
 * Demonstrates processing multiple files with different operations
 */

import path from "path";
import fs from "fs";
import {
  convert,
  compress,
  takeScreenshot,
  FFprobe,
  downloadBinaries,
  areBinariesDownloaded,
} from "../src";

interface VideoFile {
  path: string;
  name: string;
  duration?: number;
}

async function main(): Promise<void> {
  // Ensure FFmpeg binaries are available
  if (!areBinariesDownloaded()) {
    console.log("Downloading FFmpeg binaries...\n");
    await downloadBinaries();
  }

  // Get input directory from args or use samples
  const inputDir = process.argv[2] ?? path.join(__dirname, "..", "samples");

  // Ensure outputs directory exists
  const outputsDir = path.join(__dirname, "..", "outputs", "batch");
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }

  // Find video files
  const videoExtensions = [".mp4", ".webm", ".mkv", ".avi", ".mov"];
  const files: VideoFile[] = [];

  if (fs.existsSync(inputDir)) {
    const entries = fs.readdirSync(inputDir);
    for (const entry of entries) {
      const ext = path.extname(entry).toLowerCase();
      if (videoExtensions.includes(ext)) {
        files.push({
          path: path.join(inputDir, entry),
          name: path.basename(entry, ext),
        });
      }
    }
  }

  if (files.length === 0) {
    console.log("No video files found in:", inputDir);
    console.log("Usage: npx tsx examples/batch-processing.ts <directory>");
    return;
  }

  console.log(`\n📁 Found ${files.length} video file(s) in ${inputDir}\n`);

  // Probe all files first
  console.log("📊 Analyzing files...\n");
  const ffprobe = new FFprobe();
  for (const file of files) {
    try {
      const duration = await ffprobe.getDuration(file.path);
      file.duration = duration;
      console.log(`   ${file.name}: ${duration.toFixed(1)}s`);
    } catch {
      console.log(`   ${file.name}: Unable to probe`);
    }
  }
  console.log("");

  // Process each file
  let processed = 0;
  let failed = 0;

  for (const file of files) {
    console.log(`\n🎬 Processing: ${file.name}`);

    // 1. Take thumbnail
    console.log("   📸 Creating thumbnail...");
    try {
      await takeScreenshot({
        input: file.path,
        output: path.join(outputsDir, `${file.name}_thumb.jpg`),
        time: (file.duration ?? 1) / 2, // Middle of video
        width: 320,
      });
      console.log("      ✅ Thumbnail created");
    } catch (error) {
      console.log(`      ❌ Failed: ${error}`);
    }

    // 2. Create compressed version
    console.log("   📦 Compressing video...");
    try {
      await compress({
        input: file.path,
        output: path.join(outputsDir, `${file.name}_compressed.mp4`),
        quality: "medium",
        preset: "fast",
        scale: "1280:-1",
        onProgress: (p) => {
          if (file.duration && p.percent !== undefined) {
            process.stdout.write(`\r      Progress: ${p.percent.toFixed(0)}%`);
          } else {
            process.stdout.write(`\r      ${p.timemark}`);
          }
        },
      });
      console.log("\n      ✅ Compression complete");
      processed++;
    } catch (error) {
      console.log(`\n      ❌ Failed: ${error}`);
      failed++;
    }

    // 3. Create web-ready version
    console.log("   🌐 Creating web version...");
    try {
      await convert({
        input: file.path,
        output: path.join(outputsDir, `${file.name}_web.mp4`),
        videoCodec: "libx264",
        audioCodec: "aac",
        crf: 28,
        preset: "fast",
        scale: "854:-1", // 480p width
        pixelFormat: "yuv420p",
        outputOptions: ["-movflags", "+faststart"],
        onProgress: (p) => {
          process.stdout.write(`\r      ${p.timemark}`);
        },
      });
      console.log("\n      ✅ Web version created");
    } catch (error) {
      console.log(`\n      ❌ Failed: ${error}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📋 Batch Processing Summary");
  console.log("=".repeat(50));
  console.log(`   Total files: ${files.length}`);
  console.log(`   Processed:   ${processed}`);
  console.log(`   Failed:      ${failed}`);
  console.log(`   Output:      ${outputsDir}`);
  console.log("");
}

main().catch(console.error);
