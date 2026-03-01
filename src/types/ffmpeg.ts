export interface FFmpegOptions {
  ffmpegPath?: string | undefined;
  ffprobePath?: string | undefined;
  timeout?: number | undefined;
  niceness?: number | undefined;
  cwd?: string | undefined;
}

export interface SizeEstimation {
  estimatedBytes: number;
  estimatedMB: number;
  currentBytes: number;
  targetBytes?: number | undefined;
}

export interface ProgressInfo {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: string;
  percent?: number | undefined;
  sizeEstimate?: SizeEstimation | undefined;
}

export type InputSource = string | Buffer | ReadableStream;

export interface FFmpegInput {
  source: InputSource;
  options?: string[] | undefined;
  format?: string | undefined; // Required for Buffer/Stream inputs
}

export interface FFmpegOutput {
  destination: string;
  options?: string[] | undefined;
}

export interface VideoOptions {
  codec?: string | undefined;
  bitrate?: string | undefined;
  fps?: number | undefined;
  size?: string | undefined;
  aspect?: string | undefined;
  filters?: string[] | undefined;
}

export interface AudioOptions {
  codec?: string | undefined;
  bitrate?: string | undefined;
  sampleRate?: number | undefined;
  channels?: number | undefined;
  filters?: string[] | undefined;
}

export interface OutputOptions {
  format?: string | undefined;
  duration?: number | undefined;
  startTime?: number | undefined;
  video?: VideoOptions | undefined;
  audio?: AudioOptions | undefined;
  extraArgs?: string[] | undefined;
}

export interface FFmpegResult {
  exitCode: number;
  command: string;
  duration: number;
}

export interface ConvertOptions {
  input: InputSource;
  output: string;
  inputFormat?: string | undefined; // Format for Buffer/Stream inputs
  seek?: string | number | undefined;
  duration?: string | number | undefined;
  endTime?: string | number | undefined;
  format?: string | undefined;
  videoCodec?: string | undefined;
  videoBitrate?: string | undefined;
  crf?: number | undefined;
  preset?: string | undefined;
  profile?: string | undefined;
  level?: string | undefined;
  tune?: string | undefined;
  size?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  scale?: string | undefined;
  fps?: number | undefined;
  aspectRatio?: string | undefined;
  pixelFormat?: string | undefined;
  frames?: number | undefined;
  gopSize?: number | undefined;
  maxBitrate?: string | undefined;
  bufferSize?: string | undefined;
  audioCodec?: string | undefined;
  audioBitrate?: string | undefined;
  sampleRate?: number | undefined;
  channels?: number | undefined;
  audioQuality?: number | undefined;
  volume?: string | number | undefined;
  videoFilter?: string | undefined;
  videoFilters?: string[] | undefined;
  audioFilter?: string | undefined;
  audioFilters?: string[] | undefined;
  complexFilter?: string | undefined;
  noVideo?: boolean | undefined;
  noAudio?: boolean | undefined;
  noSubtitles?: boolean | undefined;
  map?: string[] | undefined;
  metadata?: Record<string, string> | undefined;
  copyMetadata?: boolean | undefined;
  hlsTime?: number | undefined;
  hlsPlaylistType?: "event" | "vod" | undefined;
  hlsListSize?: number | undefined;
  hlsSegmentFilename?: string | undefined;
  dashSegDuration?: number | undefined;
  overwrite?: boolean | undefined;
  threads?: number | undefined;
  hwAccel?: string | undefined;
  inputDuration?: number | undefined;
  inputOptions?: string[] | undefined;
  outputOptions?: string[] | undefined;
  signal?: AbortSignal | undefined;
  onProgress?: ((progress: ProgressInfo) => void) | undefined;
  onStart?: ((command: string) => void) | undefined;
  onStderr?: ((line: string) => void) | undefined;
}

export interface ExtractAudioOptions {
  input: InputSource;
  output: string;
  inputFormat?: string | undefined; // Format for Buffer/Stream inputs
  format?: "mp3" | "aac" | "opus" | "flac" | "wav" | "ogg" | undefined;
  codec?: string | undefined;
  bitrate?: string | undefined;
  sampleRate?: number | undefined;
  channels?: number | undefined;
  volume?: string | number | undefined;
  seek?: string | number | undefined;
  duration?: string | number | undefined;
  overwrite?: boolean | undefined;
  signal?: AbortSignal | undefined;
  onProgress?: ((progress: ProgressInfo) => void) | undefined;
}

