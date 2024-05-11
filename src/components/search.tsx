import type { MediaItem } from "~/lib/get-tweet";
import { component$, useSignal, useTask$, $ } from '@builder.io/qwik';

import FluentDismiss24Regular from "~icons/fluent/dismiss-24-regular";
import FluentSearch24Regular from "~icons/fluent/search-24-regular";
import FluentOpen24Regular from "~icons/fluent/open-24-regular";

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

  let results = useSignal<MediaItem[]>([]);
  let error = useSignal<string | null>(null);

  const onSearch = $(async function onSearch(
    e?: PointerEvent,
    popState = false,
  ) {
    error.value = null;
    e?.preventDefault?.();
    if (value.value.length <= 0) return;
    loading.value = true;

    try {
      const result = await (
        await fetch("/api/twitter?url=" + encodeURIComponent(value.value))
      ).json();

      if ("error" in result) {
        throw new Error(result.error);
      }
      results.value = result;
      console.log(results);

      if (!popState && !error.value) {
        const newURL = new URL(globalThis.location.href);
        newURL.search = "?q=" + value.value;
        globalThis.history.pushState(null, "", newURL);
      }
    } catch (e) {
      error.value = (e ?? "").toString();
      console.warn(e);
    }

    loading.value = false;
  });

  // if (
  //   value.value &&
  //   value.value.length > 0 &&
  //   globalThis?.document &&
  //   results.value.length <= 0
  // ) {
  //   onSearch();
  // }

  console.log({
    results,
  });

  // useTask$(() => {
  //   globalThis?.addEventListener?.("popstate", (event) => {
  //     const url = new URL(globalThis.location.href);
  //     value.value = url.searchParams.get("q") ?? "";
  //     onSearch(undefined, true);
  //   });

  //   if (!value.value || (value.value.length == 0 && results.value.length <= 0)) {
  //     const url = new URL(globalThis.location?.href);
  //     value.value = url.searchParams.get("q") ?? "";
  //     onSearch();
  //   }
  // });

  // {/*  onSubmit$={onSearch} */}
  return (
    <>
      <form class="flex flex-row gap-2">
        <div class="search-box">
          <input
            bind:value={value}
            type="search"
            placeholder="Type URL here..."
            // searchButton={false}
            // clearButton={false}
            class="search-box"
            autofocus={value.value.length === 0}
          />
          <div class="flex flex-row gap-1">
            {value.value && value.value.length > 0 && (
              <button
                class="search-button clear-button"
                onClick$={() => (value.value = "")}
                aria-label="Clear Search Button"
              >
                <FluentDismiss24Regular />
              </button>
            )}

            <button
              type="button"
              class="search-button"
              // @ts-ignore
              onClick$={(e) => {
                console.log("Coool")
                onSearch(e)
              }}
              aria-label="Search Button"
            >
              <FluentSearch24Regular />
            </button>
          </div>
        </div>

        {value.value && value.value.length > 0 && (
          <a
            // variant="accent"
            class="search-button"
            href={value.value}
            aria-label="Open tweet in new-tab"
            title="Open tweet in new-tab"
            target="_blank"
          >
            <FluentOpen24Regular />
          </a>
        )}
      </form>

      <div class="overflow-auto pt-2">
        <div class="xsm:justify-center my-6 flex items-center gap-2">
          <span class="rounded-full bg-[color:var(--fds-system-attention)] px-3 py-1 text-[color:var(--fds-text-on-accent-primary)]">
            Examples:
          </span>
          {samples.map((sample, i) => {
            return (
              <button
                key={sample}
                class="whitespace-nowrap break-keep"
                // variant={"hyperlink"}
                data-selected={sample == value.value}
                data-href={sample}
                onClick$={() => {
                  value.value = sample;
                  // onSearch();
                }}
              >
                Sample {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <section class="pt-7">
        <div class="p-2">
          {/* <TextBlock tag="h2" variant="bodyLarge">
            Results
          </TextBlock> */}
          <h2>Results</h2>
        </div>

        <div class="results">
          <div class="results-child" style="--height: {$heightStore}px;">
            {/* bind:this={el}  */}
            <div class="w-full gap-[inherit]">
              {!(results.value.length > 0) || error.value !== null ? (
                typeof error.value == "string" ? (
                  <span class="text-yellow-700 dark:text-orange-300">
                    <p>{error.value}</p>
                  </span>
                ) : (
                  <span
                    class={`text-gray-900/60 ${loading.value ? "dark:text-blue-300/90" : "dark:text-gray-300/90"}`}
                  >
                    {/*  variant="body" */}
                    <p>{loading ? "Loading" : "Empty"}...</p>
                  </span>
                )
              ) : (
                <div class="flex w-full flex-col gap-[inherit]">
                  {results.value.map(({ type, variants }) => {
                    let variant = variants[0];
                    if (variant.url && type && variant.url.length > 0) {
                      return (type == "video" || /video/.test(variant.mimeType)) ? (
                        <video
                          key={variant.url}
                          crossOrigin="anonymous"
                          controls
                          preload="auto"
                          class="w-full bg-black object-cover"
                          style={
                            variant.aspectRatio
                              ? `aspect-ratio: ${variant.aspectRatio.replace(":", "/")}`
                              : ""
                          }
                          // in:blur="{{ delay: 400, amount: 10 }}"
                          // out:blur="{{ amount: 10 }}"
                        >
                          <source src={variant.url} />
                        </video>
                      ) : (
                        <img
                          key={variant.url}
                          src={variant.url}
                          loading="eager"
                          class="w-full object-cover"
                          // in:blur="{{ delay: 400, amount: 10 }}"
                          // out:blur="{{  amount: 10 }}"
                          style={
                            variant.aspectRatio
                              ? `aspect-ratio: ${variant.aspectRatio.replace(":", "/")}`
                              : ""
                          }
                          crossOrigin="anonymous"
                        />
                      );
                    }
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
});
