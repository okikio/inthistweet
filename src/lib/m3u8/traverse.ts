import { M3uMedia, M3uParser } from "m3u-parser-generator"
import { urlToFilePath } from "./urls";

/**
 * Converts an ArrayBuffer of an M3U8 file into a parsed representation.
 * 
 * This function is crucial for processing M3U8 files, which are used for streaming media playlists.
 * It takes the raw binary data of the M3U8 file, decodes it to text, and then uses the m3u8Parser
 * library to parse the text into a structured format. The parsing process identifies and organizes 
 * various elements of the M3U8 file like segments, playlists, etc., which are essential for 
 * subsequent processing and traversal.
 * 
 * The use of TextDecoder for converting ArrayBuffer to text ensures efficient handling of binary
 * data, especially for large files, which is common in streaming contexts.
 * 
 * @param arrbuf - The ArrayBuffer containing the M3U8 file data.
 * @returns A parser object that represents the parsed structure of the M3U8 file.
 */
export function parseManifest(arrbuf: ArrayBuffer) {
  // Decode the ArrayBuffer to a text string using TextDecoder.
  const toText = new TextDecoder().decode(arrbuf);
  const playlist = M3uParser.parse(toText);
  return playlist;
}

/**
 * Traverse M3U8 manifests and fetches the referenced resources within a 2-minute limit.
 * 
 * This function is optimized for performance by minimizing redundant array operations and 
 * efficiently managing network requests. It processes an M3U8 file, fetching all unique URIs 
 * referenced in it and any nested M3U8 files, and aborts if the operation exceeds 2 minutes.
 * 
 * Performance is optimized by using Sets for deduplication and minimizing array transformations.
 * The function handles edge cases like undefined URIs and nested M3U8 files.
 * 
 * @param arrbuf - An ArrayBuffer containing the contents of the M3U8 file.
 * @param baseUrl - The base URL used for resolving relative URIs in the M3U8 file.
 * @param batchSize - Batch the fetch requests in increments of `batchSize`, this is primarily used for resolving relative URIs in the M3U8 file.
 * @param timeout - Timeout for batch requests.
 */
export async function traverseM3U8Manifests(arrbuf: ArrayBuffer, baseUrl: URL, batchSize = 10, timeout = 120_000) {
  const abortCtrl = new AbortController();
  const timeoutId = setTimeout(() => abortCtrl.abort(), timeout); // 2-minute timeout

  const fileMap = new Map<string, ArrayBuffer>()
  try {
    const playlist = parseManifest(arrbuf);
    const { medias } = playlist;
    const modifiedMedias: M3uMedia[] = [];

    // Initial deduplication of URIs using a Set to improve performance.
    const uris = new Set<string>(
      (medias ?? []).map(item => {
        modifiedMedias.push({ ...item, location: urlToFilePath(item.location) });
        return item.location;
      }).filter((uri): uri is string => uri !== undefined)
    );

    const toProcess = Array.from(uris); // Array of URIs to process
    while (toProcess.length > 0) {
      // Processing URIs in batches to manage memory and network load.
      const batch = toProcess.splice(0, batchSize);

      // Fetching each URI in the batch in parallel for efficiency.
      const fetchedBuffers = await Promise.all(batch.map(async uri => {
        const url = new URL(uri, baseUrl);
        const buf = await fetch(url, { signal: abortCtrl.signal }).then(resp => resp.arrayBuffer());
        return [url, buf] as const;
      }));

      // Post-fetch processing to parse nested M3U8 files and update URI lists.
      batch.forEach((uri, index) => {
        const [url, buf] = fetchedBuffers[index];
        fileMap.set(urlToFilePath(uri), buf);

        // Checking and parsing nested M3U8 files for additional URIs.
        if (/\.(m3u8|m3u)$/.test(url.pathname)) {
          const subPlaylist = parseManifest(buf);
          const { medias: subMedias } = subPlaylist;

          const modifiedSubMedias: M3uMedia[] = [];
          (subMedias ?? []).forEach(item => {
            const _uri = item?.location;
            if (_uri && !uris.has(_uri)) {
              modifiedSubMedias.push({ ...item, location: urlToFilePath(item.location) });
              uris.add(_uri);
              toProcess.push(_uri); // Adding new URIs for processing
            }
          });

          subPlaylist.medias = modifiedSubMedias;
          fileMap.set(urlToFilePath(uri), new TextEncoder().encode(subPlaylist.getM3uString()));
        }
      });
    }

    playlist.medias = modifiedMedias;
    fileMap.set(urlToFilePath(baseUrl.href), new TextEncoder().encode(playlist.getM3uString()));

    return fileMap
  } catch (error) {
    console.error("Error parsing M3U8 manifest:", error);
    // Error handling for network failures, parsing errors, etc.
  } finally {
    clearTimeout(timeoutId); // Cleaning up the timeout to prevent leaks
  }
}
