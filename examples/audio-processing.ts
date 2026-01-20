/**
 * Audio processing example
 * Demonstrates various audio extraction and manipulation operations
 */

import path from "path";
import fs from "fs";
import {
  extractAudio,
  convert,
  runCommand,
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

  // Example 1: Extract audio in different formats
  console.log("1️⃣ Extract audio in multiple formats...");

  const formats: ("mp3" | "aac" | "opus" | "flac" | "wav")[] = [
    "mp3",
    "aac",
    "opus",
    "flac",
    "wav",
  ];

  for (const format of formats) {
    try {
      await extractAudio({
        input: inputFile,
        output: path.join(outputsDir, `audio.${format}`),
        format,
        bitrate: format === "flac" || format === "wav" ? undefined : "192k",
        onProgress: (p) =>
          process.stdout.write(`\r   ${format}: ${p.timemark}`),
      });
      console.log(`\n   ✅ ${format}`);
    } catch (error) {
      console.log(`\n   ❌ ${format}: ${error}`);
    }
  }
  console.log("");

  // Example 2: Extract audio with volume adjustment
  console.log("2️⃣ Volume adjustments...");

  const volumes = [
    { level: "0.5", name: "quiet" },
    { level: "2", name: "loud" },
    { level: "3dB", name: "boost_3dB" },
  ];

  for (const { level, name } of volumes) {
    try {
      await extractAudio({
        input: inputFile,
        output: path.join(outputsDir, `audio_${name}.mp3`),
        format: "mp3",
        volume: level,
      });
      console.log(`   ✅ ${name} (volume=${level})`);
    } catch (error) {
      console.log(`   ❌ ${name}: ${error}`);
    }
  }
  console.log("");

  // Example 3: Audio normalization
  console.log("3️⃣ Audio normalization (loudnorm)...");
  try {
    await runCommand({
      args: [
        "-i",
        inputFile,
        "-vn",
        "-af",
        "loudnorm=I=-16:LRA=11:TP=-1.5",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        "-y",
        path.join(outputsDir, "audio_normalized.mp3"),
      ],
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log("\n   ✅ Normalized audio created\n");
  } catch (error) {
    console.log(`\n   ❌ Failed: ${error}\n`);
  }

  // Example 4: Audio fade in/out
  console.log("4️⃣ Audio fade in/out...");
  try {
    await runCommand({
      args: [
        "-i",
        inputFile,
        "-vn",
        "-af",
        "afade=t=in:st=0:d=2,afade=t=out:st=8:d=2",
        "-t",
        "10",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        "-y",
        path.join(outputsDir, "audio_faded.mp3"),
      ],
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log("\n   ✅ Faded audio created\n");
  } catch (error) {
    console.log(`\n   ❌ Failed: ${error}\n`);
  }

  // Example 5: Change sample rate and channels
  console.log("5️⃣ Sample rate and channel variations...");

  const audioSettings = [
    { rate: 22050, channels: 1, name: "22k_mono" },
    { rate: 44100, channels: 2, name: "44k_stereo" },
    { rate: 48000, channels: 2, name: "48k_stereo" },
  ];

  for (const { rate, channels, name } of audioSettings) {
    try {
      await extractAudio({
        input: inputFile,
        output: path.join(outputsDir, `audio_${name}.mp3`),
        format: "mp3",
        sampleRate: rate,
        channels,
      });
      console.log(`   ✅ ${name} (${rate}Hz, ${channels}ch)`);
    } catch (error) {
      console.log(`   ❌ ${name}: ${error}`);
    }
  }
  console.log("");

  // Example 6: Mute video (keep video, remove audio)
  console.log("6️⃣ Create muted video...");
  try {
    await convert({
      input: inputFile,
      output: path.join(outputsDir, "video_muted.mp4"),
      videoCodec: "copy",
      noAudio: true,
    });
    console.log("   ✅ Muted video created\n");
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 7: Audio tempo (speed without pitch change)
  console.log("7️⃣ Audio tempo change (preserves pitch)...");
  try {
    await runCommand({
      args: [
        "-i",
        inputFile,
        "-vn",
        "-af",
        "atempo=1.5", // 1.5x speed, maintains pitch
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        "-y",
        path.join(outputsDir, "audio_tempo_1.5x.mp3"),
      ],
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log("\n   ✅ Tempo-adjusted audio created\n");
  } catch (error) {
    console.log(`\n   ❌ Failed: ${error}\n`);
  }

  console.log("🎉 All audio examples completed!\n");
}

main().catch(console.error);
