// import { FFmpeg } from "../../node_modules/.pnpm/@ffmpeg+ffmpeg@0.12.7/node_modules/@ffmpeg/ffmpeg/dist/esm/classes.js";
import { FFmpeg } from "@ffmpeg/ffmpeg";


import FFmpegCoreUrl from "../../node_modules/@ffmpeg/core-mt/dist/umd/ffmpeg-core.js?url";
import FFmpegWASMUrl from "../../node_modules/@ffmpeg/core-mt/dist/umd/ffmpeg-core.wasm?url";
import FFmpegWorkerUrl from "../../node_modules/@ffmpeg/core-mt/dist/umd/ffmpeg-core.worker.js?url";

// import FFmpegCoreUrl from "@ffmpeg/core-mt?url";
// import FFmpegWASMUrl from "@ffmpeg/core-mt/wasm?url";
// import FFmpegWorkerUrl from "./vendor/worker.ts?url";
// import FFmpegWorkerUrl from "@ffmpeg/core-mt/dist/esm/ffmpeg-core.worker.js?url";

// import FFmpegCoreUrl from "../../node_modules/@ffmpeg/core-mt/dist/esm/ffmpeg-core.js?url";
// import FFmpegWASMUrl from "../../node_modules/@ffmpeg/core-mt/dist/esm/ffmpeg-core.wasm?url";
// import FFmpegWorkerUrl from "../../node_modules/@ffmpeg/core-mt/dist/umd/ffmpeg-core.worker.js?url";
// import FFmpegWorkerRaw from "../../node_modules/@ffmpeg/core-mt/dist/esm/ffmpeg-core.worker.js?raw";

import { toBlobURL, toDataUrl } from "./utils/url.ts"

type FFmpegLoadParams = Parameters<(typeof FFmpeg)['prototype']['load']>;
type FFMessageLoadConfig = FFmpegLoadParams[0];
type FFMessageOptions = FFmpegLoadParams[1];

/*
 * Create ffmpeg instance.
 * Each ffmpeg instance owns an isolated MEMFS and works
 * independently.
 *
 * For example:
 *
 * ```
 * const ffmpeg = createFFmpeg({
 *  log: true,
 *  logger: () => {},
 *  progress: () => {},
 *  corePath: '',
 * })
 * ```
 *
 * For the usage of these four arguments, check config.js
 *
 */
export async function createFFmpeg (config?: FFMessageLoadConfig, opts?: FFMessageOptions) { 
  const ffmpegInstance = new FFmpeg();
  const initialConfig: FFMessageLoadConfig = {
    coreURL: FFmpegCoreUrl,
    wasmURL: FFmpegWASMUrl,
    // workerURL: toDataUrl(FFmpegWorkerRaw, "text/javascript"),
    workerURL: FFmpegWorkerUrl,
    // coreURL: await toBlobURL(FFmpegCoreUrl, 'text/javascript'),
    // wasmURL: await toBlobURL(FFmpegWASMUrl, 'application/wasm'),
    // workerURL: await toBlobURL(FFmpegWorkerUrl, 'text/javascript'),
    ...config
  }
  console.log(initialConfig)
  await ffmpegInstance.load(initialConfig, opts);
  return ffmpegInstance;
}

/**
 * An util function to fetch data from url string, base64, URL, File or Blob format.
 *
 * Examples:
 * ```ts
 * // URL
 * await fetchFile("http://localhost:3000/video.mp4");
 * // base64
 * await fetchFile("data:<type>;base64,wL2dvYWwgbW9yZ...");
 * // URL
 * await fetchFile(new URL("video.mp4", import.meta.url));
 * // File
 * fileInput.addEventListener('change', (e) => {
 *   await fetchFile(e.target.files[0]);
 * });
 * // Blob
 * const blob = new Blob(...);
 * await fetchFile(blob);
 * ```
 */
/**
 * Helper function for fetching files from various resources.
 * Sometimes the video/audio file you want to process may be located
 * in a remote URL or somewhere in your local file system.
 *
 * This helper function helps you to fetch the file and return an
 * Uint8Array variable for ffmpeg.wasm to consume.
 *
 * @param {string | ArrayBuffer | Blob | File} data - The data to be fetched.
 * @returns {Promise<Uint8Array>} - The fetched data as a Uint8Array.
 */
export async function fetchFile(data: string | ArrayBuffer | Blob | File, opts?: RequestInit): Promise<Uint8Array> {
  if (typeof data === 'string') {
    const response = await fetch(data, opts);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } else if (data instanceof ArrayBuffer) {
    return Promise.resolve(new Uint8Array(data));
  } else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          const { result } = event.target;
          if (result instanceof ArrayBuffer) {
            resolve(new Uint8Array(result));
          } else {
            reject(new TypeError('Unexpected result type'));
          }
        } else {
          reject(new Error('FileReader event target is missing'));
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsArrayBuffer(data as Blob);
    });
  }
}