export interface ScreenshotOptions {
  input: string;
  output: string;
  time?: string | number | undefined;
  size?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  quality?: number | undefined;
  overwrite?: boolean | undefined;
  signal?: AbortSignal | undefined;
}

export interface TrimOptions {
  input: string;
  output: string;
  start: string | number;
  end?: string | number | undefined;
  duration?: string | number | undefined;
  copy?: boolean | undefined;
  videoCodec?: string | undefined;
  audioCodec?: string | undefined;
  overwrite?: boolean | undefined;
  signal?: AbortSignal | undefined;
  onProgress?: ((progress: ProgressInfo) => void) | undefined;
}

export interface CompressOptions {
  input: string;
  output: string;
  quality?: "low" | "medium" | "high" | "best" | undefined;
  crf?: number | undefined;
  preset?: string | undefined;
  maxBitrate?: string | undefined;
  maxSize?: string | undefined;
  scale?: string | undefined;
  fps?: number | undefined;
  audioBitrate?: string | undefined;
  overwrite?: boolean | undefined;
  signal?: AbortSignal | undefined;
  onProgress?: ((progress: ProgressInfo) => void) | undefined;
}

export interface MergeOptions {
  videoInput: string;
  audioInput: string;
  output: string;
  videoCodec?: string | undefined;
  audioCodec?: string | undefined;
  shortest?: boolean | undefined;
  overwrite?: boolean | undefined;
  signal?: AbortSignal | undefined;
  onProgress?: ((progress: ProgressInfo) => void) | undefined;
}

export interface ConcatOptions {
  inputs: string[];
  output: string;
  method?: "demuxer" | "filter" | undefined;
  videoCodec?: string | undefined;
  audioCodec?: string | undefined;
  overwrite?: boolean | undefined;
  signal?: AbortSignal | undefined;
  onProgress?: ((progress: ProgressInfo) => void) | undefined;
}

export interface GifOptions {
  input: string;
  output: string;
  start?: string | number | undefined;
  duration?: number | undefined;
  fps?: number | undefined;
  width?: number | undefined;
  loop?: number | undefined;
  overwrite?: boolean | undefined;
  signal?: AbortSignal | undefined;
  onProgress?: ((progress: ProgressInfo) => void) | undefined;
}

export interface WatermarkOptions {
  input: string;
  output: string;
  watermark: string;
  position?:
    | "topleft"
    | "topright"
    | "bottomleft"
    | "bottomright"
    | "center"
    | undefined;
  x?: number | undefined;
  y?: number | undefined;
  opacity?: number | undefined;
  scale?: number | undefined;
  overwrite?: boolean | undefined;
  signal?: AbortSignal | undefined;
  onProgress?: ((progress: ProgressInfo) => void) | undefined;
}

export interface SpeedOptions {
  input: string;
  output: string;
  speed: number;
  adjustAudio?: boolean | undefined;
  overwrite?: boolean | undefined;
  signal?: AbortSignal | undefined;
  onProgress?: ((progress: ProgressInfo) => void) | undefined;
}

export interface RotateOptions {
  input: string;
  output: string;
  angle: 90 | 180 | 270 | "cw" | "ccw" | "flip" | "vflip";
  overwrite?: boolean | undefined;
  signal?: AbortSignal | undefined;
  onProgress?: ((progress: ProgressInfo) => void) | undefined;
}

export interface BatchOptions<T> {
  items: T[];
  concurrency?: number | undefined;
  signal?: AbortSignal | undefined;
  onItemComplete?:
    | ((item: T, index: number, total: number) => void)
    | undefined;
  onItemError?: ((error: Error, item: T, index: number) => void) | undefined;
}

export interface BatchResult<R> {
  success: boolean;
  result?: R | undefined;
  error?: Error | undefined;
  index: number;
}

export interface RetryOptions {
  maxAttempts?: number | undefined;
  retryDelay?: number | undefined;
  retryOnExitCode?: number[] | undefined;
}

export interface TwoPassOptions extends Omit<ConvertOptions, "output"> {
  output: string;
  passLogFile?: string | undefined;
}

export interface ThumbnailSheetOptions {
  input: string;
  output: string;
  columns?: number | undefined;
  rows?: number | undefined;
  interval?: number | undefined;
  tileSize?: string | undefined;
  gap?: number | undefined;
  overwrite?: boolean | undefined;
  signal?: AbortSignal | undefined;
}

export interface ThrottledProgressOptions {
  onProgress: (progress: ProgressInfo) => void;
  throttleMs?: number | undefined;
}
