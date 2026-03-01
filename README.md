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

## Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [API Styles](#-api-styles)
  - [Object API (Recommended)](#object-api-recommended)
  - [Fluent API](#fluent-api)
- [Core Concepts](#-core-concepts)
- [API Reference](#-api-reference)
- [Error Handling](#-error-handling)
- [Examples](#-examples)
- [FAQ](#-faq)
- [License](#-license)

## ✨ Features

- **🛡️ Type-Safe**: Built from the ground up with TypeScript for a superior Dev Experience
- **🚀 Zero Dependencies**: Lightweight with no production dependencies to bloat your `node_modules`
- **📦 Auto-Binaries**: Automatically downloads platform-specific FFmpeg/FFprobe binaries on first run
- **🛑 Cancellation**: Native `AbortController` support for cancelling operations
- **🔄 Batch Processing**: Built-in utility for concurrent file processing
- **⚡ Probe Caching**: Instant metadata retrieval for repeated calls
- **🔗 Dual API**: Choose between a simple Object API or a chainable Fluent API
- **🎬 30+ Presets**: Ready-to-use functions for common tasks (HLS, DASH, GIF, etc.)
- **📊 Progress**: Accurate real-time progress tracking with automatic duration detection
- **🆕 Buffer/Stream Support**: Process video/audio from buffers and streams (perfect for serverless)
- **🆕 Two-Pass Encoding**: Professional-quality encoding with better bitrate control
- **🆕 Thumbnail Sheets**: Generate contact sheets with multiple video frames
- **🆕 Conversion Queue**: Advanced concurrency control with pause/resume
- **🆕 Retry Mechanism**: Automatic retry with exponential backoff on failures
- **🆕 Progress Throttling**: Prevent callback spam with smart throttling
- **🆕 Input Validation**: Comprehensive validation helpers for all parameters

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

### Simple Conversion (Object API)

The modern object-based API is the recommended way to use the library:

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

### Or Use the Fluent API

For those who prefer method chaining:

```typescript
import { FFmpeg } from "nodejs-ffmpeg";

await new FFmpeg()
  .input("input.mov")
  .output("output.mp4")
  .videoCodec("libx264")
  .videoBitrate("2500k")
  .audioCodec("aac")
  .on("progress", (progress) => console.log(`${progress.percent}%`))
  .run();
```

## 📖 API Styles

### Object API (Recommended)

Simple, declarative configuration with full TypeScript intellisense:

```typescript
import { convert, extractAudio, takeScreenshot } from "nodejs-ffmpeg";

// Convert video
await convert({
  input: "video.mov",
  output: "video.mp4",
  videoCodec: "libx264",
  crf: 23,
});

// Extract audio
await extractAudio({
  input: "video.mp4",
  output: "audio.mp3",
  bitrate: "192k",
});

// Take screenshot
await takeScreenshot({
  input: "video.mp4",
  output: "frame.jpg",
  time: 5, // at 5 seconds
  width: 1280,
});
```

### Fluent API

Chainable methods for complex workflows:

```typescript
import { FFmpeg } from "nodejs-ffmpeg";

await new FFmpeg()
  .input("input.mp4")
  .output("output.mp4")
  .videoFilter("scale=1280:-1") // Resize to 1280px width
  .videoFilter("fps=30")        // Set to 30fps
  .videoCodec("libx264")
  .audioCodec("aac")
  .audioBitrate("128k")
  .overwrite()
  .run();
```

## 💡 Core Concepts

### Buffer/Stream Inputs

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

Get comprehensive media information with caching and quick helper functions:

```typescript
import {
  getMetadata,
  getDuration,
  getVideoCodec,
  getAspectRatio,
  getFrameRate
} from "nodejs-ffmpeg";

// Full metadata
const meta = await getMetadata("video.mp4");
console.log(`Duration: ${meta.format.duration}s`);
console.log(`Resolution: ${meta.streams[0].width}x${meta.streams[0].height}`);

// Quick helpers
const codec = await getVideoCodec("video.mp4");      // "h264"
const ratio = await getAspectRatio("video.mp4");     // "16:9"
const fps = await getFrameRate("video.mp4");         // 29.97
const duration = await getDuration("audio.mp3");     // 180.5
```

### Cancellation with AbortController

Cancel any running operation using standard `AbortController`:

```typescript
import { convert, FFmpegAbortError } from "nodejs-ffmpeg";

const controller = new AbortController();

const promise = convert({
  input: "huge-file.mkv",
  output: "output.mp4",
  signal: controller.signal,
});

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  await promise;
} catch (err) {
  if (err instanceof FFmpegAbortError) {
    console.log("Conversion was cancelled!");
  }
}
```

### Batch Processing

Process thousands of files efficiently with concurrency control:

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

### Conversion Queue

Advanced queue management with pause/resume/cancel capabilities:

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

### Retry with Exponential Backoff

Automatically retry failed operations:

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

### Two-Pass Encoding

Professional-quality encoding with better bitrate control:

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

### Thumbnail Sheets

Generate contact sheets with multiple video frames in a single image:

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

### Progress Throttling

Prevent callback spam with smart throttling:

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

### Input Validation

Comprehensive validation helpers:

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

### Probe Cache

Significantly speed up applications that frequently check metadata:

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

### Conversion Functions

| Function                    | Description                                              |
| :-------------------------- | :------------------------------------------------------- |
| `convert(opts)`             | Universal conversion with full control. Supports **buffers/streams**! |
| `convertTwoPass(opts)`      | Two-pass encoding for professional quality               |
| `extractAudio(opts)`        | Extract audio track (MP3, AAC, FLAC, etc)                |
| `takeScreenshot(opts)`      | Capture specific frames as images                        |
| `compress(opts)`            | Smart video compression optimized for web                |
| `trim(opts)`                | Cut video/audio without re-encoding (if possible)        |
| `concat(opts)`              | Stitch multiple files together                           |
| `merge(opts)`               | Combine video source with audio source                   |
| `toGif(opts)`               | High-quality GIF generation with palette optimization    |
| `addWatermark(opts)`        | Overlay images with positioning and opacity              |
| `changeSpeed(opts)`         | Time-stretch video and audio (stops "chipmunk" effect)   |
| `rotate(opts)`              | Rotate, flip, or transpose video                         |
| `generateThumbnailSheet(opts)` | Generate thumbnail contact sheets                       |
| `runCommand(opts)`          | Run arbitrary FFmpeg arguments                           |

### Metadata Functions (FFprobe)

| Function                | Description                                      |
| :---------------------- | :----------------------------------------------- |
| `getMetadata(path)`     | Full metadata with automatic caching             |
| `getDuration(path)`     | Quick duration in seconds                        |
| `getVideoCodec(path)`   | Get video codec name                             |
| `getAudioCodec(path)`   | Get audio codec name                             |
| `getAspectRatio(path)`  | Get aspect ratio (e.g., "16:9")                  |
| `getFrameRate(path)`    | Get frame rate as number                         |
| `getPixelFormat(path)`  | Get pixel format                                 |
| `getAudioSampleRate(path)` | Get audio sample rate                        |
| `getAudioChannels(path)` | Get number of audio channels                    |

### Queue & Retry

| Function               | Description                                      |
| :--------------------- | :----------------------------------------------- |
| `createQueue(concurrency)` | Create a conversion queue with pause/resume  |
| `convertWithRetry(fn, opts)` | Execute with automatic retry and backoff  |

### Progress Utilities

| Function                | Description                                      |
| :---------------------- | :----------------------------------------------- |
| `createThrottledProgress` | Throttle progress callbacks                 |
| `createIntervalProgress`  | Fire progress at specific intervals          |
| `ProgressAggregator`      | Aggregate multiple progress listeners       |

### Validation Helpers

| Function                | Description                                      |
| :---------------------- | :----------------------------------------------- |
| `validateInput`         | Validate input file/buffer/stream                |
| `validateOutputPath`    | Validate output directory exists                 |
| `validateQuality`       | Validate CRF value (0-51)                        |
| `validateBitrate`       | Validate bitrate format                          |
| `validateResolution`    | Validate resolution format                       |
| `validateFrameRate`     | Validate frame rate                              |
| `validateSampleRate`    | Validate audio sample rate                       |
| `validateTime`          | Validate time format                             |
| `validateSpeed`         | Validate speed factor                            |
| `validateRotation`      | Validate rotation angle                          |

### Video Presets

Helpers for common formats, accessible via `presets.video.*` or top-level exports:

- `toMP4(input, output, options?)` - Convert to H.264/AAC MP4
- `toWebM(input, output, options?)` - Convert to VP9/Opus WebM
- `toHEVC(input, output, options?)` - Convert to H.265
- `toHLS(input, outputDir, options?)` - HTTP Live Streaming
- `toDASH(input, outputDir, options?)` - Dynamic Adaptive Streaming
- `toGifPreset(input, output, options?)` - Create animated GIF
- `extractThumbnail(input, output, options?)` - Extract single frame
- `trimVideo(input, output, options?)` - Trim video to time range

### Audio Presets

- `toMP3(input, output, options?)` - Convert to MP3
- `toAAC(input, output, options?)` - Convert to AAC
- `toWAV(input, output, options?)` - Convert to WAV
- `toFLAC(input, output, options?)` - Convert to FLAC
- `toOpus(input, output, options?)` - Convert to Opus
- `extractAudioPreset(input, output, options?)` - Extract audio track
- `normalizeAudio(input, output, options?)` - Normalize audio levels

### Advanced Presets

- `streamToRTMP(input, rtmpUrl, options?)` - Live streaming to RTMP
- `stabilize(input, output, options?)` - Remove camera shake
- `burnSubtitles(input, output, options?)` - Hardcode subtitles
- `concatenate(inputs, output, options?)` - Concatenate multiple files
- `addSubtitleStream(input, output, subtitlePath)` - Add soft subtitle
- `reverse(input, output, options?)` - Reverse video/audio
- `loop(input, output, options?)` - Loop video

### Image Presets

- `screenshot(input, output, options?)` - Take screenshot
- `screenshotGrid(input, output, options?)` - Grid of screenshots
- `toImageSequence(input, outputDir, options?)` - Export as images
- `fromImageSequence(inputDir, output, options?)` - Create video from images
- `addWatermarkPreset(input, output, watermark, options?)` - Add watermark
- `createPoster(input, output, options?)` - Create poster image
- `createGif(input, output, options?)` - Create animated GIF

## ⚙️ Configuration Options

### ConvertOptions

The `convert()` function accepts a comprehensive set of options:

```typescript
interface ConvertOptions {
  // Basic I/O
  input: string | Buffer | ReadableStream;  // Input file path, buffer, or stream
  output: string;                             // Output file path
  inputFormat?: string;                       // Required for Buffer/Stream inputs

  // Video settings
  videoCodec?: string;                        // e.g., "libx264", "libvpx-vp9"
  videoBitrate?: string;                      // e.g., "5M", "2500k"
  crf?: number;                               // 0-51 (lower = better, 23 = default)
  preset?: string;                            // "ultrafast", "fast", "medium", "slow"
  profile?: string;                           // e.g., "high", "main", "baseline"
  level?: string;                             // e.g., "4.0", "5.1"
  tune?: string;                              // e.g., "film", "animation", "stillimage"
  size?: string;                              // e.g., "1280x720", "1920x1080"
  width?: number;                             // Output width in pixels
  height?: number;                            // Output height in pixels
  scale?: string;                             // e.g., "-1:720" (scale to 720px height)
  fps?: number;                               // Frame rate
  aspectRatio?: string;                       // e.g., "16:9", "4:3"
  pixelFormat?: string;                       // e.g., "yuv420p"
  frames?: number;                            // Number of frames to output
  gopSize?: number;                           // GOP size
  maxBitrate?: string;                        // e.g., "10M"
  bufferSize?: string;                        // e.g., "20M"

  // Video filters
  videoFilter?: string;                       // Single video filter
  videoFilters?: string[];                    // Multiple video filters

  // Audio settings
  audioCodec?: string;                        // e.g., "aac", "mp3", "opus"
  audioBitrate?: string;                      // e.g., "192k", "128k"
  sampleRate?: number;                        // e.g., 44100, 48000
  channels?: number;                          // 1 (mono), 2 (stereo), 6 (5.1)
  audioQuality?: number;                      // Audio quality (codec-specific)
  volume?: string | number;                   // e.g., "1.5", "0.5"

  // Audio filters
  audioFilter?: string;                       // Single audio filter
  audioFilters?: string[];                    // Multiple audio filters

  // Complex filters
  complexFilter?: string;                     // Complex filter graph

  // Stream control
  noVideo?: boolean;                          // Disable video output
  noAudio?: boolean;                          // Disable audio output
  noSubtitles?: boolean;                      // Disable subtitles
  map?: string[];                             // Stream mapping

  // Timing
  seek?: string | number;                     // Start position
  duration?: string | number;                 // Duration to process
  endTime?: string | number;                  // End position

  // Metadata
  metadata?: Record<string, string>;          // Metadata key-value pairs
  copyMetadata?: boolean;                     // Copy input metadata

  // HLS settings
  hlsTime?: number;                           // Segment duration (seconds)
  hlsPlaylistType?: "event" | "vod";          // Playlist type
  hlsListSize?: number;                       // Max playlist entries
  hlsSegmentFilename?: string;                // Segment filename pattern

  // DASH settings
  dashSegDuration?: number;                   // Segment duration (seconds)

  // Advanced
  format?: string;                            // Output format
  overwrite?: boolean;                        // Overwrite output file
  threads?: number;                           // Thread count
  hwAccel?: string;                           // Hardware acceleration (e.g., "cuda")
  inputDuration?: number;                     // Duration for progress calculation
  inputOptions?: string[];                    // Additional input options
  outputOptions?: string[];                   // Additional output options

  // Cancellation & callbacks
  signal?: AbortSignal;                       // AbortController signal
  onProgress?: (progress: ProgressInfo) => void;
  onStart?: (command: string) => void;
  onStderr?: (line: string) => void;
}
```

### ProgressInfo

Progress callbacks receive detailed progress information:

```typescript
interface ProgressInfo {
  frames: number;              // Number of frames processed
  currentFps: number;          // Current processing FPS
  currentKbps: number;         // Current bitrate in kbps
  targetSize: number;          // Target file size in KB
  timemark: string;            // Time position (HH:MM:SS.MM)
  percent?: number;            // Progress percentage (0-100)
  sizeEstimate?: {             // Size estimation info
    estimatedBytes: number;
    estimatedMB: number;
    currentBytes: number;
    targetBytes?: number;
  };
}
```

### Quality Presets

Quality presets map to specific CRF values:

| Quality | CRF (H.264/H.265) | Description |
|:--------|:------------------|:------------|
| `best`  | 18-23             | Near-lossless quality |
| `high`  | 23               | High quality (default) |
| `medium`| 28               | Balanced quality/size |
| `low`   | 35               | Small file size |

### ExtractAudioOptions

```typescript
interface ExtractAudioOptions {
  input: string | Buffer | ReadableStream;
  output: string;
  inputFormat?: string;
  format?: "mp3" | "aac" | "opus" | "flac" | "wav" | "ogg";
  codec?: string;
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
  volume?: string | number;
  seek?: string | number;
  duration?: string | number;
  overwrite?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: ProgressInfo) => void;
}
```

### ScreenshotOptions

```typescript
interface ScreenshotOptions {
  input: string;
  output: string;
  time?: string | number;      // Timestamp to capture (default: "00:00:01")
  size?: string;               // Output size
  width?: number;
  height?: number;
  quality?: number;            // JPEG quality (1-31, lower = better)
  overwrite?: boolean;
  signal?: AbortSignal;
}
```

### TrimOptions

```typescript
interface TrimOptions {
  input: string;
  output: string;
  start: string | number;      // Start position
  end?: string | number;       // End position
  duration?: string | number;  // Duration
  copy?: boolean;              // Stream copy (no re-encoding)
  videoCodec?: string;
  audioCodec?: string;
  overwrite?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: ProgressInfo) => void;
}
```

### GifOptions

```typescript
interface GifOptions {
  input: string;
  output: string;
  start?: string | number;     // Start position
  duration?: number;           // Duration in seconds
  fps?: number;                // Frames per second (default: 10)
  width?: number;              // Width in pixels (default: 480)
  loop?: number;               // Loop count (0 = infinite)
  overwrite?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: ProgressInfo) => void;
}
```

### WatermarkOptions

```typescript
interface WatermarkOptions {
  input: string;
  output: string;
  watermark: string;           // Watermark image path
  position?: "topleft" | "topright" | "bottomleft" | "bottomright" | "center";
  x?: number;                 // X offset (pixels)
  y?: number;                 // Y offset (pixels)
  opacity?: number;            // 0.0 - 1.0
  scale?: number;              // Scale factor
  overwrite?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: ProgressInfo) => void;
}
```

### SpeedOptions

```typescript
interface SpeedOptions {
  input: string;
  output: string;
  speed: number;               // Speed factor (0.5 = half speed, 2 = double)
  adjustAudio?: boolean;       // Adjust audio pitch (default: true)
  overwrite?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: ProgressInfo) => void;
}
```

### RotateOptions

```typescript
interface RotateOptions {
  input: string;
  output: string;
  angle: 90 | 180 | 270 | "cw" | "ccw" | "flip" | "vflip";
  overwrite?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: ProgressInfo) => void;
}
```

### RetryOptions

```typescript
interface RetryOptions {
  maxAttempts?: number;        // Maximum retry attempts (default: 3)
  retryDelay?: number;         // Initial delay in ms (default: 1000)
  retryOnExitCode?: number[];  // Exit codes to retry on (default: [1, 255])
}
```

### ThumbnailSheetOptions

```typescript
interface ThumbnailSheetOptions {
  input: string;
  output: string;
  columns?: number;            // Number of columns (default: 4)
  rows?: number;               // Number of rows (default: 4)
  interval?: number;           // Interval between captures in seconds
  tileSize?: string;           // Size of each tile (default: "320x180")
  gap?: number;                // Gap between tiles in pixels
  overwrite?: boolean;
  signal?: AbortSignal;
}
```

## ⚠️ Error Handling

We provide specific error classes to help you handle edge cases gracefully:

```typescript
import {
  FileExistsError,
  InvalidInputError,
  CodecNotFoundError,
  FFmpegAbortError,
  ValidationError,
  FFmpegError,
  FFmpegNotFoundError,
  FFmpegExitError
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
  } else if (err instanceof FFmpegAbortError) {
    // Handle cancellation
  } else if (err instanceof FFmpegNotFoundError) {
    // FFmpeg binary not found
  } else if (err instanceof CodecNotFoundError) {
    // Requested codec not available
  } else if (err instanceof FFmpegExitError) {
    // FFmpeg exited with non-zero code
  } else {
    // Generic error
    console.error(err);
  }
}
```

## 📂 Examples

Check out the [examples](./examples) directory for more usage examples:

- [basic-conversion.ts](./examples/basic-conversion.ts) - Basic FFmpeg class usage
- [object-api.ts](./examples/object-api.ts) - Object-based API examples
- [probe-metadata.ts](./examples/probe-metadata.ts) - FFprobe metadata extraction
- [audio-processing.ts](./examples/audio-processing.ts) - Audio conversion and processing
- [thumbnails.ts](./examples/thumbnails.ts) - Thumbnail and screenshot generation
- [filters.ts](./examples/filters.ts) - Video filters and effects
- [batch-processing.ts](./examples/batch-processing.ts) - Batch file processing
- [streaming.ts](./examples/streaming.ts) - HLS and DASH streaming
- [presets.ts](./examples/presets.ts) - Using built-in presets
- [effects.ts](./examples/effects.ts) - Video effects and transformations
- [custom-cli.ts](./examples/custom-cli.ts) - Custom CLI arguments

## ❓ FAQ

**Q: Do I need to install FFmpeg manually?**

A: No! By default, `nodejs-ffmpeg` will detect your OS and download the correct binaries to a local cache folder on the first run. You can also provide a custom path via `setFFmpegPath()`.

**Q: Does it work on serverless/Lambda?**

A: Yes! With the new **buffer/stream input support**, you can process video/audio without writing to disk first. The zero-dependency nature makes it ideal for bundle-size constrained environments.

**Q: Why standard AbortController instead of a custom `.cancel()` method?**

A: `AbortController` is the web standard for cancellation. It allows you to pass the same signal to multiple operations (e.g., cancel a database query and an FFmpeg conversion simultaneously) and integrates with modern Node.js and browser APIs.

**Q: How do I process videos from URLs in a serverless function?**

A: Download the video to a buffer, then pass it to `convert()` with the `inputFormat` option. See the "Buffer/Stream Inputs" example above.

**Q: What's two-pass encoding and when should I use it?**

A: Two-pass encoding analyzes the video in the first pass to determine optimal bitrate allocation, then encodes in the second pass. Use it when you need precise bitrate control (e.g., for streaming at a specific target bitrate).

**Q: Which API style should I use?**

A: Use the **Object API** for most cases - it's simpler, has better TypeScript support, and covers 95% of use cases. Use the **Fluent API** when you need complex filter chains or prefer method chaining.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [Rashed Iqbal](https://github.com/iqbal-rashed)

## 🔗 Links

- [npm](https://www.npmjs.com/package/nodejs-ffmpeg)
- [GitHub](https://github.com/iqbal-rashed/nodejs-ffmpeg)
- [Issues](https://github.com/iqbal-rashed/nodejs-ffmpeg/issues)
