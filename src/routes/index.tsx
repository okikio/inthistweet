import type { DocumentHead } from "@builder.io/qwik-city";
import { component$ } from "@builder.io/qwik";

import Logo from "~icons/local/logo";
import ProductHuntLogo from "~icons/local/product-hunt-logo";
import FileIconsFfmpeg from "~icons/file-icons/ffmpeg";

import MdiGithub from "~icons/mdi/github";
import MdiTwitter from "~icons/mdi/twitter";

// const _url = url?.searchParams?.get?.('url') ?? url?.searchParams?.get?.('q') ?? '';
export default component$(() => {
  return (
    <>
      <section class="social-media">
        <menu class="flex justify-center gap-1 sm:gap-4">
          <a href="/" rel="noopener" aria-label="Go home">
            <span class="flex flex-row items-center gap-2">
              <Logo class="logo" />
              <span class="lt-sm:hidden font-[family:Inter]">
                In this tweet
              </span>
            </span>
          </a>

          <div class="flex-grow" />

          <a
            class="flex gap-2"
            href="https://github.com/okikio/inthistweet"
            rel="noopener"
          >
            <MdiGithub /> GitHub
          </a>

          <a
            class="flex gap-2"
            href="https://twitter.com/@inthistweet_dev"
            rel="noopener"
          >
            <MdiTwitter /> Twitter
          </a>
        </menu>
      </section>

      <header class="py-4 pt-8 text-center sm:py-8 md:pt-14">
        <div class="title">
          <p class="text-sm">
            <span
              class="title-display inline-flex items-center gap-6"
              id="title-display"
            >
              In this tweet
              <Logo class="logo" />
            </span>
          </p>
        </div>

        <div class="mx-auto max-w-[48ch] text-gray-900/60 lg:max-w-[60ch] xl:max-w-[75ch] dark:text-gray-200/80">
          <p class="text-sm">
            <span class="leading-7">
              Enter a Tweet URL, click search, and download the videos, gifs and
              images.
            </span>
          </p>
        </div>
      </header>

      <main>
        <Search value={_url} client:load />
      </main>

      <div>
        <a
          href="https://www.producthunt.com/posts/in-this-tweet?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-in&#0045;this&#0045;tweet"
          target="_blank"
          rel="noopener"
        >
          <img
            src="/product-hunt-badge-light.svg"
            alt="Upvote on ProductHunt"
            width="150"
            height="32"
            class="mx-auto block text-center dark:hidden"
            loading="lazy"
          />
          <img
            src="/product-hunt-badge-dark.svg"
            alt="Upvote on ProductHunt"
            width="150"
            height="32"
            class="mx-auto hidden text-center dark:block"
            loading="lazy"
          />
        </a>
      </div>

      <footer class="copyright py-4 sm:py-8">
        <div class="flex flex-row flex-wrap justify-center gap-x-8 gap-y-4">
          <div class="inline-flex gap-1">
            <span> © {new Date().getFullYear()} </span>
            <a class="copyright-link" href="https://okikio.dev" rel="noopener">
              Okiki Ojo
            </a>
          </div>

          <div>
            <span>Inspired by </span>
            <a
              class="credit-link"
              href="https://github.com/egoist/download-twitter-video"
              rel="noopener"
            >
              egoist
            </a>
          </div>
        </div>
      </footer>
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
