var process;
var global = globalThis;
globalThis.process = globalThis.process ?? {};
globalThis.global = globalThis.global ?? globalThis;

import workerUrl from "@ffmpeg.wasm/core-mt/dist/core.worker.js?url";
importScripts(workerUrl);