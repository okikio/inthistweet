export const ERROR_RESPONSE_BODY_READER = new Error(
  "failed to get response body reader"
);
export const ERROR_INCOMPLETED_DOWNLOAD = new Error(
  "failed to complete download"
);

export const HeaderContentLength = "Content-Length";
export interface DownloadProgressEvent {
  url: string | URL;
  total: number;
  received: number;
  delta: number;
  done: boolean;
}

export type ProgressCallback = (event: DownloadProgressEvent) => void;

export function tryURL(value: string) {
  try {
    new URL(value);
    return true;
  } catch (e) { }
  return false;
}

/**
 * Download content of a URL with progress.
 *
 * Progress only works when Content-Length is provided by the server.
 *
 */
export const downloadWithProgress = async (
  url: string | URL,
  cb?: ProgressCallback
): Promise<ArrayBuffer> => {
  const resp = await fetch(url);
  let buf;

  try {
    // Set total to -1 to indicate that there is not Content-Type Header.
    const total = parseInt(resp.headers.get(HeaderContentLength) || "-1");

    const reader = resp.body?.getReader();
    if (!reader) throw ERROR_RESPONSE_BODY_READER;

    const chunks = [];
    let received = 0;
    for (; ;) {
      const { done, value } = await reader.read();
      const delta = value ? value.length : 0;

      if (done) {
        if (total != -1 && total !== received) throw ERROR_INCOMPLETED_DOWNLOAD;
        cb && cb({ url, total, received, delta, done });
        break;
      }

      chunks.push(value);
      received += delta;
      cb && cb({ url, total, received, delta, done });
    }

    const data = new Uint8Array(received);
    let position = 0;
    for (const chunk of chunks) {
      data.set(chunk, position);
      position += chunk.length;
    }

    buf = data.buffer;
  } catch (e) {
    console.log(`failed to send download progress event: `, e);
    // Fetch arrayBuffer directly when it is not possible to get progress.
    buf = await resp.arrayBuffer();
    cb &&
      cb({
        url,
        total: buf.byteLength,
        received: buf.byteLength,
        delta: 0,
        done: true,
      });
  }

  return buf;
};

/**
 * toBlobURL fetches data from an URL and return a blob URL.
 *
 * Example:
 *
 * ```ts
 * await toBlobURL("http://localhost:3000/ffmpeg.js", "text/javascript");
 * ```
 */
export const toBlobURL = async (
  url: string,
  mimeType: string,
  progress = false,
  cb?: ProgressCallback
): Promise<string> => {
  const buf = progress
    ? await downloadWithProgress(url, cb)
    : await (await fetch(url)).arrayBuffer();
  const blob = new Blob([buf], { type: mimeType });
  return URL.createObjectURL(blob);
};

/**
 * Converts file content to a Base64-encoded data URL.
 *
 * This function takes the content of a file as a string and its MIME type,
 * then returns a data URL that represents the encoded content. Data URLs
 * can be used to embed the content directly into web documents or stylesheets.
 *
 * @param content - The content of the file as a string.
 * @param mimeType - The MIME type of the file, e.g., "image/png".
 * @returns The Base64-encoded data URL.
 *
 * @example
 * const imageUrl = toDataUrl('<image-binary-data>', 'image/png');
 * console.log(imageUrl); // data:image/png;base64,<Base64-encoded-data>
 */
export function toDataUrl(content: string, mimeType: string): string {
  // Encode the file content to Base64. We use btoa function which encodes
  // a string in base-64. This function is universally supported in JavaScript
  // environments, including Deno. It's important to ensure that the content
  // is properly encoded to avoid issues with binary data or special characters.
  const base64Content = btoa(content);

  // Construct the data URL by concatenating the parts together.
  // The format follows: "data:[<MIME-type>];base64,[<data>]"
  const dataUrl = `data:${mimeType};base64,${base64Content}`;

  return dataUrl;
}
