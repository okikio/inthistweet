import { component$ } from "@builder.io/qwik";
import {
  QwikCityProvider,
  RouterOutlet,
  ServiceWorkerRegister,
} from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "@fontsource-variable/inter-tight/index.css";
import "@fontsource-variable/inter/index.css";
import "./global.css";

const SITE = "https://inthistweet.app";

export default component$(() => {
  /**
   * The root of a QwikCity site always start with the <QwikCityProvider> component,
   * immediately followed by the document's <head> and <body>.
   *
   * Don't remove the `<head>` and `<body>` elements.
   */

  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <meta name="generator" content={"Qwik"} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title>Title</title>

        <link rel="manifest" href="/manifest.json" />
        <meta name="robots" content="index, follow" />

        <link
          rel="search"
          href={SITE + "/open-search.xml"}
          type="application/opensearchdescription+xml"
          title="inthistweet: Twitter URL..."
        />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />

        <meta
          name="theme-color"
          content="#e8f0f6"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#1d2026"
          media="(prefers-color-scheme: dark)"
        />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />

        <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          // @ts-ignore
          color="#745eff"
        />

        <meta name="msapplication-TileColor" content="#232323" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />

        {/* <meta name="title" property="og:title" content={title} />
        <meta name="twitter:title" itemprop="name" content={title} />
        <meta name="apple-mobile-web-app-title" content={title} />

        <meta
          name="description"
          property="og:description"
          content={description}
        />
        <meta
          property="twitter:description"
          itemprop="description"
          content={description}
        /> */}

        <meta
          name="keywords"
          content="twitter media,twitter image/video downloader,tweet video download,tweet image download"
        />

        <meta name="og:locale" content="en_Us" />
        <meta property="og:type" content="website" />

        <meta name="web-author" content="Okiki Ojo" />
        <meta property="article:author" content="Okiki Ojo" />
        <meta name="contact" content="hey@okikio.dev" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:image:alt" content="In this tweet's logo" />

        <meta name="twitter:site" content="@inthistweet_dev" />
        <meta name="twitter:creator" content="@okikio_dev" />

        <meta property="image" content={SITE + "/favicon/social-preview.png"} />
        <meta
          property="og:image"
          content={SITE + "/favicon/social-preview.png"}
        />
        <meta
          name="twitter:image"
          content={SITE + "/favicon/social-preview.png"}
        />

        <meta name="twitter:url" property="og:site_name" content={SITE} />

        <link rel="canonical" href={SITE} />
        {/* @ts-ignore */}
        <meta itemprop="url" content={SITE} />
        <meta name="shortlink" content={SITE} />
        <meta property="og:url" content={SITE} />

        <link rel="preconnect" href="https://video.twimg.com" />
        <link rel="preconnect" href="https://pbs.twimg.com" />

        <link href="https://twitter.com/inthistweet_dev" rel="me" />
        <link
          rel="webmention"
          href="https://webmention.io/inthistweet.app/webmention"
        />
        <link
          rel="pingback"
          href="https://webmention.io/inthistweet.app/xmlrpc"
        />
        <link
          rel="pingback"
          href="https://webmention.io/webmention?forward=https://inthistweet.app/endpoint"
        />

        <RouterHead />
        <ServiceWorkerRegister />
      </head>
      <body lang="en">
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  );
});
