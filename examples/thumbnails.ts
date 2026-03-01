/**
 * Thumbnails and preview generation example
 * Demonstrates creating thumbnails, preview strips, and animated previews
 */

import path from "path";
import fs from "fs";
import {
  takeScreenshot,
  toGif,
  runCommand,
  FFprobe,
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
  const outputsDir = path.join(__dirname, "..", "outputs", "thumbnails");
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }

  console.log(`\n📁 Input: ${inputFile}\n`);

  // Get video duration first
  const ffprobe = new FFprobe();
  let duration = 10;
  try {
    duration = await ffprobe.getDuration(inputFile);
    console.log(`📊 Video duration: ${duration.toFixed(1)}s\n`);
  } catch {
    console.log("⚠️ Could not determine duration, using default\n");
  }

  // Example 1: Single thumbnail at different times
  console.log("1️⃣ Thumbnails at different times...");

  const times = [0, duration * 0.25, duration * 0.5, duration * 0.75];
  for (let i = 0; i < times.length; i++) {
    try {
      await takeScreenshot({
        input: inputFile,
        output: path.join(outputsDir, `thumb_${i + 1}.jpg`),
        time: times[i],
        width: 320,
        quality: 2,
      });
      console.log(`   ✅ Thumbnail ${i + 1} at ${(times[i] ?? 0).toFixed(1)}s`);
    } catch (error) {
      console.log(`   ❌ Thumbnail ${i + 1}: ${error}`);
    }
  }
  console.log("");

  // Example 2: Different sizes
  console.log("2️⃣ Thumbnails at different sizes...");

  const sizes = [
    { width: 160, name: "tiny" },
    { width: 320, name: "small" },
    { width: 640, name: "medium" },
    { width: 1280, name: "large" },
  ];

  for (const { width, name } of sizes) {
    try {
      await takeScreenshot({
        input: inputFile,
        output: path.join(outputsDir, `thumb_${name}.jpg`),
        time: duration / 2,
        width,
      });
      console.log(`   ✅ ${name} (${width}px)`);
    } catch (error) {
      console.log(`   ❌ ${name}: ${error}`);
    }
  }
  console.log("");

  // Example 3: Thumbnail grid (contact sheet)
  console.log("3️⃣ Creating thumbnail grid (3x3)...");
  try {
    const interval = duration / 10; // 9 frames + margins
    await runCommand({
      args: [
        "-i",
        inputFile,
        "-vf",
        `fps=1/${interval.toFixed(2)},scale=320:-1,tile=3x3`,
        "-frames:v",
        "1",
        "-y",
        path.join(outputsDir, "contact_sheet.jpg"),
      ],
    });
    console.log("   ✅ Contact sheet created\n");
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 4: Animated GIF preview
  console.log("4️⃣ Creating animated GIF preview...");
  try {
    await toGif({
      input: inputFile,
      output: path.join(outputsDir, "preview.gif"),
      start: duration * 0.2,
      duration: 3,
      fps: 10,
      width: 320,
      loop: 0,
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log("\n   ✅ GIF preview created\n");
  } catch (error) {
    console.log(`\n   ❌ Failed: ${error}\n`);
  }

  // Example 5: Animated WebP (better quality than GIF)
  console.log("5️⃣ Creating animated WebP preview...");
  try {
    await runCommand({
      args: [
        "-ss",
        (duration * 0.2).toString(),
        "-t",
        "3",
        "-i",
        inputFile,
        "-vf",
        "fps=10,scale=320:-1",
        "-loop",
        "0",
        "-y",
        path.join(outputsDir, "preview.webp"),
      ],
      onProgress: (p) => process.stdout.write(`\r   ${p.timemark}`),
    });
    console.log("\n   ✅ WebP preview created\n");
  } catch (error) {
    console.log(`\n   ❌ Failed: ${error}\n`);
  }

  // Example 6: Video sprite sheet (for video players)
  console.log("6️⃣ Creating video sprite sheet...");
  try {
    const frames = 10;
    const frameInterval = duration / frames;
    await runCommand({
      args: [
        "-i",
        inputFile,
        "-vf",
        `fps=1/${frameInterval.toFixed(2)},scale=160:-1,tile=${frames}x1`,
        "-frames:v",
        "1",
        "-y",
        path.join(outputsDir, "sprite_sheet.jpg"),
      ],
    });
    console.log(`   ✅ Sprite sheet created (${frames} frames)\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Example 7: Video poster (high quality first frame)
  console.log("7️⃣ Creating video poster...");
  try {
    await takeScreenshot({
      input: inputFile,
      output: path.join(outputsDir, "poster.jpg"),
      time: 0,
      quality: 1, // Best quality
    });
    console.log("   ✅ Poster created\n");
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  console.log(`🎉 All thumbnail examples completed!`);
  console.log(`📂 Output: ${outputsDir}\n`);
}

main().catch(console.error);
