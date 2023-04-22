<script lang="ts">
  import type { ViewUpdate } from "@codemirror/view";
  import type { FFmpeg } from "@ffmpeg/ffmpeg";

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

  


  // declare global {
  // import { createFFmpeg as ffmpegCreate, fetchFile as fileFetch } from "@ffmpeg/ffmpeg";
  //   var FFmpeg = { fetchFile: fileFetch, createFFmpeg: ffmpegCreate }
  // }

  // @ts-ignore
  const { createFFmpeg, fetchFile } = self?.FFmpeg as unknown as { fetchFile: typeof fileFetch, createFFmpeg: typeof ffmpegCreate };

  import { oneDark, color } from "@codemirror/theme-one-dark";
  import { json } from "@codemirror/lang-json";

  import { EditorView } from "@codemirror/view";
  import { basicSetup } from "codemirror";

  import { onMount } from "svelte";

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

  let ffmpegOpts = Object.assign({}, ffmpegDefaultOpts);
  let ffmpeg: FFmpeg; 

  let editorView: EditorView;
  let searchInputEl: HTMLInputElement;
  let uploadInputEl: HTMLInputElement;

  let editorEl: HTMLElement;
  let el: HTMLElement;
  $: heightStore = syncHeight(el);

  export let value = "";
  let loading = false;

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

  async function parseM3u8Manifests(arrbuf: ArrayBuffer, value: string, count = 0) {
    const toText = new TextDecoder().decode(arrbuf);
    const parser = new m3u8Parser.Parser()
    parser.push(toText);
    parser.end();
    console.log({ "m3u8 Playlist": toText, parser, manifest: parser.manifest })

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

    const { playlists, segments } = parser.manifest as Manifest;
    await Promise.all(
      [...new Set<string | undefined>(
        (playlists && playlists.length > 0 ? playlists : segments)
          .map((x: { uri?: string }) => x.uri)
      )].map(async (url) => {
        if (url) {
          const absURL = new URL(url, value).href;
          const buf = await fetchFile(absURL);
          console.log(absURL)

          ffmpeg.FS('writeFile', url, buf);

          if (count <= 5 && (url.endsWith(".m3u8" || url.endsWith("m3u")))) {
            await parseM3u8Manifests(buf, value, count + 1)
          }
        }
      })
    );
  }

  async function onSearch(e?: Event, popState = false) {
    error.set(null);
    e?.preventDefault?.();

    if (e && value.length <= 0) {
      const { files } = e?.target as HTMLInputElement;
      if (files) transcode(e as Event & { currentTarget: EventTarget & HTMLInputElement; })
    }

    if (value.length <= 0) return;
    loading = true;

    try {
      if (ffmpeg && ffmpeg?.isLoaded?.()) {
        const arrbuf = await fetchFile(value);

        try {
          await parseM3u8Manifests(arrbuf, value);
        } catch (e) {
          console.warn(`Cannot parse "${value}" as m3u8 playlist`)
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

    loading = false;
  }

  onMount(() => {
    ffmpeg = createFFmpeg({ log: true });
    (async () => {
      loading = true;
      await ffmpeg.load();
      loading = false;
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

    if (url.searchParams.get("q")?.trim?.()) {
      value = url.searchParams.get("q") ?? "";
    }

    editorView = new EditorView({
      doc: JSON.stringify(ffmpegOpts, null, 2),
      extensions: [
        basicSetup, 
        json(),
        oneDark,
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
  });

  async function transcode ({ target }: Event & { currentTarget: EventTarget & HTMLInputElement; }) {
    const { files } = target as HTMLInputElement;
    const file = files?.[0];
    error.set(null);
    loading = true;

    try {
      if (file) {
        if (ffmpeg && ffmpeg?.isLoaded?.()) {
          ffmpeg.FS('writeFile', ffmpegOpts.inFilename, await fetchFile(file));
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

          const newURL = new URL(globalThis.location.href);
          newURL.search = new URLSearchParams({
            q: value,
            config: JSON.stringify(ffmpegOpts)
          }).toString();
          globalThis.history.pushState(null, "", newURL);
        }
      }
    } catch (e) {
      error.set((e ?? "").toString());
      console.warn(e);
    }

    loading = false;
  }

  onMount(() => {
    searchInputEl?.addEventListener?.('change', () => { 
      const newURL = new URL(globalThis.location.href);
      newURL.search = new URLSearchParams({
        q: value,
        config: JSON.stringify(ffmpegOpts)
      }).toString();
      globalThis.history.replaceState(null, "", newURL);
    })
  })
</script>

<form on:submit={onSearch} class="flex flex-row gap-2">
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
          on:click={() => (value = "")}
          aria-label="Clear Search Button"
        >
          <FluentDismiss24Regular />
        </TextBoxButton>
      {/if}

      <TextBoxButton
        class="search-button"
        on:click={onSearch}
        aria-label="Search Button"
      >
        <FluentSearch24Regular />
      </TextBoxButton>
    </div>
  </TextBox>

  <Button
    variant="accent"
    class="file-upload-button"
    aria-label="Upload file"
    title="Upload file"
  >
    {#if uploadInputEl?.value }
      <FluentFolder24Filled />
    {:else}
      <FluentFolder24Regular />
    {/if}
    <input type="file" id="file-upload" on:change={transcode} bind:this={uploadInputEl} />
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
          // value = sample;
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

<div bind:this={editorEl} class="editor" style:background-color={color.background} />

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
        {:else if loading || results.length <= 0}
          <span 
            class="text-gray-900/60 {loading ? "dark:text-blue-300/90" : "dark:text-gray-300/90"}" 
            in:blur="{{ delay: 400, amount: 10 }}" 
            out:blur="{{  amount: 10 }}"
          >
            <TextBlock variant="body">{loading  ? "Loading" : "Empty"}...</TextBlock>
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
