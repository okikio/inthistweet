import type { EditorStateConfig } from "@codemirror/state";
import { EditorView } from "codemirror";
import { writable } from "svelte/store";
import { onMount } from "svelte";

export function createCodeMirror(editorState: EditorStateConfig, parentEl?: HTMLElement) {
  console.log({
    editorState
  })
  return new EditorView({
    parent: parentEl,
    ...editorState,
  })
}
