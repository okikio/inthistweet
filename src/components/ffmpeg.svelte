<script lang="ts">
  import type { ViewUpdate } from "@codemirror/view";
  import type { ChangeSpec } from "@codemirror/state";
  import type { FFmpeg } from "@ffmpeg.wasm/main";

  import type { Manifest } from "../lib/m3u8/mod";
  // @ts-ignore
  import * as m3u8Parser from "m3u8-parser"

  import { writable } from "svelte/store";
	import { blur } from 'svelte/transition';

  import {
    InfoBar,
    Button,
    TextBlock,
    TextBox,
    TextBoxButton,
  } from "fluent-svelte";

  import FluentDismiss24Regular from "~icons/fluent/dismiss-24-regular";
  import FluentSearch24Regular from "~icons/fluent/search-24-regular";
  import FluentOpen24Regular from "~icons/fluent/open-24-regular";
  import FluentFolder24Regular from "~icons/fluent/folder-24-regular";
  import FluentFolder24Filled from "~icons/fluent/folder-24-filled";
  import FluentRecord24Filled from "~icons/fluent/record-stop-24-filled";
  import FluentPlay24Filled from '~icons/fluent/play-24-filled'

  import { createFFmpeg, fetchFile, diff, shell } from "./ffmpeg";

  import { hyperLink } from '@uiw/codemirror-extensions-hyper-link';
  import { oneDark, color } from "@codemirror/theme-one-dark";
  import { json } from "@codemirror/lang-json";

  import { markdown } from "@codemirror/lang-markdown";
  import { StreamLanguage } from "@codemirror/language";

  import { EditorView, scrollPastEnd } from "@codemirror/view";
  import { basicSetup } from "codemirror";

  import { onMount } from "svelte";
  import { element_is } from "svelte/internal";

  interface FFmpegConfig {
    args: string[],
    inFilename: string,
    outFilename: string,
    mediaType: string,
    forceUseArgs: string[] | null,
  }

  const ffmpegDefaultOpts: FFmpegConfig = {
    args: ['-c:v', 'libx264'],
    inFilename: 'video.avi',
    outFilename: 'video.mp4',
    mediaType: 'video/mp4',
    forceUseArgs: null,
  }

  const emptyConsole = "No Logs...";
  let ffmpegOpts = Object.assign({}, ffmpegDefaultOpts);
  let ffmpeg: FFmpeg; 

  let editorView: EditorView;
  let consoleView: EditorView;

  let searchInputEl: HTMLInputElement;
  let uploadInputEl: HTMLInputElement;

  let editorEl: HTMLElement;
  let consoleEl: HTMLElement;
  let el: HTMLElement;
  $: heightStore = syncHeight(el);

  let abortCtlr = new AbortController();

  export let value = "";
  let loading = writable(false);
  let initializing = writable(false);
  let fileUploadMode = false;

  let results: Array<{ type?: string | null; url?: string | null }> = [];
  let error = writable<string | null>(null);

  let resultsDep = writable<Array<{ type?: string | null; url?: string | null }>>([]);

  const samples = new Map([
    ["avi -> mp4", {
      args: ['-c:v', 'libx264'],
      inFilename: 'video.avi',
      outFilename: 'video.mp4',
      mediaType: 'video/mp4',
      forceUseArgs: null,
    }],
    ["avi -> webm", {
      args: ['-c:v', 'libvpx'],
      inFilename: 'video.avi',
      outFilename: 'video.webm',
      mediaType: 'video/webm',
      forceUseArgs: null,
    }],
    ["wav -> mp3", {
      args: ['-c:a', 'libmp3lame'],
      inFilename: 'audio.wav',
      outFilename: 'audio.mp3',
      mediaType: 'audio/mp3',
      forceUseArgs: null,
    }],
    ["mp4 -> gif", {
      args: [],
      inFilename: 'video.mp4',
      outFilename: 'image.gif',
      mediaType: 'image/gif',
      forceUseArgs: null,
    }],
    ["m3u8 -> mp4", {
      // args: ["-c", "copy", "-bsf:a", "aac_adtstoasc"],
      inFilename: 'video.m3u8',
      outFilename: 'video.mp4',
      mediaType: 'video/mp4',
      "forceUseArgs": [
        "-protocol_whitelist",
        "file,http,https,tcp,tls,crypto",
        "-i",
        "video.m3u8",
        "-c",
        "copy",
        "-bsf:a",
        "aac_adtstoasc",
        "video.mp4"
      ]
    }]
  ])
  const samplesArr = Array.from(samples.entries())

  globalThis?.addEventListener?.("popstate", (event) => {
    const url = new URL(globalThis.location.href);
    value = url.searchParams.get("q") ?? "";
    if (url.searchParams.get("config")) {
      try {
        ffmpegOpts = JSON.parse(url.searchParams.get("config") ?? "{}");
      } catch (e) {
        console.warn("Bad JSON for ffmpeg config");
        ffmpegOpts = Object.assign({}, ffmpegDefaultOpts);
      }
    }
  });

  let scrollPos = 0;
  let sticky = true;
  onMount(() => {
    consoleView = new EditorView({
      doc: emptyConsole,
      extensions: [
        basicSetup, 
        StreamLanguage.define(shell),
        oneDark,
        EditorView.editable.of(false),
        EditorView.lineWrapping,
        hyperLink,
        scrollPastEnd(),
        // EditorView.domEventHandlers({
        //   scroll({ target }) {
        //     const dom = consoleView.scrollDOM;
        //     if (dom === (target as HTMLElement)) {
        //       scrollPos = dom.scrollTop;
        //       console.log({
        //         scrollPos,
        //         sticky,
        //         clientHeight: dom.clientHeight
        //       })
        //       if (scrollPos + dom.clientHeight > consoleView.contentHeight - 50) {
        //         sticky = true;
        //       } else {
        //         // sticky = false;
        //       }
        //     }
        //   }
        // }),
        // EditorView.updateListener.of((update: ViewUpdate) => {
        //   if (update.docChanged) {
        //     if (sticky) {
        //       const tr = consoleView.state.update({
        //         effects: [EditorView.scrollIntoView(scrollPos)]
        //       })

        //       consoleView.dispatch(tr)
        //     }
        //     // const value = update.state.doc.toString();
        //     // ffmpegOpts = JSON.parse(value)

        //     // console.log({
        //     //   ffmpegOpts
        //     // })
        //   }
        // }),
      ],
      parent: consoleEl,
      
    })

    ffmpeg = createFFmpeg({ 
      log: true,
      logger(obj) {
        if (consoleView) {
          const doc = consoleView.state.doc;
          let changes: ChangeSpec[] = []

          if (doc.toString().trim() === emptyConsole) {
            changes.push({from: 0, to: doc.length })
          }

          // (Assume view is an EditorView instance holding the document "123".)
          const message = `[${obj.type}] ${obj.message}\n`;
          changes.push({ from: doc.length, insert: message });

          let transaction = consoleView.state.update({ changes })
          // At this point the view still shows the old state.
          consoleView.dispatch(transaction)
          // And now it shows the new state.
        }
      }
    });

    (async () => {
      loading.set(true);
      initializing.set(true);

      await ffmpeg.load();

      loading.set(false);
      initializing.set(false);
    })()
    
    const url = new URL(globalThis.location?.href);
    if (url.searchParams.get("config")?.trim?.()) {
      try {
        ffmpegOpts = JSON.parse(url.searchParams.get("config") ?? "{}");
      } catch (e) {
        console.warn("Bad JSON for ffmpeg config");
        ffmpegOpts = Object.assign({}, ffmpegDefaultOpts);
      }
    }

    editorView = new EditorView({
      doc: JSON.stringify(ffmpegOpts, null, 2),
      extensions: [
        basicSetup, 
        json(),
        oneDark,
        hyperLink,
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            const value = update.state.doc.toString();
            ffmpegOpts = JSON.parse(value)

            console.log({
              ffmpegOpts
            })
          }
        }),
      ],
      parent: editorEl
    })

    if (url.searchParams.get("q")?.trim?.()) {
      value = url.searchParams.get("q") ?? "";
    }
  });

  onMount(() => {
    searchInputEl?.addEventListener?.('change', () => { 
      try {
        new URL(value);
        const newURL = new URL(globalThis.location.href);
        newURL.search = new URLSearchParams({
          q: value,
          config: JSON.stringify(ffmpegOpts)
        }).toString();
        fileUploadMode = false;
        globalThis.history.replaceState(null, "", newURL);
      } catch (e) {}
    })
  })

  function getManifest(arrbuf: ArrayBuffer) {
    const toText = new TextDecoder().decode(arrbuf);
    const parser = new m3u8Parser.Parser()
    parser.push(toText);
    parser.end();
    return parser
  }

  const inc = 10;
  async function parseM3u8Manifests(arrbuf: ArrayBuffer, value: string) {
    const parser = getManifest(arrbuf)

    const { playlists, segments } = parser.manifest as Manifest;
    const lists = [
      ...new Set<string | undefined>(
        (playlists && playlists.length > 0 ? playlists : segments)
          .map((x: { uri?: string }) => x.uri)
      )
    ];

    let i = 0;
    while (i < lists.length) {
      await Promise.all(
        [...lists].splice(i, i + inc).map(async (url) => {
          if (url) {
            const absURL = new URL(url, value).href;
            const buf = await fetchFile(absURL, { signal: abortCtlr.signal, });
            console.log({ absURL })

            ffmpeg.FS('writeFile', url, buf);

            if (/.(m3u8|m3u)$/.test(url)) {
              const parser2 = getManifest(buf);
              const { playlists: playlist2, segments: segments2 } = parser2.manifest as Manifest;

              const subList = diff(
                (playlist2 && playlist2.length > 0 ? playlist2 : segments2)
                  .map((x: { uri?: string }) => x.uri),
                lists
              );
              console.log({ subList, parser2 })
              const len = subList.length;
              for (let j = 0; j < len; j ++) {       
                const subURLs = subList[j]     
                if (subURLs) { 
                  lists.push(subURLs)
                }
              }
            }
          }
        })
      );

      i += inc;
    }
  }

  async function transcode ({ target }: Event & { currentTarget: EventTarget & HTMLInputElement; }) {
    const { files } = target as HTMLInputElement;
    const file = files?.[0];
    error.set(null);
    loading.set(true);

    try {
      if (file) {
        if (ffmpeg && ffmpeg?.isLoaded?.()) {
          abortCtlr = new AbortController();
          ffmpeg.FS('writeFile', ffmpegOpts.inFilename, await fetchFile(file, { signal: abortCtlr.signal, }));
        if (Array.isArray(ffmpegOpts.forceUseArgs)) {
          await ffmpeg.run(...ffmpegOpts.forceUseArgs);
        } else {
          await ffmpeg.run('-i', ffmpegOpts.inFilename, ...ffmpegOpts.args, ffmpegOpts.outFilename);
        }

          const data = ffmpeg.FS('readFile', ffmpegOpts.outFilename);
          const url = URL.createObjectURL(new Blob([data.buffer], { type: ffmpegOpts.mediaType }));
          results.unshift({
            url,
            type: ffmpegOpts.mediaType.startsWith("video") ? "video" : "image"
          });
          resultsDep.set(results);

          try {
            new URL(value);
            const newURL = new URL(globalThis.location.href);
            newURL.search = new URLSearchParams({
              q: value,
              config: JSON.stringify(ffmpegOpts)
            }).toString();
            globalThis.history.pushState(null, "", newURL);
        } catch (e) {}
        }
      }
    } catch (e) {
      error.set((e ?? "").toString());
      console.warn(e);
    }

    loading.set(false);
  }

  async function onSearch(e?: Event, popState = false) {
    abortCtlr = new AbortController();
    error.set(null);
    e?.preventDefault?.();

    if (value.length <= 0) return;
    loading.set(true);

    try {
      if (ffmpeg && ffmpeg?.isLoaded?.()) {
        const arrbuf = await fetchFile(value, { signal: abortCtlr.signal, });

        if (/.(m3u8|m3u)$/.test(value)) {
          try {
            await parseM3u8Manifests(arrbuf, value);
          } catch (e) {
            console.warn(`Cannot parse "${value}" as m3u8 playlist`)
          }
        }

        ffmpeg.FS('writeFile', ffmpegOpts.inFilename, arrbuf);
        if (Array.isArray(ffmpegOpts.forceUseArgs)) {
          await ffmpeg.run(...ffmpegOpts.forceUseArgs);
        } else {
          await ffmpeg.run('-i', ffmpegOpts.inFilename, ...ffmpegOpts.args, ffmpegOpts.outFilename);
        }

        const data = ffmpeg.FS('readFile', ffmpegOpts.outFilename);
        const url = URL.createObjectURL(new Blob([data.buffer], { type: ffmpegOpts.mediaType }));
        results.unshift({
          url,
          type: ffmpegOpts.mediaType.startsWith("video") ? "video" : "image"
        });      
        resultsDep.set(results);
      }

      if (!popState) {
        const newURL = new URL(globalThis.location.href);
        newURL.search = new URLSearchParams({
          q: value,
          config: JSON.stringify(ffmpegOpts)
        }).toString();
        globalThis.history.pushState(null, "", newURL);
      }
    } catch (e) {
      error.set((e ?? "").toString());
      console.warn(e);
    }

    loading.set(false);
  }

  function onUpload({ target }: Event & { currentTarget: EventTarget & HTMLInputElement; }) {
    const { files } = target as HTMLInputElement;
    const file = files?.[0];
    if (file) {
      value = file.name;
      fileUploadMode = true;
    }
  }

  function run() {
    if (fileUploadMode) {
      // @ts-ignore
      transcode({ target: uploadInputEl })
    } else {
      onSearch(undefined);
    }
  }

  export function syncHeight(el: HTMLElement, initial = 0) {
    return writable(initial, (set) => {
      if (!el) {
        return;
      }
      let ro = new ResizeObserver(() => { 
        if (el) { return set(el.offsetHeight); } 
      });
      ro.observe(el);
      return () => ro.disconnect();
    });
  }
