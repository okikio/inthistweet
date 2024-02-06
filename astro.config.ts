import { defineConfig } from 'astro/config';

// https://astro.build/config
import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';

// https://astro.build/config
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

import serviceWorker from "astrojs-service-worker"; 
import adapter from "astro-auto-adapter"; 

import type { RangeRequestsPlugin as RangeRequestsPluginType } from "workbox-range-requests"
import RangeRequestsPlugin, { urlPattern } from './range-requests.mjs';

// https://astro.build/config
export default defineConfig({
  site: "https://inthistweet.app",
  integrations: [
    svelte(), 
    tailwind(), 
    sitemap({ customPages: ['https://inthistweet.app/'] }),
    // serviceWorker({
    //   // enableInDevelopment: true,
    //   registration: { autoRegister: true },
    //   // @ts-ignore
    //   workbox: {
    //     skipWaiting: true,
    //     clientsClaim: true,

    //     additionalManifestEntries: [
    //       "/",
    //       "https://inthistweet.app"
    //     ],

    //     // globDirectory: outDir,
    //     globPatterns: ["**/*.{html,js,css,svg,ttf,woff2,png,webp,jpg,jpeg,wasm,ico,json,xml}"], //
    //     ignoreURLParametersMatching: [/index\.html\?(.*)/, /\\?(.*)/],
    //     cleanupOutdatedCaches: true,

    //     // Define runtime caching rules.
    //     runtimeCaching: [
    //       {
    //         // Match any request that starts with https://api.producthunt.com, https://api.countapi.xyz, https://opencollective.com, etc...
    //         urlPattern,
    //         // Apply a network-first strategy.
    //         handler: "NetworkFirst",
    //         method: "GET",
    //         options: {
    //           cacheableResponse: {
    //             statuses: [0, 200]
    //           },
    //           plugins: [
    //             new RangeRequestsPlugin() as unknown as RangeRequestsPluginType
    //           ],
    //           matchOptions: {
    //             ignoreSearch: true,
    //             ignoreVary: true
    //           }
    //         }
    //       },
    //       {
    //         // Match any request that starts with https://api.producthunt.com, https://api.countapi.xyz, https://opencollective.com, etc...
    //         urlPattern:
    //           /(?:^https:\/\/(?:.*)\.twimg\.com)|(?:\/api\/twitter)|(?:\/take-measurement$)|(?:^https:\/\/((?:api\.producthunt\.com)|(?:api\.countapi\.xyz)|(?:opencollective\.com)|(?:giscus\.bundlejs\.com)))/,
    //         // Apply a network-first strategy.
    //         handler: "NetworkFirst",
    //         method: "GET",
    //         options: {
    //           cacheableResponse: {
    //             statuses: [0, 200]
    //           },
    //         }
    //       },
    //       {
    //         // Match any request that ends with .png, .jpg, .jpeg, .svg, etc....
    //         urlPattern:
    //           /workbox\-(.*)\.js|\.(?:png|jpg|jpeg|svg|webp|map|ts|wasm|css)$|^https:\/\/(?:cdn\.polyfill\.io)/,
    //         // Apply a stale-while-revalidate strategy.
    //         handler: "NetworkFirst",
    //         method: "GET",
    //         options: {
    //           cacheableResponse: {
    //             statuses: [0, 200]
    //           }
    //         }
    //       },
    //       {
    //         // Cache `monaco-editor` etc...
    //         urlPattern:
    //           /(?:(?:chunks|assets|favicon|fonts|giscus)\/(.*)$)/,
    //         // Apply a network-first strategy.
    //         handler: "NetworkFirst",
    //         method: "GET",
    //         options: {
    //           cacheableResponse: {
    //             statuses: [0, 200]
    //           },
    //         }
    //       },
    //     ]
    //   }
    // })
  ],
  output: "hybrid",
  adapter: await adapter(undefined, {
    "deno": {
      port: 4321
    }
  }),
  vite: {
    plugins: [
      Icons({
        // experimental
        autoInstall: true,
        compiler: 'svelte',
        customCollections: {
          // a helper to load icons from the file system
          // files under `./assets/icons` with `.svg` extension will be loaded as it's file name
          // you can also provide a transform callback to change each icon (optional)
          'local': FileSystemIconLoader(
            './src/icons',
            svg => svg.replace(/^<svg /, '<svg fill="currentColor" '),
          ),
        },
      }),
    ]
  }
});
