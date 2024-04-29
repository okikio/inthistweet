import { writable } from "svelte/store";

export const abortCtlr = writable(new AbortController());

export const progress = writable(0);
export const loading = writable(false);
export const initializing = writable(false);
export const fileOpenMode = writable(false);
 
export const error = writable<string | null>(null);
export const results = writable<
  Array<{ type?: string | null; url?: string | null }>
>([]);

export const EMPTY_CONSOLE_TEXT = "No Logs...";