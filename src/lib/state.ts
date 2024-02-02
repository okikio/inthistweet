import { writable } from "svelte/store";

export interface FFmpegConfig {
  args: string[];
  inFilename: string;
  outFilename: string;
  mediaType: string;
  forceUseArgs: string[] | null;
}

export const abortCtlr = writable(new AbortController());

export const progress = writable(0);
export const loading = writable(false);
export const initializing = writable(false);
export const fileOpenMode = writable(false);
 
export const error = writable<string | null>(null);
export const results = writable<
  Array<{ type?: string | null; url?: string | null }>
>([]);

export const samples = new Map([
  [
    "webm -> mp4",
    {
      args: ["-c:v", "libvpx"],
      inFilename: "video.webm",
      outFilename: "video.mp4",
      mediaType: "video/mp4",
      forceUseArgs: null,
    },
  ],
  [
    "avi -> mp4",
    {
      args: ["-c:v", "libx264"],
      inFilename: "video.avi",
      outFilename: "video.mp4",
      mediaType: "video/mp4",
      forceUseArgs: null,
    },
  ],
  [
    "mov -> mp4",
    {
      args: ["-vcodec", "copy", "-acodec", "copy"],
      inFilename: "video.mov",
      outFilename: "video.mp4",
      mediaType: "video/mp4",
      forceUseArgs: null,
    },
  ],
  [
    "wmv -> mp4",
    {
      args: [],
      inFilename: "video.wmv",
      outFilename: "video.mp4",
      mediaType: "video/mp4",
      forceUseArgs: null,
    },
  ],
  [
    "avi -> webm",
    {
      args: ["-c:v", "libvpx"],
      inFilename: "video.avi",
      outFilename: "video.webm",
      mediaType: "video/webm",
      forceUseArgs: null,
    },
  ],
  [
    "mp4 -> wmv",
    {
      args: [],
      inFilename: "video.mp4",
      outFilename: "video.wmv",
      mediaType: "video/x-ms-wmv",
      forceUseArgs: null,
    },
  ],
  [
    "gif -> mp4",
    {
      args: [
        "-movflags",
        "faststart",
        "-pix_fmt",
        "yuv420p",
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      ],
      inFilename: "video.gif",
      outFilename: "image.mp4",
      mediaType: "video/mp4",
      forceUseArgs: null,
    },
  ],
  [
    "mp4 -> gif",
    {
      args: [],
      inFilename: "video.mp4",
      outFilename: "image.gif",
      mediaType: "image/gif",
      forceUseArgs: null,
    },
  ],
  [
    "mp3 -> mp4",
    {
      args: ["-c:v", "libvpx"],
      inFilename: "audio.mp3",
      outFilename: "video.mp4",
      mediaType: "video/mp4",
      forceUseArgs: null,
    },
  ],
  [
    "wav -> mp3",
    {
      args: ["-c:a", "libmp3lame"],
      inFilename: "audio.wav",
      outFilename: "audio.mp3",
      mediaType: "audio/mpeg",
      forceUseArgs: null,
    },
  ],

  [
    "mp4 -> mov",
    {
      args: ["-vcodec", "copy", "-acodec", "copy"],
      inFilename: "video.mp4",
      outFilename: "video.mov",
      mediaType: "video/quicktime",
      forceUseArgs: null,
    },
  ],
  [
    "mp4 -> mkv",
    {
      args: ["-c:v", "libvpx", "-c:a", "libvorbis"],
      inFilename: "video.mp4",
      outFilename: "video.mkv",
      mediaType: "video/x-matroska",
      forceUseArgs: null,
    },
  ],
  [
    "mp4 -> ogg",
    {
      args: ["-c:a", "libvorbis"],
      inFilename: "video.mp4",
      outFilename: "audio.ogg",
      mediaType: "audio/ogg",
      forceUseArgs: null,
    },
  ],
  [
    "webm -> mkv",
    {
      args: ["-c:v", "copy", "-c:a", "flac"],
      inFilename: "video.webm",
      outFilename: "video.mkv",
      mediaType: "video/x-matroska",
      forceUseArgs: null,
    },
  ],
  [
    "mp3 -> ogg",
    {
      args: ["-c:a", "libvorbis"],
      inFilename: "audio.mp3",
      outFilename: "audio.ogg",
      mediaType: "audio/ogg",
      forceUseArgs: null,
    },
  ],
  [
    "mp3 -> wav",
    {
      args: ["-c:a", "libmp3lame"],
      inFilename: "audio.mp3",
      outFilename: "audio.wav",
      mediaType: "video/x-ms-wmv",
      forceUseArgs: null,
    },
  ],
  [
    "mp4 -> mp3",
    {
      args: ["-c:a", "libmp3lame"],
      inFilename: "video.mp4",
      outFilename: "audio.mp3",
      mediaType: "audio/mpeg",
      forceUseArgs: null,
    },
  ],
  [
    "webm -> gif",
    {
      args: ["-crf", "20", "-movflags", "faststart"],
      inFilename: "video.webm",
      outFilename: "image.gif",
      mediaType: "image/gif",
      forceUseArgs: null,
    },
  ],
  [
    "gif -> webm",
    {
      args: [
        "-c:v",
        "vp8",
        "-quality",
        "good",
        "-movflags",
        "faststart",
        "-pix_fmt",
        "yuv420p",
        "-crf",
        "30",
      ],
      inFilename: "image.gif",
      outFilename: "video.webm",
      mediaType: "video/webm",
      forceUseArgs: null,
    },
  ],
  [
    "mp4 -> webm",
    {
      args: "-c:v libvpx".split(" "),
      inFilename: "video.mp4",
      outFilename: "video.webm",
      mediaType: "video/webm",
      forceUseArgs: null,
    },
  ],
  [
    "mp4 -> avi",
    {
      args: ["-vcodec", "copy", "-acodec", "copy"],
      inFilename: "video.mp4",
      outFilename: "video.avi",
      mediaType: "video/x-msvideo",
      forceUseArgs: null,
    },
  ],
  [
    "webm -> avi",
    {
      args: ["-vcodec", "copy", "-acodec", "copy"],
      inFilename: "video.webm",
      outFilename: "video.avi",
      mediaType: "video/x-msvideo",
      forceUseArgs: null,
    },
  ],

  [
    "m3u8 -> mp4",
    {
      // args: ["-c", "copy", "-bsf:a", "aac_adtstoasc"],
      inFilename: "video.m3u8",
      outFilename: "video.mp4",
      mediaType: "video/mp4",
      forceUseArgs: [
        "-protocol_whitelist",
        "file,http,https,tcp,tls,crypto",
        "-i",
        "video.m3u8",
        "-c",
        "copy",
        "-bsf:a",
        "aac_adtstoasc",
        "video.mp4",
      ],
    },
  ],
  [
    "mp4 -> m3u8",
    {
      args: "-b:v 1M -g 60 -hls_time 2 -hls_list_size 0 -hls_segment_size 500000".split(
        " "
      ),
      inFilename: "video.mp4",
      outFilename: "video.m3u8",
      mediaType: "vnd.apple.mpegURL",
    },
  ],
  [
    "mp4 -> ts",
    {
      args: [
        "-c:v",
        "mpeg2video",
        "-qscale:v",
        "2",
        "-c:a",
        "mp2",
        "-b:a",
        "192k",
      ],
      inFilename: "video.mp4",
      outFilename: "video.ts",
      mediaType: "video/mp2t",
    },
  ],
]);
export const samplesArr = Array.from(samples.entries());

export const EMPTY_CONSOLE_TEXT = "No Logs...";
export const FFMPEG_DEFAULT_OPTS: FFmpegConfig = {
  args: ["-c:v", "libx264"],
  inFilename: "video.avi",
  outFilename: "video.mp4",
  mediaType: "video/mp4",
  forceUseArgs: null,
};

export const ffmpegOpts = writable(
  Object.assign({}, FFMPEG_DEFAULT_OPTS)
);