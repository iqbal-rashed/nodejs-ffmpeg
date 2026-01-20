import type { FFmpeg } from "../core/ffmpeg";
import { createPresetFFmpeg, type PresetOptions } from "./common";

export function concatenate(
  inputs: string[],
  output: string,
  options: PresetOptions & { method?: "demuxer" | "filter" } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);
  const method = options.method ?? "filter";

  if (method === "filter") {
    for (const input of inputs) {
      ffmpeg.input(input);
    }

    const filterParts = inputs.map((_, i) => `[${i}:v][${i}:a]`).join("");
    ffmpeg
      .output(output)
      .complexFilter(
        `${filterParts}concat=n=${inputs.length}:v=1:a=1[outv][outa]`
      )
      .outputOptions("-map", "[outv]", "-map", "[outa]");
  } else {
    ffmpeg
      .input(inputs[0] ?? "")
      .inputOptions("-f", "concat", "-safe", "0")
      .output(output)
      .videoCodec("copy")
      .audioCodec("copy");
  }

  return ffmpeg;
}

export function burnSubtitles(
  videoInput: string,
  subtitleInput: string,
  output: string,
  options: PresetOptions & { style?: string; charenc?: string } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);

  ffmpeg.input(videoInput).output(output);

  let subtitleFilter = `subtitles='${subtitleInput.replace(/\\/g, "/").replace(/'/g, "\\'")}'`;

  if (options.style) {
    subtitleFilter += `:force_style='${options.style}'`;
  }

  if (options.charenc) {
    subtitleFilter += `:charenc=${options.charenc}`;
  }

  ffmpeg.videoFilter(subtitleFilter).audioCodec("copy");

  return ffmpeg;
}

export function addSubtitleStream(
  videoInput: string,
  subtitleInput: string,
  output: string,
  options: PresetOptions & { language?: string; title?: string } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);

  ffmpeg
    .input(videoInput)
    .input(subtitleInput)
    .output(output)
    .outputOptions("-map", "0:v", "-map", "0:a", "-map", "1:s")
    .videoCodec("copy")
    .audioCodec("copy")
    .outputOptions("-c:s", "mov_text");

  if (options.language) {
    ffmpeg.outputOptions("-metadata:s:s:0", `language=${options.language}`);
  }

  if (options.title) {
    ffmpeg.outputOptions("-metadata:s:s:0", `title=${options.title}`);
  }

  return ffmpeg;
}

export function streamToRTMP(
  input: string,
  rtmpUrl: string,
  options: PresetOptions & {
    videoBitrate?: string;
    audioBitrate?: string;
    preset?: string;
    keyframeInterval?: number;
  } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);
  const videoBitrate = options.videoBitrate ?? "2500k";
  const audioBitrate = options.audioBitrate ?? "128k";
  const preset = options.preset ?? "veryfast";
  const keyframeInterval = options.keyframeInterval ?? 2;

  ffmpeg
    .input(input)
    .output(rtmpUrl)
    .format("flv")
    .videoCodec("libx264")
    .audioCodec("aac")
    .videoBitrate(videoBitrate)
    .audioBitrate(audioBitrate)
    .outputOptions(
      "-preset",
      preset,
      "-g",
      (keyframeInterval * 30).toString(),
      "-keyint_min",
      (keyframeInterval * 30).toString(),
      "-bufsize",
      videoBitrate
    );

  return ffmpeg;
}

export function toHLS(
  input: string,
  outputDir: string,
  options: PresetOptions & {
    segmentDuration?: number;
    playlistName?: string;
    segmentPattern?: string;
  } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);
  const segmentDuration = options.segmentDuration ?? 10;
  const playlistName = options.playlistName ?? "playlist.m3u8";
  const segmentPattern = options.segmentPattern ?? "segment_%03d.ts";

  ffmpeg
    .input(input)
    .output(`${outputDir}/${playlistName}`)
    .format("hls")
    .outputOptions(
      "-hls_time",
      segmentDuration.toString(),
      "-hls_list_size",
      "0",
      "-hls_segment_filename",
      `${outputDir}/${segmentPattern}`
    )
    .videoCodec("libx264")
    .audioCodec("aac");

  return ffmpeg;
}

export function toDASH(
  input: string,
  outputDir: string,
  options: PresetOptions & {
    segmentDuration?: number;
    manifestName?: string;
  } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);
  const segmentDuration = options.segmentDuration ?? 4;
  const manifestName = options.manifestName ?? "manifest.mpd";

  ffmpeg
    .input(input)
    .output(`${outputDir}/${manifestName}`)
    .format("dash")
    .outputOptions(
      "-seg_duration",
      segmentDuration.toString(),
      "-use_template",
      "1",
      "-use_timeline",
      "1",
      "-init_seg_name",
      "init_$RepresentationID$.m4s",
      "-media_seg_name",
      "chunk_$RepresentationID$_$Number%05d$.m4s"
    )
    .videoCodec("libx264")
    .audioCodec("aac");

  return ffmpeg;
}

export function stabilize(
  input: string,
  output: string,
  options: PresetOptions & {
    shakiness?: number;
    accuracy?: number;
    smoothing?: number;
  } = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);
  const smoothing = options.smoothing ?? 10;

  ffmpeg
    .input(input)
    .output(output)
    .videoFilter(
      `vidstabtransform=smoothing=${smoothing},unsharp=5:5:0.8:3:3:0.4`
    );

  return ffmpeg;
}

export function changeSpeed(
  input: string,
  output: string,
  options: PresetOptions & { speed: number }
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);
  const speed = options.speed;
  const videoPts = 1 / speed;
  const audioTempos: string[] = [];

  let remainingSpeed = speed;
  while (remainingSpeed > 2.0) {
    audioTempos.push("atempo=2.0");
    remainingSpeed /= 2.0;
  }
  while (remainingSpeed < 0.5) {
    audioTempos.push("atempo=0.5");
    remainingSpeed /= 0.5;
  }
  audioTempos.push(`atempo=${remainingSpeed}`);

  ffmpeg
    .input(input)
    .output(output)
    .videoFilter(`setpts=${videoPts}*PTS`)
    .audioFilter(audioTempos.join(","));

  return ffmpeg;
}

export function reverse(
  input: string,
  output: string,
  options: PresetOptions = {}
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);

  ffmpeg
    .input(input)
    .output(output)
    .videoFilter("reverse")
    .audioFilter("areverse");

  return ffmpeg;
}

export function loop(
  input: string,
  output: string,
  options: PresetOptions & { times: number }
): FFmpeg {
  const ffmpeg = createPresetFFmpeg(options);

  ffmpeg
    .input(input)
    .inputOptions("-stream_loop", (options.times - 1).toString())
    .output(output)
    .videoCodec("copy")
    .audioCodec("copy");

  return ffmpeg;
}
