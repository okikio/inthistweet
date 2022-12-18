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

  onMount(() => {
    const url = new URL(globalThis.location.href);
    value = url.searchParams.get("q") ?? "";
    onSearch();
  });

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
      results = result;
      console.log(results);

      if (!popState) {
        const newURL = new URL(globalThis.location.href);
        newURL.search = "?q=" + value;
        globalThis.history.pushState(null, "", newURL);
      }
    } catch (e) {
      console.error(e);
      error.set((e ?? "").toString());
    }

    loading = false;
  }
</script>

<form on:submit={onSearch} class="flex flex-row gap-2">
  <TextBox
    bind:value
    type="search"
    placeholder="Type URL here..."
    searchButton={false}
    clearButton={false}
    class="search-box"
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

<div class="py-6 text-center">
  <Button
    variant="hyperlink"
    on:click={() => {
      value = "https://twitter.com/elonmusk/status/1585341984679469056";
      onSearch();
    }}
  >
    Sample 1
  </Button>
  <Button
    variant="hyperlink"
    on:click={() => {
      value =
        "https://twitter.com/d__raptis/status/1602303242813186051?s=20&t=ctkPSBYauoo4tkxoHtEP_Q";
      onSearch();
    }}
  >
    Sample 2
  </Button>
  <Button
    variant="hyperlink"
    on:click={() => {
      value =
        "https://twitter.com/MKBHD/status/1600227210031468572?s=20&t=ctkPSBYauoo4tkxoHtEP_Q";
      onSearch();
    }}
  >
    Sample 3
  </Button>
  <Button
    variant="hyperlink"
    on:click={() => {
      value =
        "https://twitter.com/artalar_dev/status/1602270191248969731?s=20&t=8x2nQwnRczCok7d_QI_DXA";
      onSearch();
    }}
  >
    Sample 4
  </Button>
</div>

<section class="pt-7">
  <div class="p-2">
    <TextBlock tag="h2" variant="bodyLarge">Results</TextBlock>
  </div>

  <div class="results">
    <div style="overflow: hidden; height: {$heightSpring}px" class="w-full">
      <div bind:this={el} class="w-full" >
        {#if !(results.length > 0) && $error == null}
          <span class="text-gray-900/60 dark:text-{loading ? "blue" : "gray"}-300/90" transition:blur="{{amount: 10}}">
            <TextBlock variant="body">{loading ? "Loading" : "Empty"}..."</TextBlock>
          </span>
        {:else}
          <div class="w-full">
            {#each results as { url, type } (url)}
              {#if typeof $error == "string"}
                <span class="text-yellow-700 dark:text-orange-300" in:blur="{{ delay: 400, amount: 10 }}" out:blur="{{  amount: 10 }}" >
                  <TextBlock>{$error}</TextBlock>
                </span>
              {:else if url && type && url.length > 0}
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
    class="rounded-xl"
    severity={"success"}
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
    class="rounded-xl"
    severity={"attention"}
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
</style>
