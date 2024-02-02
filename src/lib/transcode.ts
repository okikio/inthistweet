import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { get } from "svelte/store";

import { abortCtlr, error, ffmpegOpts, loading, results } from "./state";
import { fetchFile } from "./ffmpeg";
import { tryURL } from "./utils/url";

export async function transcode({ target }: Event & { currentTarget: EventTarget & HTMLInputElement }, ffmpeg: FFmpeg, value: string, popState = false) {
  const ffmpegOptions = get(ffmpegOpts);

  const { files } = target as HTMLInputElement;
  const file = files?.[0];
  
  error.set(null);
  loading.set(true);

  try {
    if (!file) return;
    if (!ffmpeg || !ffmpeg?.loaded) return;

    abortCtlr.set(new AbortController());
    await ffmpeg.writeFile(
      ffmpegOptions.inFilename,
      await fetchFile(file, { signal: get(abortCtlr).signal })
    );

    if (Array.isArray(ffmpegOptions.forceUseArgs)) {
      await ffmpeg.exec(ffmpegOptions.forceUseArgs);
    } else {
      await ffmpeg.exec([
        "-i",
        ffmpegOptions.inFilename,
        ...ffmpegOptions.args,
        ffmpegOptions.outFilename,
      ]);
    }

    const { mediaType } = ffmpegOptions;
    const data = await ffmpeg.readFile(ffmpegOptions.outFilename);
    const url = URL.createObjectURL(
      new Blob([data], { type: mediaType })
    );
    
    const tempResults = Array.from(get(results));
    tempResults.unshift({ url, type: getMediaType(mediaType) });
    results.set(tempResults);

    ffmpeg.terminate();
    await ffmpeg.load();
    
    if (!popState && tryURL(value)) {
      const newURL = new URL(globalThis.location.href);
      newURL.search = new URLSearchParams({ 
        q: value, 
        config: JSON.stringify(ffmpegOpts),
      }).toString();
      globalThis?.history?.pushState?.(null, "", newURL);
    }
  } catch (e) {
    error.set((e ?? "").toString());
    console.warn(e);
  } finally {
    loading.set(false);
  }
}

export function getMediaType(mediaType: string) {
  return (
    (/^(video|audio)/.test(mediaType) || mediaType === "vnd.apple.mpegURL") ? "video" : "image"
  )
}