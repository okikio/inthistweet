<script lang="ts">
  import { writable } from "svelte/store";

  import { InfoBar, Button, TextBlock, TextBox, TextBoxButton } from "fluent-svelte";
  import FluentSearch24Regular from "~icons/fluent/search-24-regular";
  import { onMount } from "svelte";

  export let value = "";
  let loading = false;

  let results: Array<{ type?: string | null, url?: string | null }> = [];
  let error = writable<string | null>(null);

  onMount(() => {
    const url = new URL(globalThis.location.href);
    value = url.searchParams.get('q') ?? "";
    onSearch();
  })

  globalThis?.addEventListener?.('popstate', (event) => { 
    const url = new URL(globalThis.location.href);
    value = url.searchParams.get('q') ?? "";
    onSearch(undefined, true);
  });

  async function onSearch(e?: Event, popState = false) {
    error.set(null);
    e?.preventDefault?.();
    if (value.length <= 0) return;
    loading = true;

    try {
      const result = await (await fetch("/api/twitter?url=" + encodeURIComponent(value))).json();
      results = result;
      console.log(results)

      if (!popState) {
        const newURL = new URL(globalThis.location.href);
        newURL.search = "?q=" + value;
        globalThis.history.pushState(null, "", newURL)
      }
    } catch (e) {
      console.error(e);
      error.set((e ?? "").toString());
    }

    loading = false;
  }
</script>

<form on:submit={onSearch}>
  <TextBox
    bind:value
    type="search"
    placeholder="Type URL here..."
    searchButton={false}
    class="search-box"
  >
    <TextBoxButton class="search-button" slot="buttons" on:click={onSearch} aria-label="Search Button">
      <FluentSearch24Regular />
    </TextBoxButton>
  </TextBox>
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
      value = "https://twitter.com/d__raptis/status/1602303242813186051?s=20&t=ctkPSBYauoo4tkxoHtEP_Q";
      onSearch();
    }}
  >
    Sample 2
  </Button>
  <Button 
    variant="hyperlink" 
    on:click={() => {
      value = "https://twitter.com/MKBHD/status/1600227210031468572?s=20&t=ctkPSBYauoo4tkxoHtEP_Q";
      onSearch();
    }}
  >
    Sample 3
  </Button>
  <Button 
    variant="hyperlink" 
    on:click={() => {
      value = "https://twitter.com/artalar_dev/status/1602270191248969731?s=20&t=8x2nQwnRczCok7d_QI_DXA";
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
    {#if loading}
      <span class="text-blue-900/60 dark:text-blue-300/60">
        <TextBlock variant="body">Loading...</TextBlock>
      </span>
    {:else if !(results.length > 0) && $error == null}
      <span class="text-gray-900/60 dark:text-gray-300/90">
        <TextBlock variant="body">Empty...</TextBlock>
      </span>
    {:else}
      {#each results as { url, type } (url)}
        {#if typeof $error == "string"}
          <span class="text-yellow-700 dark:text-orange-300">
            <TextBlock>{$error} </TextBlock>
          </span>
        {:else if url && type && url.length > 0}
          {#if type == "video"}
            <video controls preload="auto" class="w-full max-h-[500px] bg-black">
              <source src={url} />
            </video>
          {:else}
            <img src={url} loading="eager" />
          {/if}
        {/if}
      {/each}
    {/if}
    
  </div>
</section>

<div class="py-7">
  <InfoBar title="Note" closable={false} class="rounded-xl" severity={"attention"}>
    <div class="text-gray-900/80 dark:text-gray-200/80">
        You can quickly and easily store the image/video, share the image/video and/or, create a meme from the image/video.
    </div>
  </InfoBar>
</div>

<style>
  :global(.search-box input[type="search"].text-box) {
    min-block-size: 40px;
  }

  :global(button[type="button"].search-button) {
    min-block-size: 40px;
    min-block-size: 32px;
    min-inline-size: 36px;
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
