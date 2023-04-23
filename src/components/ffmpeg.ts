
import type { createFFmpeg as ffmpegCreate, CreateFFmpegOptions } from "@ffmpeg.wasm/main/src/index";
import type { StreamParser } from "@codemirror/language"

declare module globalThis {
  var FFmpeg: { createFFmpeg: typeof ffmpegCreate }
}

const FFmpeg = globalThis?.FFmpeg ?? {};

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
export const createFFmpeg = (options?: CreateFFmpegOptions) => FFmpeg.createFFmpeg(options);

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

// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Splits the given array into chunks of the given size and returns them.
 *
 * @example
 * ```ts
 * import { chunk } from "https://deno.land/std@$STD_VERSION/collections/chunk.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const words = [
 *   "lorem",
 *   "ipsum",
 *   "dolor",
 *   "sit",
 *   "amet",
 *   "consetetur",
 *   "sadipscing",
 * ];
 * const chunks = chunk(words, 3);
 *
 * assertEquals(
 *   chunks,
 *   [
 *     ["lorem", "ipsum", "dolor"],
 *     ["sit", "amet", "consetetur"],
 *     ["sadipscing"],
 *   ],
 * );
 * ```
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
  if (size <= 0 || !Number.isInteger(size)) {
    throw new Error(
      `Expected size to be an integer greater than 0 but found ${size}`,
    );
  }

  if (array.length === 0) {
    return [];
  }

  const ret = Array.from<T[]>({ length: Math.ceil(array.length / size) });
  let readIndex = 0;
  let writeIndex = 0;

  while (readIndex < array.length) {
    ret[writeIndex] = array.slice(readIndex, readIndex + size);

    writeIndex += 1;
    readIndex += size;
  }

  return ret;
}

/**
 * Returns the difference between two arrays (unique elements in array1 that are not present in array2).
 *
 * @template T - The type of the elements in the input arrays.
 * @param {T[]} arr1 - The first input array.
 * @param {T[]} arr2 - The second input array.
 * @returns {T[]} - An array containing the unique elements of array1 not present in array2.
 */
export function diff<T>(arr1: readonly T[], arr2: readonly T[]): T[] {
  const a = new Set(arr1);
  const b = new Set(arr2);

  return Array.from([...a].filter(x => !b.has(x)));
}

var words: Record<string, string> = {};
function define(style: string, dict: string | any[]) {
  for (var i = 0; i < dict.length; i++) {
    words[dict[i]] = style;
  }
};

var commonAtoms = ["true", "false"];
var commonKeywords = ["if", "then", "do", "else", "elif", "while", "until", "for", "in", "esac", "fi",
  "fin", "fil", "done", "exit", "set", "unset", "export", "function"];
var commonCommands = ["ab", "awk", "bash", "beep", "cat", "cc", "cd", "chown", "chmod", "chroot", "clear",
  "cp", "curl", "cut", "diff", "echo", "find", "gawk", "gcc", "get", "git", "grep", "hg", "kill", "killall",
  "ln", "ls", "make", "mkdir", "openssl", "mv", "nc", "nl", "node", "npm", "ping", "ps", "restart", "rm",
  "rmdir", "sed", "service", "sh", "shopt", "shred", "source", "sort", "sleep", "ssh", "start", "stop",
  "su", "sudo", "svn", "tee", "telnet", "top", "touch", "vi", "vim", "wall", "wc", "wget", "who", "write",
  "yes", "zsh"];

define('atom', commonAtoms);
define('keyword', commonKeywords);
define('builtin', commonCommands);

