export interface FFprobeResult {
  format: FormatInfo;
  streams: StreamInfo[];
  chapters?: ChapterInfo[];
}

export interface FormatInfo {
  filename: string;
  nb_streams: number;
  nb_programs: number;
  format_name: string;
  format_long_name: string;
  start_time: string;
  duration: string;
  size: string;
  bit_rate: string;
  probe_score: number;
  tags?: Record<string, string>;
}

export interface StreamInfo {
  index: number;
  codec_name: string;
  codec_long_name: string;
  profile?: string;
  codec_type: "video" | "audio" | "subtitle" | "data" | "attachment";
  codec_tag_string: string;
  codec_tag: string;
  width?: number;
  height?: number;
  coded_width?: number;
  coded_height?: number;
  closed_captions?: number;
  has_b_frames?: number;
  sample_aspect_ratio?: string;
  display_aspect_ratio?: string;
  pix_fmt?: string;
  level?: number;
  color_range?: string;
  color_space?: string;
  color_transfer?: string;
  color_primaries?: string;
  chroma_location?: string;
  field_order?: string;
  refs?: number;
  is_avc?: string;
  nal_length_size?: string;
  r_frame_rate: string;
  avg_frame_rate: string;
  time_base: string;
  start_pts?: number;
  start_time?: string;
  duration_ts?: number;
  duration?: string;
  bit_rate?: string;
  bits_per_raw_sample?: string;
  nb_frames?: string;
  sample_fmt?: string;
  sample_rate?: string;
  channels?: number;
  channel_layout?: string;
  bits_per_sample?: number;
  disposition: StreamDisposition;
  tags?: Record<string, string>;
}

export interface StreamDisposition {
  default: number;
  dub: number;
  original: number;
  comment: number;
  lyrics: number;
  karaoke: number;
  forced: number;
  hearing_impaired: number;
  visual_impaired: number;
  clean_effects: number;
  attached_pic: number;
  timed_thumbnails: number;
}

export interface ChapterInfo {
  id: number;
  time_base: string;
  start: number;
  start_time: string;
  end: number;
  end_time: string;
  tags?: {
    title?: string;
  };
}

export interface FFprobeOptions {
  ffprobePath?: string;
  timeout?: number;
  selectStreams?: string;
}
