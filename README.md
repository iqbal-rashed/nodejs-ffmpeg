# nodejs-ffmpeg

<div align="center">

**The Ultimate FFmpeg Wrapper for Node.js**
modern • type-safe • cross-platform • zero-dependencies

[![npm version](https://img.shields.io/npm/v/nodejs-ffmpeg.svg?style=flat-square)](https://www.npmjs.com/package/nodejs-ffmpeg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dm/nodejs-ffmpeg.svg?style=flat-square)](https://www.npmjs.com/package/nodejs-ffmpeg)

</div>

---

**nodejs-ffmpeg** is a modern, lightweight, and type-safe wrapper for FFmpeg. It provides a beautiful Promise-based API for all your media processing needs, from simple format conversions to complex filter graphs.

Unlike other wrappers, it manages its own binaries (optional auto-download), supports standard `AbortController` for cancellation, includes built-in batch processing utilities, and now supports **buffer/stream inputs**, **two-pass encoding**, **thumbnail sheets**, and much more. And best of all? **Zero runtime dependencies.**

## ✨ Features

- **🛡️ Type-Safe**: Built from the ground up with TypeScript for a superior Dev Experience.
- **🚀 Zero Dependencies**: Lightweight with no production dependencies to bloat your `node_modules`.
- **📦 Auto-Binaries**: Automatically downloads platform-specific FFmpeg/FFprobe binaries on first run.
- **🛑 Cancellation**: Native `AbortController` support for cancelling operations.
- **🔄 Batch Processing**: Built-in utility for concurrent file processing.
- **⚡ Probe Caching**: Instant metadata retrieval for repeated calls.
- **🔗 Dual API**: Choose between a simple Object API or a chainable Fluent API.
- **🎬 30+ Presets**: Ready-to-use functions for common tasks (HLS, DASH, GIF, etc.).
- **📊 Progress**: Accurate real-time progress tracking with **automatic duration detection**.
- **🆕 Buffer/Stream Support**: Process video/audio from buffers and streams (perfect for serverless).
- **🆕 Two-Pass Encoding**: Professional-quality encoding with better bitrate control.
- **🆕 Thumbnail Sheets**: Generate contact sheets with multiple video frames.
- **🆕 Conversion Queue**: Advanced concurrency control with pause/resume.
- **🆕 Retry Mechanism**: Automatic retry with exponential backoff on failures.
- **🆕 Progress Throttling**: Prevent callback spam with smart throttling.
- **🆕 Input Validation**: Comprehensive validation helpers for all parameters.

## 📦 Installation

```bash
npm install nodejs-ffmpeg
# or
yarn add nodejs-ffmpeg
# or
pnpm add nodejs-ffmpeg
# or
bun add nodejs-ffmpeg
```

## 🚀 Quick Start

### Simple Conversion

The modern object-based API is the recommended way to use the library.

```typescript
import { convert } from "nodejs-ffmpeg";

await convert({
  input: "input.mov",
  output: "output.mp4",
  videoCodec: "libx264",
  crf: 23,
  preset: "medium",
  onProgress: (progress) => {
    console.log(`Processing: ${progress.percent.toFixed(1)}%`);
  },
});
```

### Buffer/Stream Inputs (NEW!)

Process video/audio from buffers or streams - perfect for serverless environments!

```typescript
import { convert } from "nodejs-ffmpeg";
import fs from "fs";

// From Buffer
const buffer = fs.readFileSync("video.mp4");
await convert({
  input: buffer,
  inputFormat: "mp4", // Required for buffer/stream inputs
  output: "output.webm",
  videoCodec: "libvpx-vp9",
});

// From Stream
const stream = fs.createReadStream("video.mp4");
await convert({
  input: stream,
  inputFormat: "mp4",
  output: "output.webm",
});
```

### Metadata (FFprobe)

Now with caching and quick helper functions!

```typescript
import {
  getMetadata,
  getDuration,
  getVideoCodec,
  getAspectRatio,
  getFrameRate
} from "nodejs-ffmpeg";

const meta = await getMetadata("video.mp4");
console.log(`Duration: ${meta.format.duration}s`);
console.log(`Resolution: ${meta.streams[0].width}x${meta.streams[0].height}`);

// Quick helpers (NEW!)
const codec = await getVideoCodec("video.mp4"); // "h264"
const ratio = await getAspectRatio("video.mp4"); // "16:9"
const fps = await getFrameRate("video.mp4"); // 29.97
const duration = await getDuration("audio.mp3");
```

## 💡 Core Concepts

### 1. Cancellation

Cancel any running operation using standard `AbortController`. This works for conversions, probing, and all other functions.

```typescript
import { convert, FFmpegAbortError } from "nodejs-ffmpeg";

const controller = new AbortController();

const promise = convert({
  input: "huge-file.mkv",
  output: "output.mp4",
  signal: controller.signal, // Pass the signal
});

// Cancel after 5 seconds
setTimeout(() => {
  controller.abort();
}, 5000);

try {
  await promise;
} catch (err) {
  if (err instanceof FFmpegAbortError) {
    console.log("Conversion was cancelled!");
  }
}
```

### 2. Batch Processing

Process thousands of files efficiently with concurrency control.

```typescript
import { batchProcess } from "nodejs-ffmpeg";

const files = ["one.mov", "two.mov", "three.mov"];

const results = await batchProcess(
  {
    items: files,
    concurrency: 4, // Run 4 conversions in parallel
    onItemComplete: (file, index, total) => {
      console.log(`Completed ${index + 1}/${total}: ${file}`);
    },
  },
  async (file) => {
    return await convert({ input: file, output: `${file}.mp4` });
  }
);

console.log(`Success: ${results.filter((r) => r.success).length}`);
```

### 3. Conversion Queue (NEW!)

Advanced queue management with pause/resume/cancel capabilities.

```typescript
import { createQueue } from "nodejs-ffmpeg";

const queue = createQueue(4); // Process 4 items concurrently

// Add tasks to queue
queue.add(async () => {
  return convert({ input: "video1.mp4", output: "output1.mp4" });
});

queue.add(async () => {
  return convert({ input: "video2.mp4", output: "output2.mp4" });
});

// Pause processing
queue.pause();

// Resume later
queue.start();

// Get statistics
console.log(queue.stats); // { pending: 1, active: 2, total: 3, paused: false }

// Cancel all tasks
queue.cancel();
```

### 4. Retry with Exponential Backoff (NEW!)

Automatically retry failed operations with smart backoff.

```typescript
import { convertWithRetry } from "nodejs-ffmpeg";

await convertWithRetry(
  async () => {
    return convert({
      input: "unstable-source.mp4",
      output: "output.mp4",
    });
  },
  {
    maxAttempts: 3,
    retryDelay: 1000, // Start with 1s delay
    retryOnExitCode: [1, 255], // Retry on specific exit codes
  }
);
```

### 5. Two-Pass Encoding (NEW!)

Professional-quality encoding with better bitrate control.

```typescript
import { convertTwoPass } from "nodejs-ffmpeg";

await convertTwoPass({
  input: "input.mp4",
  output: "output.mp4",
  videoCodec: "libx264",
  crf: 23,
  maxBitrate: "5M",
  bufferSize: "10M",
});
```

### 6. Thumbnail Sheets (NEW!)

Generate contact sheets with multiple video frames in a single image.

```typescript
import { generateThumbnailSheet } from "nodejs-ffmpeg";

await generateThumbnailSheet({
  input: "video.mp4",
  output: "thumbnails.jpg",
  columns: 4,
  rows: 4,
  interval: 10, // Capture frame every 10 seconds
  tileSize: "320x180",
});
```

### 7. Progress Throttling (NEW!)

Prevent callback spam with smart throttling.

```typescript
import { convert, createThrottledProgress } from "nodejs-ffmpeg";

await convert({
  input: "video.mp4",
  output: "output.mp4",
  onProgress: createThrottledProgress({
    onProgress: (progress) => {
      console.log(`Progress: ${progress.percent}%`); // Called max once per 100ms
    },
    throttleMs: 100,
  }),
});
```

### 8. Input Validation (NEW!)

Comprehensive validation helpers.

```typescript
import {
  validateInput,
  validateOutputPath,
  validateQuality,
  validateBitrate,
  ValidationError
} from "nodejs-ffmpeg";

try {
  await validateInput("video.mp4");
  await validateOutputPath("output/output.mp4");
  validateQuality(23); // CRF value
  validateBitrate("5M");
} catch (err) {
  if (err instanceof ValidationError) {
    console.error("Validation error:", err.message);
  }
}
```

### 9. Probe Cache

Significantly speed up applications that frequently check metadata for the same files.

```typescript
import { probeCache, getMetadata } from "nodejs-ffmpeg";

probeCache.enabled = true;
probeCache.maxAge = 1000 * 60 * 5; // Cache for 5 minutes
probeCache.maxSize = 200; // Cache up to 200 entries

// First call: Runs ffprobe (slow)
await getMetadata("video.mp4");

// Second call: Returns from cache (instant)
await getMetadata("video.mp4");
```

## 📚 API Reference

### Standalone Functions (Recommended)

| Function                    | Description                                              |
| :-------------------------- | :------------------------------------------------------- |
| `convert(opts)`             | Universal conversion with full control. Now supports **buffers/streams**! |
| `convertTwoPass(opts)`      | **NEW!** Two-pass encoding for professional quality.     |
| `extractAudio(opts)`        | Extract audio track (MP3, AAC, FLAC, etc).               |
| `takeScreenshot(opts)`      | Capture specific frames as images.                       |
| `compress(opts)`            | Smart video compression optimized for web.               |
| `trim(opts)`                | Cut video/audio without re-encoding (if possible).       |
| `concat(opts)`              | Stitch multiple files together.                          |
| `merge(opts)`               | Combine video source with audio source.                  |
| `toGif(opts)`               | High-quality GIF generation with palette optimization.    |
| `addWatermark(opts)`        | Overlay images with positioning and opacity.             |
| `changeSpeed(opts)`         | Time-stretch video and audio (stops "chipmunk" effect).  |
| `rotate(opts)`              | Rotate, flip, or transpose video.                        |
| `generateThumbnailSheet`    | **NEW!** Generate thumbnail contact sheets.              |
| `runCommand(opts)`          | Run arbitrary FFmpeg arguments.                          |

### Metadata Functions (FFprobe)

| Function                | Description                                      |
| :---------------------- | :----------------------------------------------- |
| `getMetadata(path)`     | Full metadata with **automatic caching**.        |
| `getDuration(path)`     | Quick duration in seconds.                       |
| `getVideoCodec(path)`   | **NEW!** Get video codec name.                   |
| `getAudioCodec(path)`   | **NEW!** Get audio codec name.                   |
| `getAspectRatio(path)`  | **NEW!** Get aspect ratio (e.g., "16:9").        |
| `getFrameRate(path)`    | **NEW!** Get frame rate as number.               |
| `getPixelFormat(path)`  | **NEW!** Get pixel format.                       |
| `getAudioSampleRate(path)` | **NEW!** Get audio sample rate.              |
| `getAudioChannels(path)`| **NEW!** Get number of audio channels.           |

### Queue & Retry (NEW!)

| Function               | Description                                      |
| :--------------------- | :----------------------------------------------- |
| `createQueue(concurrency)` | Create a conversion queue with pause/resume.  |
| `convertWithRetry(fn, opts)` | Execute with automatic retry and backoff.  |

### Progress Utilities (NEW!)

| Function                | Description                                      |
| :---------------------- | :----------------------------------------------- |
| `createThrottledProgress` | Throttle progress callbacks.                 |
| `createIntervalProgress`  | Fire progress at specific intervals.          |
| `ProgressAggregator`      | Aggregate multiple progress listeners.       |

### Validation Helpers (NEW!)

| Function                | Description                                      |
| :---------------------- | :----------------------------------------------- |
| `validateInput`         | Validate input file/buffer/stream.               |
| `validateOutputPath`    | Validate output directory exists.                |
| `validateQuality`       | Validate CRF value (0-51).                       |
| `validateBitrate`       | Validate bitrate format.                         |
| `validateResolution`    | Validate resolution format.                      |
| `validateFrameRate`     | Validate frame rate.                             |
| `validateSampleRate`    | Validate audio sample rate.                      |
| `validateTime`          | Validate time format.                            |
| `validateSpeed`         | Validate speed factor.                           |
| `validateRotation`      | Validate rotation angle.                         |

### Presets (Video)

Helpers for common formats, accessible via `presets.video.*` or top-level exports.

- `toMP4`, `toWebM`, `toHEVC`
- `toHLS` (HTTP Live Streaming), `toDASH`
- `toGifPreset`
- `extractThumbnail`

### Presets (Audio)

Helpers for audio conversion.

- `toMP3`, `toAAC`, `toWAV`, `toFLAC`, `toOpus`
- `normalizeAudio`

### Presets (Advanced)

- `streamToRTMP` (Live streaming)
- `stabilize` (Remove camera shake)
- `burnSubtitles` (Hardcode subtitles)

## ⚠️ Error Handling

We provide specific error classes to help you handle edge cases gracefully.

```typescript
import {
  FileExistsError,
  InvalidInputError,
  CodecNotFoundError,
  FFmpegAbortError,
  ValidationError
} from "nodejs-ffmpeg";

try {
  await convert({ ... });
} catch (err) {
  if (err instanceof FileExistsError) {
    // Ask user to confirm overwrite
  } else if (err instanceof InvalidInputError) {
    // Warn about missing file
  } else if (err instanceof ValidationError) {
    // Handle validation errors
  } else {
    // Generic error
    console.error(err);
  }
}
```

## ❓ FAQ

**Q: Do I need to install FFmpeg manually?**
A: No! By default, `nodejs-ffmpeg` will detect your OS and download the correct binaries to a local cache folder on the first run. You can also provide a custom path via `setFFmpegPath()`.

**Q: Does it work on serverless/Lambda?**
A: Yes, and now it's even better! With the new **buffer/stream input support**, you can process video/audio without writing to disk first. The zero-dependency nature makes it ideal for bundle-size constrained environments.

**Q: Why standard AbortController instead of a custom `.cancel()` method?**
A: `AbortController` is the web standard for cancellation. It allows you to pass the same signal to multiple operations (e.g., cancel a database query and an FFmpeg conversion simultaneously) and integrates with modern Node.js and browser APIs.

**Q: How do I process videos from URLs in a serverless function?**
A: Download the video to a buffer, then pass it to `convert()` with the `inputFormat` option. See the "Buffer/Stream Inputs" example above.

**Q: What's two-pass encoding and when should I use it?**
A: Two-pass encoding analyzes the video in the first pass to determine optimal bitrate allocation, then encodes in the second pass. Use it when you need precise bitrate control (e.g., for streaming at a specific target bitrate).

## 📄 License

MIT © [Rashed Iqbal](https://github.com/iqbal-rashed)
