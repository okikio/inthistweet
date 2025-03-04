
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
export async function fetchFile(data: string | Uint8Array | ArrayBuffer | Blob | File, opts?: RequestInit): Promise<Uint8Array> {
  if (typeof data === 'string') {
    const response = await fetch(data, opts);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  } else if (data instanceof Uint8Array) { 
    return data;
  } else {
    return await new Promise((resolve, reject) => {
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
