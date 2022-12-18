<script lang="ts">
  import { spring, tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
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

  const heightSpring = tweened(20, {
		duration: 300,
		easing: cubicOut
  });
  $: heightStore = syncHeight(el);
  $: heightSpring.set($heightStore || 20);

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
    // results = [];

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
    "https://twitter.com/okikio_dev/status/1604321740699697155"
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
    autofocus
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

<div class="py-6 flex flex-wrap gap-2 justify-center">
  {#each samples as sample, i} 
    <Button
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

<section class="pt-7">
  <div class="p-2">
    <TextBlock tag="h2" variant="bodyLarge">Results</TextBlock>
  </div>

  <div class="results">
    <div style="overflow: hidden; height: {$heightSpring}px" class="w-full gap-[inherit]">
      <div bind:this={el} class="w-full gap-[inherit]" >
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
                    controls
                    preload="auto"
                    class="w-full max-h-[500px] bg-black"
                    in:blur="{{ delay: 400, amount: 10 }}" out:blur="{{  amount: 10 }}" 
                  >
                    <source src={url} />
                  </video>
                {:else}
                  <img src={url} loading="eager" in:blur="{{ delay: 400, amount: 10 }}" out:blur="{{  amount: 10 }}" />
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
    class="docs-info"
    severity={"success"}
    id="note"
  >
    <div class="text-gray-900/80 dark:text-gray-200/80">
      You can quickly and easily store the image/video, share them and/or,
      create a meme from the them, the world is your oyester.
    </div>
  </InfoBar>
  <br />
  <InfoBar
    title="Fun fact"
    closable={false}
    class="docs-info"
    severity={"attention"}
    id="fun-fact"
  >
    <div class="text-gray-900/80 dark:text-gray-200/80">
      Download images and videos for gallary tweets, quote tweets, normal image
      and video posts and even the preview images for links, it can handle it
      all.
      <br />
      <br />
      I created this because I wanted to
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
          I wanted an open-source tool for downloading twitter image/video; the
          ones that currently exist are kinda sus.
        </li>
      </ol>
    </div>
  </InfoBar>
</div>

<style>
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

  :global(.info-bar.docs-info) {
    @apply rounded-xl;
    --fds-control-corner-radius: theme('borderRadius.lg');
  }

  :global(.info-bar.docs-info#note .info-bar-content),
  :global(.info-bar.docs-info#fun-fact .info-bar-content) {
    margin-block-end: 15px;
    margin-block-start: 13px;
  }
</style>
