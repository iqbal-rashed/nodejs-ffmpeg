export {
  FFmpeg,
  createFFmpeg,
  convert,
  extractAudio,
  takeScreenshot,
  trim,
  compress,
  merge,
  concat,
  toGif,
  addWatermark,
  changeSpeed,
  rotate,
  runCommand,
  runCommandString,
  parseCommand,
  convertTwoPass,
  generateThumbnailSheet,
  type RunCommandOptions,
} from "./core/ffmpeg";

export {
  FFprobe,
  createFFprobe,
  getMetadata,
  getDuration,
  getVideoCodec,
  getAudioCodec,
  getAspectRatio,
  getFrameRate,
  getPixelFormat,
  getAudioSampleRate,
  getAudioChannels,
} from "./core/ffprobe";

export { downloadBinaries, needsDownload } from "./binary/downloader";
export {
  setFFmpegPath,
  setFFprobePath,
  getFFmpegPath,
  getFFprobePath,
  getBinaryPaths,
  areBinariesDownloaded,
  getDefaultBinaryDir,
  hasFFmpegBinaries,
  getPackageRoot,
} from "./binary/paths";
export {
  getPlatform,
  getArchitecture,
  isPlatformSupported,
  getBinaryNames,
  getDownloadUrls,
  DOWNLOAD_BASE_URL,
  PLATFORM_MAPPINGS,
} from "./binary/platform";

export * as presets from "./presets";
export {
  toMP4,
  toWebM,
  toHEVC,
  toGif as toGifPreset,
  extractThumbnail,
  trimVideo,
} from "./presets/video";
export {
  toMP3,
  toAAC,
  toOpus,
  toFLAC,
  toWAV,
  extractAudio as extractAudioPreset,
  normalizeAudio,
} from "./presets/audio";
export {
  screenshot,
  screenshotGrid,
  toImageSequence,
  fromImageSequence,
  addWatermark as addWatermarkPreset,
  createPoster,
  createGif,
} from "./presets/image";
export {
  concatenate,
  burnSubtitles,
  addSubtitleStream,
  streamToRTMP,
  toHLS,
  toDASH,
  stabilize,
  changeSpeed as changeSpeedPreset,
  reverse,
  loop,
} from "./presets/advanced";

export {
  parseProgress,
  parseTimemark,
  calculatePercent,
  formatTimemark,
} from "./utils/progress";
export {
  FFmpegError,
  FFmpegNotFoundError,
  FFmpegExitError,
  FFmpegTimeoutError,
  FFmpegAbortError,
  InvalidInputError,
  CodecNotFoundError,
  FileExistsError,
  DownloadError,
  UnsupportedPlatformError,
  ValidationError,
} from "./utils/errors";
export {
  batchProcess,
  getSuccessfulResults,
  getFailedResults,
} from "./utils/batch";
export { probeCache } from "./utils/cache";
export { ConversionQueue, createQueue } from "./utils/queue";
export { withRetry, convertWithRetry } from "./utils/retry";
export {
  createThrottledProgress,
  createIntervalProgress,
  ProgressAggregator,
} from "./utils/throttle";
export {
  validateInput,
  validateOutputPath,
  // validateFFmpegOptions,
  validateVideoCodec,
  validateAudioCodec,
  validateQuality,
  validateBitrate,
  validateResolution,
  validateFrameRate,
  validateSampleRate,
  validateTime,
  validateSpeed,
  validateRotation,
  validateWatermarkOpacity,
} from "./utils/validators";

export type {
  FFmpegOptions,
  ProgressInfo,
  FFmpegInput,
  FFmpegOutput,
  VideoOptions,
  AudioOptions,
  OutputOptions,
  FFmpegResult,
  ConvertOptions,
  ExtractAudioOptions,
  ScreenshotOptions,
  TrimOptions,
  CompressOptions,
  MergeOptions,
  ConcatOptions,
  GifOptions,
  WatermarkOptions,
  SpeedOptions,
  RotateOptions,
  BatchOptions,
  BatchResult,
  FFprobeResult,
  FFprobeOptions,
  FormatInfo,
  StreamInfo,
  StreamDisposition,
  ChapterInfo,
  Platform,
  Architecture,
  BinaryInfo,
  DownloadOptions,
  DownloadProgress,
  PlatformBinaryNames,
  RetryOptions,
  ThumbnailSheetOptions,
  ThrottledProgressOptions,
  SizeEstimation,
  InputSource,
} from "./types";