</script>

<form on:submit={run} class="flex flex-row gap-2">
  <TextBox
    bind:value
    bind:inputElement={searchInputEl}
    type="search"
    placeholder="Type URL here..."
    searchButton={false}
    clearButton={false}
    class="search-box"
    autofocus={value.length === 0}
  >
    <div slot="buttons" class="flex flex-row gap-1">
      {#if value && value.length > 0}
        <TextBoxButton
          class="search-button clear-button"
          on:click={() => {
            (value = "");
            if (consoleView) {
              let transaction = consoleView.state.update({
                changes: [{ from: 0, to: consoleView.state.doc.length }]
              })

              consoleView.dispatch(transaction)
            }
          }}
          aria-label="Clear Search Button"
        >
          <FluentDismiss24Regular />
        </TextBoxButton>
      {/if}

      <!-- <TextBoxButton
        class="search-button"
        on:click={onSearch}
        aria-label="Search Button"
      >
        <FluentSearch24Regular />
      </TextBoxButton> -->

      {#if $loading && !$initializing }
        <TextBoxButton
          variant="accent"
          class="search-button"
          aria-label="Stop processing"
          title="Stop processing"
          on:click={() => {
            abortCtlr.abort();
            if (ffmpeg && ffmpeg?.isLoaded?.()) { ffmpeg?.exit?.(); ffmpeg?.load?.(); }
          }}
        >
          <FluentRecord24Filled />
        </TextBoxButton>
      {:else}
        <TextBoxButton
          variant="accent"
          class="search-button"
          aria-label="Start processing"
          title="Start processing"
          on:click={run}
        >
          <FluentPlay24Filled />
        </TextBoxButton>
      {/if}
    </div>
  </TextBox>

  <Button
    variant="accent"
    class="file-upload-button"
    aria-label="Upload file"
    title="Upload file"
  >
    {#if uploadInputEl?.files && uploadInputEl?.files?.length > 0 }
      <FluentFolder24Filled />
    {:else}
      <FluentFolder24Regular />
    {/if}
    <input type="file" id="file-upload" 
      on:change={onUpload} 
      bind:this={uploadInputEl} 
    />
  </Button>

  {#if value && value.length > 0}
    <Button
      variant="accent"
      class="search-button"
      href={value}
      aria-label="Open tweet in new-tab"
      title="Open tweet in new-tab"
      target="_blank"
    >
      <FluentOpen24Regular />
    </Button>
  {/if}
</form>

<div class="pt-2 overflow-auto">
  <div class="flex gap-2 xsm:justify-center items-center my-6">
    <span class="text-[color:var(--fds-text-on-accent-primary)] bg-[color:var(--fds-system-attention)] px-3 py-1 rounded-full">Examples:</span>
    {#each samplesArr as sample, i} 
      <Button
        class="break-keep whitespace-nowrap"
        variant={"hyperlink"}
        data-selected={JSON.stringify(sample[1]) === JSON.stringify(ffmpegOpts)}
        on:click={() => {
          const doc = editorView.state.doc;

          // (Assume view is an EditorView instance holding the document "123".)
          let transaction = editorView.state.update({changes: {from: 0, to: doc.length, insert: JSON.stringify(sample[1], null, 2) }})
          console.log(transaction.state.doc.toString()) // "0123"
          // At this point the view still shows the old state.
          editorView.dispatch(transaction)
          // And now it shows the new state.
          // onSearch();
        }}
      >
        {sample[0]}
      </Button>
    {/each}
  </div>
</div>

<div bind:this={editorEl} class="editor" style:background-color={color.background} style:height={"211px"} />
<div bind:this={consoleEl} class="editor" style:background-color={color.background} style:height={"300px"}  />

<section class="pt-7">
  <div class="p-2">
    <TextBlock tag="h2" variant="bodyLarge">Results</TextBlock>
  </div>

  <div class="results">
    <div class="results-child"  style="--height: {$heightStore}px;">
      <div bind:this={el} class="w-full gap-[inherit]">
        {#if typeof $error == "string"}
          <span 
            class="text-yellow-700 dark:text-orange-300" 
            in:blur="{{ delay: 400, amount: 10 }}" 
            out:blur="{{  amount: 10 }}"
          >
            <TextBlock>{$error}</TextBlock>
          </span>
        {:else if $loading || $initializing || results.length <= 0}
          <span 
            class="text-gray-900/60 {$loading || $initializing ? "dark:text-blue-300/90" : "dark:text-gray-300/90"}" 
            in:blur="{{ delay: 400, amount: 10 }}" 
            out:blur="{{  amount: 10 }}"
          >
            <TextBlock variant="body">{$loading || $initializing ? "Loading" : "Empty"}...</TextBlock>
          </span>
        {/if}
        
        <div class="w-full flex flex-col gap-[inherit]">
          {#each $resultsDep as { url, type } (url)}
            {#if url && type && url.length > 0}
              {#if type == "video"}
                <video
                  crossorigin="anonymous"
                  controls
                  preload="auto"
                  class="w-full max-h-[500px] bg-black"
                  in:blur="{{ delay: 400, amount: 10 }}" out:blur="{{ amount: 10 }}" 
                >
                  <source src={url} />
                </video>
              {:else}
                <img src={url} loading="eager" in:blur="{{ delay: 400, amount: 10 }}" out:blur="{{  amount: 10 }}" crossorigin="anonymous" />
              {/if}
            {/if}
          {/each}
        </div>
      </div>
    </div>
  </div>
</section>

<div class="py-7">
  <InfoBar
    title="Fun fact"
    closable={false}
    class="docs-info"
    severity={"attention"}
    id="fun-fact"
  >
    <div class="text-gray-900/80 dark:text-gray-200/80">
      Convert videos and images into gifs, vice-versa, etc...
      <br />
      <br />
      I created this as a side-quest to
      <ol role="list" class="list">
        <li>
          Try using <a
            class="link"
            href="https://ffmpegwasm.netlify.app/#demo"
            rel="noopener">FFmpeg WASM</a
          > (FFmpeg's WASM package feels older than I am, probs due Emscripten 🤷‍♂️)
        </li>
        <li>
          Plus, it seemed pretty neat to be able convert a gif to mp4 and vice-versa without needing to upload it to a server.
        </li>
      </ol>
    </div>
  </InfoBar>
  <br />
  <InfoBar
    title="Note"
    closable={false}
    class="docs-info"
    severity={"success"}
    id="note"
  >
    <div class="text-gray-900/80 dark:text-gray-200/80">
    Thanks <a
            class="link"
            href="https://twitter.com/fbritoferreira"
            rel="noopener">@fbritoferreira</a> for creating <a
            class="link"
            href="https://github.com/fbritoferreira/m3u8-parser/tree/main"
            rel="noopener">fbritoferreira/m3u8-parser</a> it really is a beautiful library
    </div>
  </InfoBar>
</div>

<style lang="scss">
  .file-upload-button {
    position: relative;
  }

  #file-upload {
    width: 100%;
    height: 100%;

    position: absolute;
    left: 0;
    top: 0;
    opacity: 0;
  }

  .editor {
    padding-block: 0.25em;
    margin-block-start: 0.5em;
    border-radius: 0.35em;
    overflow: hidden;

    & :global(.cm-editor) {
      border: none;
      max-height: 300px;
    }
  }

  :global(.search-box input[type="search"].text-box) {
    min-block-size: 40px;
    padding-inline-end: 0.25rem;
    @apply text-ellipsis;
    @apply focus:text-clip;
  }

  :global(button[type="button"].search-button) {
    min-block-size: 40px;
    min-block-size: 32px;
    min-inline-size: 36px;
  }

  :global(button.button.style-hyperlink[data-selected="true"]) {
    background-color: var(--fds-subtle-fill-secondary);
  }

  .list {
    @apply py-1 list-decimal;
    @apply pl-[2ch];
    @apply pt-2;
  }

  .list li {
    font: inherit;
    display: list-item;
    text-align: -webkit-match-parent;
    @apply pl-2;
    @apply pb-0.5;
  }

  .list li::marker {
    @apply text-[color:#745EFF] dark:text-[color:#DE93F1];
  }

  .results {
    background-color: var(--fds-solid-background-quarternary);
    border: 1px solid var(--fds-surface-stroke-flyout);
    border-radius: var(--fds-overlay-corner-radius);
    box-shadow: var(--fds-card-shadow);
    color: var(--fds-text-primary);
    font-family: var(--fds-font-family-text);
    font-size: var(--fds-body-font-size);
    font-weight: 400;
    line-height: 20px;
    padding: 16px;

    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .results-child {
    @apply w-full gap-[inherit] transition-[height] duration-300 ease-[cubic-bezier(0.33,_1,_0.68,_1)];

    --height: 20px;
    overflow: hidden;
    height: var(--height);
  }

  img, video {
    display: block;
    @apply w-full;
  }

  :global(.info-bar.docs-info) {
    @apply rounded-xl;
    --fds-control-corner-radius: theme('borderRadius.lg');
  }

  :global(.info-bar.docs-info#note .info-bar-icon),
  :global(.info-bar.docs-info#fun-fact .info-bar-icon) {
    margin-block-start: 24px;
  }

  :global(.info-bar.docs-info#note .info-bar-content),
  :global(.info-bar.docs-info#fun-fact .info-bar-content) {
    margin-block-end: 23px;
    margin-block-start: 21px;
  }

  :global(.info-bar.docs-info#note .info-bar-content h5),
  :global(.info-bar.docs-info#fun-fact .info-bar-content h5) {
    padding-block-end: 8px;
  }
</style>
