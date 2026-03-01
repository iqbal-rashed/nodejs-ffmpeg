/**
 * Custom CLI command examples
 * Demonstrates running raw FFmpeg commands using runCommand and runCommandString
 */

import path from "path";
import fs from "fs";
import {
  runCommand,
  runCommandString,
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
    process.argv[2] ?? path.join(__dirname, "..", "fixtures", "test-video.mp4");

  // Ensure outputs directory exists
  const outputsDir = path.join(__dirname, "..", "outputs");
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }

  console.log(`\n📁 Input: ${inputFile}\n`);

  // Example 1: Run command with array of arguments
  console.log("1️⃣ runCommand with array arguments...");
  try {
    const result = await runCommand({
      args: [
        "-i",
        inputFile,
        "-vf",
        "scale=640:-1",
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-y",
        path.join(outputsDir, "custom_scaled.mp4"),
      ],
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
      onStart: (cmd) => {
        console.log(`\n   Command: ${cmd.slice(0, 80)}...`);
      },
    });
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 2: Run command from string
  console.log("2️⃣ runCommandString with string command...");
  try {
    const output = path.join(outputsDir, "custom_string.mp4");
    const result = await runCommandString(
      `-i "${inputFile}" -vf "eq=brightness=0.1:contrast=1.2" -c:a copy -y "${output}"`,
      {
        onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
      }
    );
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 3: Complex filter graph
  console.log("3️⃣ Complex filter: fade in/out...");
  try {
    const result = await runCommand({
      args: [
        "-i",
        inputFile,
        "-vf",
        "fade=t=in:st=0:d=1,fade=t=out:st=4:d=1",
        "-af",
        "afade=t=in:st=0:d=1,afade=t=out:st=4:d=1",
        "-t",
        "5",
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-y",
        path.join(outputsDir, "custom_fade.mp4"),
      ],
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 4: Picture-in-picture (if you have two video files)
  console.log("4️⃣ Extract audio using custom command...");
  try {
    const result = await runCommand({
      args: [
        "-i",
        inputFile,
        "-vn",
        "-acodec",
        "libmp3lame",
        "-b:a",
        "320k",
        "-y",
        path.join(outputsDir, "custom_audio.mp3"),
      ],
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 5: Generate video from color with text overlay
  console.log("5️⃣ Generate color video with text...");
  try {
    const result = await runCommand({
      args: [
        "-f",
        "lavfi",
        "-i",
        "color=c=blue:s=1280x720:d=5",
        "-vf",
        "drawtext=text='Hello FFmpeg':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2",
        "-c:v",
        "libx264",
        "-r",
        "30",
        "-y",
        path.join(outputsDir, "custom_generated.mp4"),
      ],
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log(`\n   ✅ Done in ${result.duration}ms\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 6: Get video info (no output file)
  console.log("6️⃣ Get video info with stderr...");
  try {
    const lines: string[] = [];
    await runCommand({
      args: ["-i", inputFile, "-f", "null", "-"],
      onStderr: (line) => {
        if (line.includes("Duration:") || line.includes("Stream")) {
          lines.push(line.trim());
        }
      },
    }).catch(() => {
      console.log("   ❌ Failed: ");
    }); // Ignore exit code for info-only command

    console.log("   Video info:");
    lines.slice(0, 4).forEach((line) => {
      console.log(`     ${line.slice(0, 70)}`);
    });
    console.log("");
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  console.log("🎉 All custom CLI examples completed!\n");
}

main().catch(console.error);
