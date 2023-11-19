<script lang="ts">
  import type { ViewUpdate } from "@codemirror/view";
  import type { ChangeSpec } from "@codemirror/state";
  import type { FFmpeg } from "@ffmpeg.wasm/main";

  import { traverseM3U8Manifests } from "../lib/m3u8/traverse";

  import { writable } from "svelte/store";
	import { blur } from 'svelte/transition';

  import {
    InfoBar,
    Button,
    TextBlock,
    TextBox,
    TextBoxButton,
    Expander,
  } from "fluent-svelte";

  import FluentDismiss24Regular from "~icons/fluent/dismiss-24-regular";
  import FluentSearch24Regular from "~icons/fluent/search-24-regular";
  import FluentOpen24Regular from "~icons/fluent/open-24-regular";
  import FluentFolder24Regular from "~icons/fluent/folder-24-regular";
  import FluentFolder24Filled from "~icons/fluent/folder-24-filled";
  import FluentRecord24Filled from "~icons/fluent/record-stop-24-filled";
  import FluentPlay24Filled from '~icons/fluent/play-24-filled';

  import { createFFmpeg, fetchFile, diff, shell, debounce } from "./ffmpeg";
  import { extname } from "../lib/path/mod"

  import { hyperLink } from '@uiw/codemirror-extensions-hyper-link';
  import { oneDark, color } from "@codemirror/theme-one-dark";
  import { indentWithTab } from "@codemirror/commands";
  import { json } from "@codemirror/lang-json";

  import { markdown } from "@codemirror/lang-markdown";
  import { StreamLanguage } from "@codemirror/language";

  import { EditorView, scrollPastEnd, keymap } from "@codemirror/view";
  import { basicSetup } from "codemirror";

  import { onMount } from "svelte";

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
  let openInputEl: HTMLInputElement;

  let editorEl: HTMLElement;
  let consoleEl: HTMLElement;
  let el: HTMLElement;
  $: heightStore = syncHeight(el);

  let abortCtlr = new AbortController();

  export let value = "";
  let progress = writable(0);
  let loading = writable(false);
  let initializing = writable(false);
  let fileOpenMode = false;

  let results: Array<{ type?: string | null; url?: string | null }> = [];
  let error = writable<string | null>(null);

  let resultsDep = writable<Array<{ type?: string | null; url?: string | null }>>([]);

  const samples = new Map([
    ["webm -> mp4", {
      args: ['-c:v', 'libvpx'],
      inFilename: 'video.webm',
      outFilename: 'video.mp4',
      mediaType: 'video/mp4',
      forceUseArgs: null,
    }],
    ["avi -> mp4", {
      args: ['-c:v', 'libx264'],
      inFilename: 'video.avi',
      outFilename: 'video.mp4',
      mediaType: 'video/mp4',
      forceUseArgs: null,
    }],
    ["mov -> mp4", {
      args: ["-vcodec", "copy", "-acodec", "copy"],
      inFilename: 'video.mov',
      outFilename: 'video.mp4',
      mediaType: 'video/mp4',
      forceUseArgs: null,
    }],
    ["wmv -> mp4", {
      args: [],
      inFilename: 'video.wmv',
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
    ["mp4 -> wmv", {
      args: [],
      inFilename: 'video.mp4',
      outFilename: 'video.wmv',
      mediaType: 'video/x-ms-wmv',
      forceUseArgs: null,
    }],
    ["gif -> mp4", {
      args: [
        "-movflags",
        "faststart",
        "-pix_fmt",
        "yuv420p",
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2" 
      ],
      inFilename: 'video.gif',
      outFilename: 'image.mp4',
      mediaType: 'video/mp4',
      forceUseArgs: null,
    }],
    ["mp4 -> gif", {
      args: [],
      inFilename: 'video.mp4',
      outFilename: 'image.gif',
      mediaType: 'image/gif',
      forceUseArgs: null,
    }],
    ["mp3 -> mp4", {
      args: ['-c:v', 'libvpx'],
      inFilename: 'audio.mp3',
      outFilename: 'video.mp4',
      mediaType: 'video/mp4',
      forceUseArgs: null,
    }],
    ["wav -> mp3", {
      args: ['-c:a', 'libmp3lame'],
      inFilename: 'audio.wav',
      outFilename: 'audio.mp3',
      mediaType: 'audio/mpeg',
      forceUseArgs: null,
    }],

    
    ["mp4 -> mov", {
      args: ["-vcodec", "copy", "-acodec", "copy"],
      inFilename: 'video.mp4',
      outFilename: 'video.mov',
      mediaType: 'video/quicktime',
      forceUseArgs: null,
    }],
    ["mp4 -> mkv", {
      "args": ["-c:v", "libvpx", "-c:a", "libvorbis"],
      "inFilename": "video.mp4",
      "outFilename": "video.mkv",
      "mediaType": "video/x-matroska",
      forceUseArgs: null,
    }],
    ["mp4 -> ogg", {
      "args": ["-c:a", "libvorbis"],
      "inFilename": "video.mp4",
      "outFilename": "audio.ogg",
      "mediaType": "audio/ogg",
      forceUseArgs: null,
    }],
    ["webm -> mkv", {
      "args": ["-c:v", "copy", "-c:a", "flac"],
      "inFilename": "video.webm",
      "outFilename": "video.mkv",
      "mediaType": "video/x-matroska",
      forceUseArgs: null,
    }],
    ["mp3 -> ogg", {
      "args": ["-c:a", "libvorbis"],
      "inFilename": "audio.mp3",
      "outFilename": "audio.ogg",
      "mediaType": "audio/ogg",
      forceUseArgs: null,
    }],
    ["mp3 -> wav", {
      args: ['-c:a', 'libmp3lame'],
      inFilename: 'audio.mp3',
      outFilename: 'audio.wav',
      mediaType: 'video/x-ms-wmv',
      forceUseArgs: null,
    }],
    ["mp4 -> mp3", {
      args: ['-c:a', 'libmp3lame'],
      inFilename: 'video.mp4',
      outFilename: 'audio.mp3',
      mediaType: 'audio/mpeg',
      forceUseArgs: null,
    }],
    ["webm -> gif", {
      args: [
        "-crf", 
        "20",
        "-movflags",
        "faststart",
      ],
      inFilename: 'video.webm',
      outFilename: 'image.gif',
      mediaType: 'image/gif',
      forceUseArgs: null,
    }],
    ["gif -> webm", {
      args: [
        "-c:v",
        "vp8",
        "-quality",
        "good",
        "-movflags",
        "faststart",
        "-pix_fmt",
        "yuv420p",
        "-crf",
        "30"
      ],
      inFilename: 'image.gif',
      outFilename: 'video.webm',
      mediaType: 'video/webm',
      forceUseArgs: null,
    }],
    ["mp4 -> webm", {
      args: "-c:v libvpx".split(" "),
      inFilename: 'video.mp4',
      outFilename: 'video.webm',
      mediaType: 'video/webm',
      forceUseArgs: null,
    }],
    ["mp4 -> avi", {
      args: ["-vcodec", "copy", "-acodec", "copy"],
      inFilename: 'video.mp4',
      outFilename: 'video.avi',
      mediaType: 'video/x-msvideo',
      forceUseArgs: null,
    }],
    ["webm -> avi", {
      args: ["-vcodec", "copy", "-acodec", "copy"],
      inFilename: 'video.webm',
      outFilename: 'video.avi',
      mediaType: 'video/x-msvideo',
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
    }],
    ["mp4 -> m3u8", {
      args: "-b:v 1M -g 60 -hls_time 2 -hls_list_size 0 -hls_segment_size 500000".split(" "),
      inFilename: 'video.mp4',
      outFilename: 'video.m3u8',
      mediaType: 'vnd.apple.mpegURL',
    }],
	  ["mp4 -> ts", {
      args: [
        "-c:v",
        "mpeg2video",
        "-qscale:v",
        "2",
        "-c:a",
        "mp2",
        "-b:a",
        "192k"
      ],
		  inFilename: 'video.mp4',
      outFilename: 'video.ts',
      mediaType: 'video/mp2t',

    }]
  ])
  $: samplesArr = Array.from(samples.entries())

  let downloads: string[] = []
  resultsDep.subscribe((arr) => {
    const pathname = new URL(value, "https://inthistweet.app").pathname.slice(1);
    const ext = extname(ffmpegOpts.outFilename);

    const extValue = extname(pathname);
    downloads = arr.map((x) => {
      return pathname ? (pathname + (extValue === ext ? "" : ext)) : ("file-to-download" + ext)
    })
  })


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
        keymap.of([indentWithTab]),
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
      progress({ ratio }) {
        progress.set(ratio)
      },
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

      await ffmpeg?.load?.();

      loading.set(false);
      initializing.set(false); 
    })();
    
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
            try {
              ffmpegOpts = JSON.parse(value)
            } catch (e) {
              console.warn(e)
            }

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

    searchInputEl?.addEventListener?.('change', debounce(() => { 
      try {
        new URL(value);
        const newURL = new URL(globalThis.location.href);
        newURL.search = new URLSearchParams({
          q: value,
          config: JSON.stringify(ffmpegOpts)
        }).toString();
        globalThis.history.replaceState(null, "", newURL);
        fileOpenMode = false;
      } catch (e) {}
    }, 200))
  })

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

          const { mediaType } = ffmpegOpts;
          const data = ffmpeg.FS('readFile', ffmpegOpts.outFilename);
          const url = URL.createObjectURL(new Blob([data.buffer], { type: mediaType }));
          results.unshift({
            url,
            type: /^(video|audio)/.test(mediaType) || mediaType === "vnd.apple.mpegURL" ? "video" : "image"
          });
          resultsDep.set(results);

          ffmpeg.exit();
          ffmpeg.load();

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

        let _url = new URL(value); 
        if (/.(m3u8|m3u)$/.test(_url?.pathname)) {
          try {
            const map = await traverseM3U8Manifests(arrbuf, _url);
            map?.forEach?.((buf, url) => {
              ffmpeg.FS('writeFile', url, new Uint8Array(buf));
            })
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

        const { mediaType } = ffmpegOpts;
        const data = ffmpeg.FS('readFile', ffmpegOpts.outFilename);
        const url = URL.createObjectURL(new Blob([data.buffer], { type: mediaType }));
        results.unshift({
          url,
          type: /^(video|audio)/.test(mediaType) || mediaType === "vnd.apple.mpegURL" ? "video" : "image"
        });      
        resultsDep.set(results);
      }

      ffmpeg.exit();
      ffmpeg.load();

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

  function onFileOpen({ target }: Event & { currentTarget: EventTarget & HTMLInputElement; }) {
    const { files } = target as HTMLInputElement;
    const file = files?.[0];
    if (file) {
      value = file.name;
      fileOpenMode = true;
    }
  }

  function validURL(value: string) {
    try {
      new URL(value);
      return true;
    } catch (e) {}
    return false;
  }

  function run() {
    if (fileOpenMode) {
      // @ts-ignore
      transcode({ target: openInputEl })
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
            if (ffmpeg && ffmpeg?.isLoaded?.()) { 
              ffmpeg?.exit?.(); 

              (async () => {
                loading.set(true);
                initializing.set(true);

                await ffmpeg?.load?.();

                loading.set(false);
                initializing.set(false); 
              })();
            }
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
    class="file-open-button"
    aria-label="Open file"
    title="Open file"
  >
    {#if openInputEl?.files && openInputEl?.files?.length > 0 }
      <FluentFolder24Filled />
    {:else}
      <FluentFolder24Regular />
    {/if}
    <input type="file" id="file-open" 
      on:change={onFileOpen} 
      bind:this={openInputEl} 
    />
  </Button>

  {#if value && value.length > 0 && validURL(value)}
    <Button
      variant="accent"
      class="open-in-new-tab-button"
      href={value}
      aria-label="Open tweet in new-tab"
      title="Open tweet in new-tab"
      target="_blank"
    >
      <FluentOpen24Regular />
    </Button>
  {/if}
</form>

<div class="pt-2 mt-6">
  <span class="text-[color:var(--fds-text-on-accent-primary)] bg-[color:var(--fds-system-attention)] px-3 py-1 rounded-full">Examples</span>
  <div class="flex gap-2 flex-wrap content-center overflow-auto">
    <div class="mt-2 mb-6 flex sm:grid sm:grid-rows-3 sm:grid-cols-5 md:grid-cols-6 gap-x-2 sm:gap-x-4 md:gap-x-6 gap-y-2">
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

            const newURL = new URL(globalThis.location.href);
            newURL.searchParams.set("config", JSON.stringify(ffmpegOpts));
            globalThis.history.replaceState(null, "", newURL);
          }}
        >
          {sample[0]}
        </Button>
      {/each}
    </div>
  </div>
</div>

<div class="pt-2">
  <Expander>
    Advanced
    <svelte:fragment slot="content">
      FFmpeg Config
      <div bind:this={editorEl} class="editor" style:background-color={color.background} style:height={"211px"} />

      Logs
      <div bind:this={consoleEl} class="editor" style:background-color={color.background} style:height={"300px"}  />
    </svelte:fragment>
  </Expander>
</div>

<section class="pt-7">
  <div class="p-2">
    <TextBlock tag="h2" variant="bodyLarge">Results</TextBlock>
  </div>

  <div class="flex gap-2 px-2 pb-2">
    <!-- <div class="sm:flex-1"></div> -->

    <Button 
      variant="accent" 
      class="cursor-pointer w-full" 
      on:click={() => {
        let link = document.createElement("a");
        results.forEach(({ url }, i) => {
          if (url) {
            link.href = url;
            link.target = "_blank";
            link.download = value
            link.click();
          }
        })
        // @ts-ignore
        link = null;
      }}
    >
      Download All
    </Button>
    <Button 
      class="cursor-pointer w-full" 
      on:click={() => {
        results.forEach(({ url }, i) => {
          if (url) URL.revokeObjectURL(url);
        })
        results = [];
        resultsDep.set(results);
      }}
    >
      Clear All
    </Button>
    
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
            <TextBlock variant="body">{$loading || $initializing ? "Loading..." + (!$initializing ? Math.round($progress * 100) + "%" : "") : "Empty..."}</TextBlock>
          </span>
        {/if}
        
        <div class="w-full flex flex-col gap-[inherit]">
          {#each $resultsDep as { url, type }, i (url)}
            {#if url && type && url.length > 0}
              <div class="flex w-full flex-col">
                {#if type == "video" || type == "audio"}
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
                <div class="flex lt-md:flex-col gap-2 pt-2">
                  <Button 
                    class="w-full" 
                    variant="accent" 
                    href={url} 
                    download={downloads[i]}
                  >
                    Download
                  </Button>
                  <Button 
                    class="cursor-pointer w-full" 
                    on:click={() => {
                      if (url) URL.revokeObjectURL(url);
                      results.splice(i, 1);
                      resultsDep.set(results);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
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
    class="docs-info select-auto"
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
          Plus, it seemed pretty neat to be able convert a gif to mp4 and vice-versa without needing to open it to a server.
        </li>
      </ol>
    </div>
  </InfoBar>
  <br />
  <InfoBar
    title="Note"
    closable={false}
    class="docs-info select-auto"
    severity={"success"}
    id="note"
  >
    <div class="text-gray-900/80 dark:text-gray-200/80 select-auto">
      Thanks <a
              class="link"
              href="https://twitter.com/fbritoferreira"
              rel="noopener">@fbritoferreira</a> for creating <a
              class="link"
              href="https://github.com/fbritoferreira/m3u8-parser/tree/main"
              rel="noopener">fbritoferreira/m3u8-parser</a> it really is a beautiful library.
      <br><br>
      The playground uses <a class="link" href="https://github.com/DreamOfIce/ffmpeg.wasm" rel="noopener">@ffmpeg.wasm/main</a>. 
				<a class="link" href="https://ffmpeg.org/" rel="noopener">FFmpeg</a> and
         the corresponding <a class="link" href="https://ffmpegwasm.netlify.app/#demo:~:text=DOCUMENTATION-,External%20Libraries,-ffmpeg.wasm%20is" rel="noopener">media format libraries</a> are licenced under <a class="link" href="https://ffmpeg.org/legal.html" rel="noopener">GPL</a>.

    </div>
  </InfoBar>
</div>

<style lang="scss">
  .file-open-button {
    position: relative;
  }
  .search-button,
  .open-in-new-tab-button,
  .file-open-button,
  :global(.file-open-button input) {
    cursor: pointer;
  }

  #file-open {
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
    @apply select-auto;
    @apply rounded-xl;
    --fds-control-corner-radius: theme('borderRadius.lg');
  }

  :global(.info-bar.docs-info#fun-fact),
  :global(.info-bar.docs-info#note) {
    @apply select-auto;
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
