import type { Emscripten } from "@ffmpeg.wasm/main";

import { describe, test } from "vitest";
import { traverseManifest } from "../src/lib/m3u8/traverse.ts";
import { uriToFilePath } from "../src/lib/m3u8/urls.ts";

import core from '@ffmpeg.wasm/core-mt';
import { FFmpeg } from "@ffmpeg.wasm/main";

import { readFile, writeFile } from "fs/promises";
import { join } from "@std/path";

async function tt(value: string) {
  let _url = new URL(value);
  const map = new Map<string, ArrayBuffer>();

  if (/\.(m3u8?)$/.test(_url?.pathname)) {
    try {
      const [hls, promise] = traverseManifest(_url);
      const data = await promise;

      console.log({
        hls,
        data,
        // levels: data.levels,
        firstLevel: data.firstLevel,
      })

      data.levels.sort((a, b) => b.bitrate - a.bitrate).forEach(lvl => {
        console.log(lvl);
      });
      

      // if (map) {
      //   const toProcess = Array.from(unfetchedResources); // Array of URIs to process

      //   const baseUrl = _url;
      //   const batchSize = 5;
      //   while (toProcess.length > 0) {
      //     // Processing URIs in batches to manage memory and network load.
      //     const batch = toProcess.splice(0, batchSize);

      //     // Fetching each URI in the batch in parallel for efficiency.
      //     await Promise.all(
      //       batch.map(async uri => {
      //         const url = new URL(uri, baseUrl);
      //         // console.log(`Fetching ${url}`);

      //         // Checking and parsing nested M3U8 files for additional URIs.
      //         const buf = await fetch(url, { signal: abortCtlr.signal })
      //           .then(resp => resp.arrayBuffer());
      //         map.set(uriToFilePath(uri), buf);
      //       })
      //     );

      //   }
      // }

      return map;
    } catch (e) {
      console.warn(`Cannot parse "${value}" as m3u8 playlist`, e);
    }
  }
}

describe("Traverse m3u8", () => {
  test("Traverse simple m3u8", async () => {

    const ffmpeg = await FFmpeg.create({
      core,
      log: true,
      logger(type, ...msg) {
        console.log(`[${type}] ${msg.join(" ")}`);
      }
    });


    // ffmpeg.fs.writeFile("test.txt", new TextEncoder().encode("Hello, World!"));
    // console.log("File written", ffmpeg.fs.readFile("test.txt", { encoding: "utf8" }));

    const url = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
    const map = await tt(url) ?? [];
    const resUrl = uriToFilePath(url);  // Array.from(map!.keys())?.filter(x => /h264_aac_fhd_7/.test(x) && /\.m3u8?$/.test(x))[0]!;
    console.log("Map", map);

    // map?.forEach?.((buf, url) => {
    //   if (!buf) return;

    //   try {
    //     ffmpeg.fs.writeFile(url, new Uint8Array(buf));
    //     // And now it shows the new state.
    //   } catch (e) {
    //     console.log(url);
    //     console.warn(e);
    //   }
    // });

    console.log("resUrl", resUrl);
    // console.log("File written", ffmpeg.fs.readFile(resUrl, { encoding: "utf8" }));

    const ffmpegOptions = {
      // args: ["-c", "copy", "-bsf:a", "aac_adtstoasc"],
      inFilename: resUrl!,
      outFilename: "video.mp4",
      mediaType: "video/mp4",
      forceUseArgs: [
        // "-protocol_whitelist",
        // "file,http,https,tcp,tls,crypto",
        "-i",
        resUrl!,
        "-codec",
        "copy",
        // "-c",
        // "copy",
        // "-bsf:a",
        // "aac_adtstoasc",
        "video.mp4",
      ],
    };
    // await ffmpeg.run(...ffmpegOptions.forceUseArgs);
    // await writeFile(
    //   join(import.meta.dirname, "../public", "video.mp4"),
    //   ffmpeg.fs.readFile("video.mp4")
    // );
    // ffmpeg.exit("kill");

  })
})