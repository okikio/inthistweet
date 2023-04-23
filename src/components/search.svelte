<script lang="ts">
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

  let el: HTMLElement;
  $: heightStore = syncHeight(el);

  export let value = "";
  let loading = false;

  let results: Array<{ type?: string | null; url?: string | null }> = [];
  let error = writable<string | null>(null);

  globalThis?.addEventListener?.("popstate", (event) => {
    const url = new URL(globalThis.location.href);
    value = url.searchParams.get("q") ?? "";
    onSearch(undefined, true);
  });

  async function onSearch(e?: Event, popState = false) {
    error.set(null);
    e?.preventDefault?.();
    if (value.length <= 0) return;
    loading = true;

    try {
      const result = await (
        await fetch("/api/twitter?url=" + encodeURIComponent(value))
      ).json();

      if ("error" in result) { throw new Error(result.error); }
      results = result;
      console.log(results); 

      if (!popState && !$error) {
        const newURL = new URL(globalThis.location.href);
        newURL.search = "?q=" + value;
        globalThis.history.pushState(null, "", newURL);
      }
    } catch (e) {
      error.set((e ?? "").toString());
      console.warn(e);
    }

    loading = false;
  }

  if (value && value.length > 0) {
    onSearch();
  }

  onMount(() => {
    if (!value || value.length == 0) {
      const url = new URL(globalThis.location?.href);
      value = url.searchParams.get("q") ?? "";
      onSearch();
    }
  });

  const samples = [
    "https://twitter.com/elonmusk/status/1585341984679469056",
    "https://twitter.com/dsaezgil/status/1535647141829324800",
    "https://twitter.com/dubdotsh/status/1595831742195269635",
    // "https://twitter.com/okikio_dev/status/1604321740699697155",
    "https://twitter.com/davidb27111/status/1602670914231050242"
  ]
</script>

<form on:submit={onSearch} class="flex flex-row gap-2">
  <TextBox
    bind:value
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
    {#each samples as sample, i} 
      <Button
        class="break-keep whitespace-nowrap"
        variant={"hyperlink"}
        data-selected={sample == value}
        data-href={sample}
        on:click={() => {
          value = sample;
          onSearch();
        }}
      >
        Sample {i + 1}
      </Button>
    {/each}
  </div>
</div>

<section class="pt-7">
  <div class="p-2">
    <TextBlock tag="h2" variant="bodyLarge">Results</TextBlock>
  </div>

  <div class="results">
    <div class="results-child"  style="--height: {$heightStore}px;">
      <div bind:this={el} class="w-full gap-[inherit]">
        {#if !(results.length > 0) || $error !== null}
          {#if typeof $error == "string"}
            <span 
              class="text-yellow-700 dark:text-orange-300" 
              in:blur="{{ delay: 400, amount: 10 }}" 
              out:blur="{{  amount: 10 }}"
            >
              <TextBlock>{$error}</TextBlock>
            </span>
          {:else}
            <span 
              class="text-gray-900/60 {loading ? "dark:text-blue-300/90" : "dark:text-gray-300/90"}" 
              in:blur="{{ delay: 400, amount: 10 }}" 
              out:blur="{{  amount: 10 }}"
            >
              <TextBlock variant="body">{loading ? "Loading" : "Empty"}...</TextBlock>
            </span>
          {/if}
        {:else}
          <div class="w-full flex flex-col gap-[inherit]">
            {#each results as { url, type } (url)}
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
        {/if}
      </div>
    </div>
  </div>
</section>

<div class="py-7">
  <InfoBar
    title="Note"
    closable={false}
    class="docs-info select-auto"
    severity={"success"}
    id="note"
  >
    <div class="text-gray-900/80 dark:text-gray-200/80">
      You can store the videos, images, and gifs, share them and/or,
      create a meme from the them, the world is your oyester. 
    </div>
  </InfoBar>
  <br />
  <InfoBar
    title="Fun fact"
    closable={false}
    class="docs-info select-auto"
    severity={"attention"}
    id="fun-fact"
  >
    <div class="text-gray-900/80 dark:text-gray-200/80">
      Download videos and images for gifs, gallary tweets, quote tweets, normal video and image 
      posts and even the preview images for links, it can handle it
      all.
      <br />
      <br />
      I created this as a side-quest to
      <ol role="list" class="list">
        <li>
          Try using <a
            class="link"
            href="https://fluent-svelte.vercel.app/"
            rel="noopener">fluent-svelte</a
          > (Fluent UI is pretty cool)
        </li>
        <li>
          Use <a class="link" href="https://astro.build" rel="noopener">Astro</a
          > to create a tool people may like to use
        </li>
        <li>
          I found the other twitter video and image downloaders kinda sus, thus, an open-source tool for downloading twitter videos and images (la pièce de résistance).
        </li>
      </ol>
    </div>
  </InfoBar>
</div>

<style lang="scss">
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
