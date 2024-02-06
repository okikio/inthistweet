import type { ChangeSpec } from "@codemirror/state";
// import type { FFmpeg } from "@ffmpeg/ffmpeg";
import type { FFmpeg } from "@ffmpeg.wasm/main";
import type { EditorView } from "codemirror";

import { get } from "svelte/store";

import { abortCtlr, error, loading, EMPTY_CONSOLE_TEXT } from "./state";
import { traverseM3U8Manifests } from "./m3u8/traverse";
import { urlToFilePath } from "./m3u8/urls";
import { transcode } from "./transcode";
import { fetchFile } from "../components/ffmpeg";

export async function onSearch(e?: Event, ffmpeg?: FFmpeg, value?: string, consoleView?: EditorView, popState = false) {
  e?.preventDefault?.();
  abortCtlr.set(new AbortController());
  error.set(null);

  if (!value) return;
  if (value && value.length <= 0) return;
  loading.set(true);

  try {
    if (!ffmpeg || !ffmpeg?.isLoaded?.()) return;

    const arrbuf = await fetchFile(value, { signal: get(abortCtlr).signal });
    let inputArrBuf = arrbuf;

    let _url = new URL(value);
    console.log({ _url });

    if (/\.(m3u8|m3u)$/.test(_url?.pathname)) {
      try {
        const map = await traverseM3U8Manifests(arrbuf.buffer, _url);
        if (map) {
          const modifiedInputArrBuf = map.get(urlToFilePath(_url.href));
          if (modifiedInputArrBuf)
            inputArrBuf = new Uint8Array(modifiedInputArrBuf);

          map?.forEach?.((buf, url) => {
            if (!buf) return;

            try {
              ffmpeg.FS("writeFile", url, new Uint8Array(buf));
              // ffmpeg.writeFile(url, new Uint8Array(buf));
              if (!consoleView) return;

              const doc = consoleView.state.doc;
              let changes: ChangeSpec[] = [];

              if (doc.toString().trim() === EMPTY_CONSOLE_TEXT) {
                changes.push({ from: 0, to: doc.length });
              }

              // (Assume view is an EditorView instance holding the document "123".)
              const message = `[url] ${url}\n`;
              changes.push({ from: doc.length, insert: message });

              let transaction = consoleView.state.update({ changes });
              // At this point the view still shows the old state.
              consoleView.dispatch(transaction);
              // And now it shows the new state.
            } catch (e) {
              console.log(url);
              console.warn(e);
            }
          });
        }
      } catch (e) {
        console.warn(`Cannot parse "${value}" as m3u8 playlist`, e);
      }
    }

    await transcode({
      target: {
        // @ts-ignore
        files: [inputArrBuf]
      }
    }, ffmpeg, value, popState);
  } catch (e) {
    error.set((e ?? "").toString());
    console.warn(e);
  } finally {
    loading.set(false);
  }
}