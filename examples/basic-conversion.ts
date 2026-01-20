/**
 * Basic video conversion example
 * Demonstrates the fluent API for simple video conversions
 */
import path from "path";
import fs from "fs";
import { FFmpeg, downloadBinaries, areBinariesDownloaded } from "../src";

async function main(): Promise<void> {
  // Ensure FFmpeg binaries are available
  if (!areBinariesDownloaded()) {
    console.log("Downloading FFmpeg binaries...");
    let lastFile = "";
    await downloadBinaries({
      onProgress: (p) => {
        if (p.filename !== lastFile) {
          if (lastFile) console.log(); // New line for previous file
          lastFile = p.filename;
        }
        process.stdout.write(`\r  ${p.filename}: ${p.percent}%`);
      },
    });
    console.log("\nDownload complete!\n");
  }

  // Use samples/sample.webm as default, or take from command line
  const inputFile =
    process.argv[2] ?? path.join(__dirname, "..", "samples", "sample.webm");

  // Ensure outputs directory exists
  const outputsDir = path.join(__dirname, "..", "outputs");
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }

  const outputFile = process.argv[3] ?? path.join(outputsDir, "output.mp4");

  console.log(`Converting ${inputFile} to ${outputFile}...`);

  const ffmpeg = new FFmpeg();

  try {
    const result = await ffmpeg
      .input(inputFile)
      .output(outputFile)
      .videoCodec("libx264")
      .audioCodec("aac")
      .videoBitrate("2M")
      .audioBitrate("128k")
      .overwrite()
      .on("start", (cmd) => {
        console.log(`\nCommand: ${cmd}\n`);
      })
      .on("progress", (p) => {
        process.stdout.write(
          `\rProgress: ${p.frames} frames, ${p.currentFps} fps, ${p.timemark}`
        );
      })
      .on("end", () => {
        console.log("\n");
      })

      .run();

    console.log(`✅ Conversion complete in ${result.duration}ms`);
  } catch (error) {
    console.error("❌ Conversion failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
