import { useSignal } from "@builder.io/qwik";

export const abortCtlr = useSignal(new AbortController());

export const progress = useSignal(0);
export const loading = useSignal(false);
export const initializing = useSignal(false);
export const fileOpenMode = useSignal(false);
 
export const error = useSignal<string | null>(null);
export const results = useSignal<
  Array<{ type?: string | null; url?: string | null }>
>([]);

export const EMPTY_CONSOLE_TEXT = "No Logs...";