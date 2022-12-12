<script lang="ts">
  import { TextBlock, TextBox, TextBoxButton } from "fluent-svelte";
  import FluentArrowUpRight24Filled from '~icons/fluent/arrow-up-right-24-filled';
  import FluentSearch24Regular from '~icons/fluent/search-24-regular';
  import { getMediaURL } from "../utils";

  import Logo from "~icons/local/logo";

  let value = '';

  let type: string | null | undefined = null;
  let url: string | null | undefined = null;
  let error: string | null = null;

  async function onSearch (e: Event) {
    e.preventDefault();
    error = null;
    try {
      const result = await getMediaURL(value);
      url = result.url;
      type = result.type;
    } catch (e) {
      error = (e ?? '').toString();
      console.error(e);
    }
  }
</script>

<div class="pb-14 text-center">
  <TextBlock variant="display">
    Twitter Media
  </TextBlock>

  <div class="text-gray-900/60 dark:text-gray-200/80">
    <TextBlock variant="body">
      Enter a Tweet URL to download the video/image in it.
    </TextBlock>
  </div>
</div>

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

<div class="pt-14">
  <div class="p-2">
  <TextBlock variant="bodyLarge">
    Results
  </TextBlock>
</div>
  <div class="results">

    {#if !(url && type && url.length > 0)}
      <TextBlock variant="body">Empty...</TextBlock>
    {:else if typeof error == "string"}
      <TextBlock>
        {error}
      </TextBlock>
    {:else if url && type && url.length > 0}
      {#if type == "video"}
        <video controls class="w-full max-h-[500px] bg-black">
          <source src={url} />
        </video>
      {:else if type === "image"}
        <img src={url} />
      {/if}
    {/if}
  </div>
</div>

<div class="copyright">
  <TextBlock variant="body">
    © {new Date().getFullYear()} 
    <a class="copyright-link" href="https://okikio.dev" target="_blank" rel="noopener">
      <Logo /> Okiki Ojo 
    </a>
  </TextBlock>
</div>

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
    min-inline-size: 320px;
    padding: 16px;
  }

  .copyright {
    text-align: center;
  }

  .copyright-link {
    color: var(--fds-accent-default);
    display: inline-flex;
    align-items: center;
    @apply gap-1;
  }

  .copyright-link .icon {
    opacity: 0.3;
  }
</style>

