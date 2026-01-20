export interface FFmpegOptions {
  ffmpegPath?: string;
  ffprobePath?: string;
  timeout?: number;
  niceness?: number;
  cwd?: string;
}

export interface ProgressInfo {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: string;
  percent?: number;
}

export interface FFmpegInput {
  source: string;
  options?: string[];
}

export interface FFmpegOutput {
  destination: string;
  options?: string[];
}

export interface VideoOptions {
  codec?: string;
  bitrate?: string;
  fps?: number;
  size?: string;
  aspect?: string;
  filters?: string[];
}

export interface AudioOptions {
  codec?: string;
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
  filters?: string[];
}

export interface OutputOptions {
  format?: string;
  duration?: number;
  startTime?: number;
  video?: VideoOptions;
  audio?: AudioOptions;
  extraArgs?: string[];
}

export interface FFmpegResult {
  exitCode: number;
  command: string;
  duration: number;
}

export interface ConvertOptions {
  input: string;
  output: string;
  seek?: string | number;
  duration?: string | number;
  endTime?: string | number;
  format?: string;
  videoCodec?: string;
  videoBitrate?: string;
  crf?: number;
  preset?: string;
  profile?: string;
  level?: string;
  tune?: string;
  size?: string;
  width?: number;
  height?: number;
  scale?: string;
  fps?: number;
  aspectRatio?: string;
  pixelFormat?: string;
  frames?: number;
  gopSize?: number;
  maxBitrate?: string;
  bufferSize?: string;
  audioCodec?: string;
  audioBitrate?: string;
  sampleRate?: number;
  channels?: number;
  audioQuality?: number;
  volume?: string | number;
  videoFilter?: string;
  videoFilters?: string[];
  audioFilter?: string;
  audioFilters?: string[];
  complexFilter?: string;
  noVideo?: boolean;
  noAudio?: boolean;
  noSubtitles?: boolean;
  map?: string[];
  metadata?: Record<string, string>;
  copyMetadata?: boolean;
  hlsTime?: number;
  hlsPlaylistType?: "event" | "vod";
  hlsListSize?: number;
  hlsSegmentFilename?: string;
  dashSegDuration?: number;
  overwrite?: boolean;
  threads?: number;
  hwAccel?: string;
  inputDuration?: number;
  inputOptions?: string[];
  outputOptions?: string[];
  onProgress?: (progress: ProgressInfo) => void;
  onStart?: (command: string) => void;
  onStderr?: (line: string) => void;
}

export interface ExtractAudioOptions {
  input: string;
  output: string;
  format?: "mp3" | "aac" | "opus" | "flac" | "wav" | "ogg";
  codec?: string;
  bitrate?: string | undefined;
  sampleRate?: number;
  channels?: number;
  volume?: string | number;
  seek?: string | number;
  duration?: string | number;
  overwrite?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
}

export interface ScreenshotOptions {
  input: string;
  output: string;
  time?: string | number | undefined;
  size?: string;
  width?: number;
  height?: number;
  quality?: number;
  overwrite?: boolean;
}

export interface TrimOptions {
  input: string;
  output: string;
  start: string | number;
  end?: string | number;
  duration?: string | number;
  copy?: boolean;
  videoCodec?: string;
  audioCodec?: string;
  overwrite?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
}

export interface CompressOptions {
  input: string;
  output: string;
  quality?: "low" | "medium" | "high" | "best";
  crf?: number;
  preset?: string;
  maxBitrate?: string;
  maxSize?: string;
  scale?: string;
  fps?: number;
  audioBitrate?: string;
  overwrite?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
}

export interface MergeOptions {
  videoInput: string;
  audioInput: string;
  output: string;
  videoCodec?: string;
  audioCodec?: string;
  shortest?: boolean;
  overwrite?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
}

export interface ConcatOptions {
  inputs: string[];
  output: string;
  method?: "demuxer" | "filter";
  videoCodec?: string;
  audioCodec?: string;
  overwrite?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
}

export interface GifOptions {
  input: string;
  output: string;
  start?: string | number;
  duration?: number;
  fps?: number;
  width?: number;
  loop?: number;
  overwrite?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
}

export interface WatermarkOptions {
  input: string;
  output: string;
  watermark: string;
  position?: "topleft" | "topright" | "bottomleft" | "bottomright" | "center";
  x?: number;
  y?: number;
  opacity?: number;
  scale?: number;
  overwrite?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
}

export interface SpeedOptions {
  input: string;
  output: string;
  speed: number;
  adjustAudio?: boolean;
  overwrite?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
}

export interface RotateOptions {
  input: string;
  output: string;
  angle: 90 | 180 | 270 | "cw" | "ccw" | "flip" | "vflip";
  overwrite?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
}
