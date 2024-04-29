import type { MediaItem } from "~/lib/get-tweet";
import { component$, useSignal, useTask$, $ } from '@builder.io/qwik';

export const samples = [
  "https://twitter.com/elonmusk/status/1585341984679469056",
  "https://twitter.com/dsaezgil/status/1535647141829324800",
  "https://twitter.com/dubdotsh/status/1595831742195269635",
  // "https://twitter.com/okikio_dev/status/1604321740699697155",
  "https://twitter.com/davidb27111/status/1602670914231050242",
];

export default component$(() => {
  let value = useSignal("");
  let loading = useSignal(false);

  // const count = useSignal(0);
  // const increment = $(() => count.value++);

  let results = useSignal<MediaItem[]>([]);

  async function onSearch(e?: Event, popState = false) {
    error.set(null);
    e?.preventDefault?.();
    if (value.length <= 0) return;
    loading = true;

    try {
      const result = await (
        await fetch("/api/twitter?url=" + encodeURIComponent(value))
      ).json();

      if ("error" in result) {
        throw new Error(result.error);
      }
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

  if (
    value.value &&
    value.value.length > 0 &&
    globalThis?.document &&
    results.value.length <= 0
  ) {
    onSearch();
  }

  console.log({
    results,
  });

  
  useTask$(() => {
    globalThis?.addEventListener?.("popstate", (event) => {
      const url = new URL(globalThis.location.href);
      value.value = url.searchParams.get("q") ?? "";
      onSearch(undefined, true);
    });

    if (!value.value || (value.value.length == 0 && results.value.length <= 0)) {
      const url = new URL(globalThis.location?.href);
      value.value = url.searchParams.get("q") ?? "";
      onSearch();
    }
  });

  return (
    <>

<form onSubmit={onSearch} class="flex flex-row gap-2">
  <TextBox
    bind:value
    type="search"
    placeholder="Type URL here..."
    searchButton={false}
    clearButton={false}
    class="search-box"
    autofocus={value.value.length === 0}
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
    <button
      variant="accent"
      class="search-button"
      href={value}
      aria-label="Open tweet in new-tab"
      title="Open tweet in new-tab"
      target="_blank"
    >
      <FluentOpen24Regular />
    </button>
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
            {#each results as { type, variants } (JSON.stringify(variants ?? "[]"))}
              {@const variant = variants[0]}
              {#if variant.url && type && variant.url.length > 0}
                {#if type == "video" || /video/.test(variant.mimeType)}
                  <video
                    crossorigin="anonymous"
                    controls
                    preload="auto"
                    class="w-full bg-black object-cover"
                    style={variant.aspectRatio ? `aspect-ratio: ${variant.aspectRatio.replace(":", "/")}` : ""}
                    in:blur="{{ delay: 400, amount: 10 }}" out:blur="{{ amount: 10 }}" 
                  >
                    <source src={variant.url} />
                  </video>
                {:else}
                  <img 
                    src={variant.url} 
                    loading="eager" 
                    class="w-full object-cover"
                    in:blur="{{ delay: 400, amount: 10 }}" out:blur="{{  amount: 10 }}" 
                    style={variant.aspectRatio ? `aspect-ratio: ${variant.aspectRatio.replace(":", "/")}` : ""}
                    crossorigin="anonymous" 
                  />
                {/if}
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>
    </>
  );
});