function tokenBase(stream: { eatSpace: () => any; sol: () => any; next: () => string; eat: (arg0: string) => string; skipToEnd: () => void; eatWhile: (arg0: RegExp) => void; match: (arg0: string | RegExp) => any; eol: () => any; peek: () => string; current: () => any; }, state: { tokens: { (stream: any, state: any): any; (stream: any, state: any): any; (stream: any, state: any): string; }[]; }) {
  if (stream.eatSpace()) return null;

  var sol = stream.sol();
  var ch = stream.next();

  if (ch === '\\') {
    stream.next();
    return null;
  }
  if (ch === '\'' || ch === '"' || ch === '`') {
    state.tokens.unshift(tokenString(ch, ch === "`" ? "quote" : "string"));
    return tokenize(stream, state);
  }
  if (ch === '#') {
    if (sol && stream.eat('!')) {
      stream.skipToEnd();
      return 'meta'; // 'comment'?
    }
    stream.skipToEnd();
    return 'comment';
  }
  if (ch === '$') {
    state.tokens.unshift(tokenDollar);
    return tokenize(stream, state);
  }
  if (ch === '+' || ch === '=') {
    return 'operator';
  }
  if (ch === '-') {
    stream.eat('-');
    stream.eatWhile(/\w/);
    return 'attribute';
  }
  if (ch == "<") {
    if (stream.match("<<")) return "operator"
    var heredoc = stream.match(/^<-?\s*['"]?([^'"]*)['"]?/)
    if (heredoc) {
      state.tokens.unshift(tokenHeredoc(heredoc[1]))
      return 'string.special'
    }
  }
  if (/\d/.test(ch)) {
    stream.eatWhile(/\d/);
    if (stream.eol() || !/\w/.test(stream.peek())) {
      return 'number';
    }
  }
  stream.eatWhile(/[\w-]/);
  var cur = stream.current();
  if (stream.peek() === '=' && /\w+/.test(cur)) return 'def';
  return words.hasOwnProperty(cur) ? words[cur] : null;
}

function tokenString(quote: string, style: string) {
  var close = quote == "(" ? ")" : quote == "{" ? "}" : quote
  return function (stream: { next: () => any; peek: () => any; backUp: (arg0: number) => void; }, state: { tokens: { (stream: any, state: any): any; (stream: any, state: any): any; (stream: any, state: any): any; }[]; }) {
    var next, escaped = false;
    while ((next = stream.next()) != null) {
      if (next === close && !escaped) {
        state.tokens.shift();
        break;
      } else if (next === '$' && !escaped && quote !== "'" && stream.peek() != close) {
        escaped = true;
        stream.backUp(1);
        state.tokens.unshift(tokenDollar);
        break;
      } else if (!escaped && quote !== close && next === quote) {
        state.tokens.unshift(tokenString(quote, style))
        return tokenize(stream, state)
      } else if (!escaped && /['"]/.test(next) && !/['"]/.test(quote)) {
        state.tokens.unshift(tokenStringStart(next, "string"));
        stream.backUp(1);
        break;
      }
      escaped = !escaped && next === '\\';
    }
    return style;
  };
};

function tokenStringStart(quote: any, style: string) {
  return function (stream: { next: () => void; }, state: { tokens: ((stream: any, state: any) => any)[]; }) {
    state.tokens[0] = tokenString(quote, style)
    stream.next()
    return tokenize(stream, state)
  }
}

var tokenDollar = function (stream: { eat: (arg0: string) => void; next: () => any; eatWhile: (arg0: RegExp) => void; }, state: { tokens: ((stream: any, state: any) => any)[] | void[]; }) {
  if (state.tokens.length > 1) stream.eat('$');
  var ch = stream.next()
  if (/['"({]/.test(ch)) {
    state.tokens[0] = tokenString(ch, ch == "(" ? "quote" : ch == "{" ? "def" : "string");
    return tokenize(stream, state);
  }
  if (!/\d/.test(ch)) stream.eatWhile(/\w/);
  state.tokens.shift();
  return 'def';
};

function tokenHeredoc(delim: any) {
  return function (stream: { sol: () => any; string: any; skipToEnd: () => void; }, state: { tokens: void[]; }) {
    if (stream.sol() && stream.string == delim) state.tokens.shift()
    stream.skipToEnd()
    return "string.special"
  }
}

function tokenize(stream: any, state: { tokens: any[]; }) {
  return (state.tokens[0] || tokenBase)(stream, state);
};

export const shell: StreamParser<unknown> = {
  name: "shell",
  startState: function () { return { tokens: [] }; },
  token: function (stream: any, state: any) {
    return tokenize(stream, state);
  },
  languageData: {
    autocomplete: commonAtoms.concat(commonKeywords, commonCommands),
    closeBrackets: { brackets: ["(", "[", "{", "'", '"', "`"] },
    commentTokens: { line: "#" }
  }
};


// const m3u8 = new M3U8Parser({ playlist: toText });
// await Promise.all(
//   m3u8.getPlaylist().items.map(async ({url}) => {
//     if (url) {
//       console.log(new URL(url, value).href)
//       ffmpeg.FS('writeFile', url, await fetchFile(new URL(url, value).href));
//     }
//   })
// );
    
// console.log({
//   m3u8,
//   getPlalist: m3u8.getPlaylist(),
// })