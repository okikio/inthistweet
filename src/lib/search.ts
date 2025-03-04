import type { FFmpeg } from "@ffmpeg.wasm/main";
import type { EditorView } from "codemirror";

import { get } from "svelte/store";

import { abortCtlr, error, loading, EMPTY_CONSOLE_TEXT } from "./state.ts";
import { traverseManifest } from "./m3u8/traverse.ts";
import { uriToFilePath } from "./m3u8/urls.ts";
import { transcode } from "./transcode.ts";
import { fetchFile } from "./ffmpeg.ts";

export async function onSearch(e?: Event, vid? : HTMLVideoElement | null, ffmpeg?: FFmpeg, value?: string, consoleView?: EditorView, popState = false) {
  e?.preventDefault?.();
  abortCtlr.set(new AbortController());
  error.set(null);

  if (!value) return;
  if (value && value.length <= 0) return;
  loading.set(true);

  try {
    if (!ffmpeg ) return;
    // || !ffmpeg?.isLoaded?.()

    let arrbuf = await fetchFile(value, { signal: get(abortCtlr).signal });
    let inputArrBuf: Uint8Array | null = arrbuf;

    let _url = new URL(value);
    console.log({ _url });

    if (/\.(m3u8?)$/.test(_url?.pathname)) {
      try {
        // const [map, playlist] = await traverseManifest(arrbuf.buffer, _url);
        const [hls, promise] = traverseManifest(_url);
        const data = await promise;

        if (vid) { 
          // hls.attachMedia(vid);
        }

        const map = new Map<string, ArrayBuffer>();
        const level = data.levels.sort((a, b) => b.bitrate - a.bitrate)[0];

        console.log({
          hls,
          data,
          // levels: data.levels,
          firstLevel: data.firstLevel,
          level,
        })

        if (level.url?.length > 0) {
          const frag = level.details?.fragments?.map(x => (
            [
              new URL(x.url, x.baseurl).href,
              uriToFilePath(x.url, x.baseurl)
            ] as const
          )) ?? []; 
          let m3u8 = level.details?.m3u8 ?? "";
          frag?.forEach(([url, path]) => { 
            m3u8 = m3u8?.replace(url, path);
          })
          const uint8arr = new TextEncoder().encode(m3u8);
          map.set(uriToFilePath(level.url[0]), uint8arr.buffer);
          inputArrBuf = uint8arr;


          const batchSize = 5;
          const toProcess = [...frag];
          while (toProcess.length > 0) {
            // Processing URIs in batches to manage memory and network load.
            const batch = toProcess.splice(0, batchSize);

            // Fetching each URI in the batch in parallel for efficiency.
            await Promise.all(
              batch.map(async ([url, path]) => {
                console.log({
                  url,
                  path
                })
                // const url = new URL(uri, baseUrl);
                // console.log(`Fetching ${url}`);

                // Checking and parsing nested M3U8 files for additional URIs.
                const buf = await fetch(url).then(resp => resp.arrayBuffer());
                map.set(path, buf);
              })
            );
          }
        }

        // if (map) {
        //   const modifiedInputArrBuf = map.get(uriToFilePath(_url.href));
        //   if (modifiedInputArrBuf)
        //     inputArrBuf = new Uint8Array(modifiedInputArrBuf);

        //   map?.forEach?.((buf, url) => {
        //     if (!buf) return;

        //     try {
        //       ffmpeg.FS("writeFile", url, new Uint8Array(buf));
        //       // ffmpeg.writeFile(url, new Uint8Array(buf));
        //       if (!consoleView) return;

        //       const doc = consoleView.state.doc;
        //       let changes: ChangeSpec[] = [];

        //       if (doc.toString().trim() === EMPTY_CONSOLE_TEXT) {
        //         changes.push({ from: 0, to: doc.length });
        //       }

        //       // (Assume view is an EditorView instance holding the document "123".)
        //       const message = `[url] ${url}\n`;
        //       changes.push({ from: doc.length, insert: message });

        //       let transaction = consoleView.state.update({ changes });
        //       // At this point the view still shows the old state.
        //       consoleView.dispatch(transaction);
        //       // And now it shows the new state.
        //     } catch (e) {
        //       console.log(url);
        //       console.warn(e);
        //     }
        //   });
        // }
      } catch (e) {
        console.warn(`Cannot parse "${value}" as m3u8 playlist`, e);
      }
    }

    if (inputArrBuf) {
      await transcode({
        target: {
          // @ts-ignore
          files: [inputArrBuf]
        }
      }, ffmpeg, value, popState);
    }
  } catch (e) {
    error.set((e ?? "").toString());
    console.warn(e);
  } finally {
    loading.set(false);
  }
}