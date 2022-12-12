<script lang="ts">
  import { writable } from "svelte/store";

  import { Button, TextBlock, TextBox, TextBoxButton } from "fluent-svelte";
  import FluentSearch24Regular from "~icons/fluent/search-24-regular";
  import { onMount } from "svelte";

  let value = "";
  let loading = false;

  let results: Array<{ type?: string | null, url?: string | null }> = [];
  let error = writable<string | null>(null);

  onMount(() => {
    const url = new URL(globalThis.location.href);
    value = url.searchParams.get('q') ?? "";
    onSearch();
  })

  async function onSearch(e?: Event) {
    error.set(null);
    e?.preventDefault?.();
    if (value.length <= 0) return;
    loading = true;

    try {
      const result = await (await fetch("/api/twitter?url=" + encodeURIComponent(value))).json();
      results = result;
      console.log(results)

      const newURL = new URL(globalThis.location.href);
      newURL.search = "?q=" + value;
      globalThis.history.pushState(null, "", newURL)
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
  >
    <TextBoxButton slot="buttons" on:click={onSearch}>
      <FluentSearch24Regular />
    </TextBoxButton>
  </TextBox>
</form>

<div class="py-2 text-center">
  <Button variant="hyperlink" on:click={() => {
    value = "https://twitter.com/elonmusk/status/1585341984679469056";
    onSearch();
  }}>Sample</Button>
</div>

<section class="pt-14">
  <div class="p-2">
    <TextBlock variant="bodyLarge">Results</TextBlock>
  </div>
  
  <div class="results">
    {#if loading}
      <span class="text-blue-900/60 dark:text-blue-300/60">
        <TextBlock variant="body">Loading...</TextBlock>
      </span>
    {:else}
      {#each results as { url, type }}
        {#if !(url && type && url.length > 0) && $error == null}
          <span class="text-gray-900/60 dark:text-gray-300/60">
            <TextBlock variant="body">Empty...</TextBlock>
          </span>
        {:else if typeof $error == "string"}
          <span class="text-yellow-700 dark:text-orange-300">
            <TextBlock>{$error} </TextBlock>
          </span>
        {:else if url && type && url.length > 0}
          {#if type == "video"}
            <video controls class="w-full max-h-[500px] bg-black">
              <source src={url} />
            </video>
          {:else}
            <img src={url} />
          {/if}
        {/if}
      {/each}
    {/if}
  </div>
</section>

<style>
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
  }
</style>
