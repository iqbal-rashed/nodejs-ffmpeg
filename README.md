# nodejs-ffmpeg

<div align="center">

**A modern, full-featured FFmpeg wrapper for Node.js with TypeScript support**

[![npm version](https://img.shields.io/npm/v/nodejs-ffmpeg.svg?style=flat-square)](https://www.npmjs.com/package/nodejs-ffmpeg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

---

## ✨ Features

- 🚀 **Auto-Download Binaries** - FFmpeg binaries are automatically downloaded when needed
- 🔗 **Dual API** - Both fluent (chainable) and object-based APIs
- 📦 **TypeScript First** - Full TypeScript support with complete type definitions
- 🎬 **Built-in Presets** - Ready-to-use presets for common conversions
- 📊 **Progress Tracking** - Real-time progress with percentage and time tracking
- 🎯 **FFprobe Integration** - Extract metadata from any media file
- 🌐 **Cross-Platform** - Works on Windows, macOS, and Linux
- ⚡ **ESM & CJS** - Supports both module systems

## 📦 Installation

```bash
npm install nodejs-ffmpeg
# or
yarn add nodejs-ffmpeg
# or
pnpm add nodejs-ffmpeg
```

## 🚀 Quick Start

### Object-Based API (Recommended)

```typescript
import { convert, extractAudio, takeScreenshot } from "nodejs-ffmpeg";

// Convert video
await convert({
  input: "input.mp4",
  output: "output.webm",
  videoCodec: "libvpx-vp9",
  crf: 28,
  onProgress: (p) => console.log(`${p.percent}%`),
});

// Extract audio
await extractAudio({
  input: "video.mp4",
  output: "audio.mp3",
  format: "mp3",
  bitrate: "192k",
});

// Take screenshot
await takeScreenshot({
  input: "video.mp4",
  output: "thumbnail.jpg",
  time: 5,
  width: 1280,
});
```

### Fluent API

```typescript
import { FFmpeg } from "nodejs-ffmpeg";

const result = await new FFmpeg()
  .input("input.mp4")
  .output("output.webm")
  .videoCodec("libvpx-vp9")
  .audioCodec("libopus")
  .on("progress", (p) => console.log(`${p.percent}%`))
  .run();
```

### Run Custom Commands

```typescript
import { runCommand, runCommandString } from "nodejs-ffmpeg";

// Using array arguments
await runCommand({
  args: ["-i", "input.mp4", "-vf", "scale=1280:-1", "-y", "output.mp4"],
  onProgress: (p) => console.log(p.timemark),
});

// Using string command (like terminal)
await runCommandString('-i input.mp4 -vf "scale=1280:-1" -y output.mp4');
```

## 📚 API Reference

### Standalone Functions

| Function                  | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `convert(options)`        | Generic conversion with 50+ options             |
| `extractAudio(options)`   | Extract audio track (mp3, aac, opus, flac, wav) |
| `takeScreenshot(options)` | Capture frame at specific time                  |
| `trim(options)`           | Cut video to time range (fast copy mode)        |
| `compress(options)`       | Reduce file size with quality presets           |
| `merge(options)`          | Combine video + audio files                     |
| `concat(options)`         | Join multiple videos                            |
| `toGif(options)`          | Create animated GIF                             |
| `addWatermark(options)`   | Overlay image with position/opacity             |
| `changeSpeed(options)`    | Speed up/slow down with audio sync              |
| `rotate(options)`         | Rotate 90/180/270 or flip                       |
| `runCommand(options)`     | Execute custom FFmpeg command                   |

### Convert Options

```typescript
await convert({
  // Required
  input: "input.mp4",
  output: "output.mp4",

  // Video Options
  videoCodec: "libx264", // 'libx264', 'libx265', 'libvpx-vp9', 'copy'
  videoBitrate: "2M", // Video bitrate
  crf: 23, // Quality (0-51, lower = better)
  preset: "fast", // 'ultrafast', 'fast', 'medium', 'slow'
  fps: 30, // Frame rate
  size: "1920x1080", // Resolution
  scale: "1280:-1", // Scale filter

  // Audio Options
  audioCodec: "aac", // 'aac', 'libopus', 'libmp3lame', 'copy'
  audioBitrate: "128k", // Audio bitrate
  sampleRate: 44100, // Sample rate
  channels: 2, // Audio channels

  // Timing
  seek: 10, // Start time (seconds)
  duration: 60, // Duration (seconds)

  // Filters
  videoFilter: "scale=1280:-1,eq=brightness=0.1",
  audioFilter: "volume=2",

  // Stream Selection
  noVideo: false, // Remove video
  noAudio: false, // Remove audio

  // General
  overwrite: true, // Overwrite output
  threads: 4, // Thread count
  hwAccel: "cuda", // Hardware acceleration

  // Callbacks
  onProgress: (p) => {}, // Progress updates
  onStart: (cmd) => {}, // Command started
});
```

### FFprobe - Metadata Extraction

```typescript
import { FFprobe, getMetadata, getDuration } from "nodejs-ffmpeg";

// Quick helpers
const duration = await getDuration("video.mp4");
const metadata = await getMetadata("video.mp4");

// Full API
const ffprobe = new FFprobe();
const info = await ffprobe.getMetadata("video.mp4");

console.log(info.format.duration); // Duration in seconds
console.log(info.format.size); // File size
console.log(info.streams[0].codec_name); // Codec info
```

### Video Presets (Fluent API)

```typescript
import { toMP4, toWebM, toHEVC, toHLS, toDASH } from "nodejs-ffmpeg";

// Convert to MP4 (H.264)
await toMP4("input.webm", "output.mp4", { quality: "medium" }).run();

// Convert to WebM (VP9)
await toWebM("input.mp4", "output.webm", { quality: "high" }).run();

// Convert to HEVC (H.265)
await toHEVC("input.mp4", "output.mp4", { crf: 28 }).run();

// Create HLS streaming output
await toHLS("input.mp4", "./hls/", { segmentDuration: 4 }).run();

// Create DASH streaming output
await toDASH("input.mp4", "./dash/", { segmentDuration: 4 }).run();
```

### Binary Management

```typescript
import {
  downloadBinaries,
  areBinariesDownloaded,
  getFFmpegPath,
  setFFmpegPath,
} from "nodejs-ffmpeg";

// Check if binaries exist
if (!areBinariesDownloaded()) {
  await downloadBinaries({
    onProgress: (p) => console.log(`${p.filename}: ${p.percent}%`),
  });
}

// Use custom binary path
setFFmpegPath("/usr/local/bin/ffmpeg");
```

## 📁 Examples

The `examples/` directory contains comprehensive examples:

| Example               | Description                       |
| --------------------- | --------------------------------- |
| `basic-conversion.ts` | Simple video conversion           |
| `object-api.ts`       | Object-based API usage            |
| `custom-cli.ts`       | Custom FFmpeg commands            |
| `probe-metadata.ts`   | FFprobe metadata extraction       |
| `presets.ts`          | Built-in presets                  |
| `filters.ts`          | Video filters and effects         |
| `effects.ts`          | Color, blur, rotation effects     |
| `audio-processing.ts` | Audio extraction and manipulation |
| `thumbnails.ts`       | Thumbnails and previews           |
| `batch-processing.ts` | Process multiple files            |
| `streaming.ts`        | HLS/DASH streaming                |

Run any example:

```bash
npx tsx examples/object-api.ts
```

## 🔧 Requirements

- Node.js 18.0.0 or higher
- FFmpeg binaries (auto-downloaded or system-installed)

## 📄 License

MIT © 2024

---

<div align="center">
  <sub>Built with ❤️ for the Node.js community</sub>
</div>
