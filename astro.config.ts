import { defineConfig } from 'astro/config';

// https://astro.build/config
import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';

// https://astro.build/config
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

import adapter from "astro-auto-adapter";
import pwa from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  site: "https://inthistweet.app",
  integrations: [
    svelte(), 
    tailwind(), 
    sitemap({ customPages: ['https://inthistweet.app/'] }),
    pwa({
      experimental: {
        directoryAndTrailingSlashHandler: true,
      },
      devOptions: {
        enabled: false
      }, 
      registerType: "autoUpdate",
      includeAssets: ['/favicon/favicon.svg', '/favicon/maskable_icon.png', '/favicon/apple-touch-icon.png', '/favicon/android-chrome-512x512.png'],
      workbox: { 
        // navigateFallback: '/offline', 
        cleanupOutdatedCaches: true,
      },
      manifest: {
        "name": "In this tweet",
        "short_name": "In this tweet",
        "id": "inthistweet",
        "start_url": "/?utm_source=pwa",
        "scope": "/",
        "dir": "ltr",
        "display": "standalone",
        "theme_color": "#232323",
        "background_color": "#232323",
        "description": "✨ Futuristic ✨ twitter image, video, and gif downloader and FFmpeg video conversion playground, m3u8 to mp4, webm to mp4, mp4 to gif, etc... Enter a Tweet URL, click search, and download the images and videos in it.",
        "icons": [
          {
            "src": "/favicon/favicon.svg",
            "sizes": "any",
            "type": "image/svg+xml",
            "purpose": "any"
          },
          {
            "src": "/favicon/maskable_icon_x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "maskable"
          },
          {
            "src": "/favicon/maskable_icon_x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          },
          {
            "src": "/favicon/maskable_icon.png",
            "sizes": "1024x1024",
            "type": "image/png",
            "purpose": "maskable"
          },
          {
            "src": "/favicon/android-chrome-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "/favicon/android-chrome-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
          }
        ],
        "lang": "en",
        "screenshots": [
          {
            "src": "/screenshot-mobile-1.png",
            "type": "image/png",
            "sizes": "1082x2400",
            "form_factor": "narrow"
          },
          {
            "src": "/screenshot-mobile-2.png",
            "type": "image/png",
            "sizes": "1082x2400",
            "form_factor": "narrow"
          },
          {
            "src": "/screenshot-desktop-1.png",
            "type": "image/png",
            "sizes": "3206x2184",
            "form_factor": "wide"
          },
          {
            "src": "/screenshot-desktop-2.png",
            "type": "image/png",
            "sizes": "3206x2184",
            "form_factor": "wide"
          }
        ],
        "share_target": {
          "action": "/",
          "method": "GET",
          "enctype": "application/x-www-form-urlencoded",
          "params": {
            "text": "q",
            "url": "url"
          }
        },
        "orientation": "natural",
        "categories": [
          "productivity",
          "utility",
          "text",
          "social",
          "photo",
          "photo & video",
          "video",
          "multimedia",
          "developer tools"
        ]
      }
      /* your pwa options */
    }),
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
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  output: "hybrid",
  adapter: await adapter(undefined, {
    "deno": {
      port: 4321
    }
  }),
  vite: {
    // worker: {
    //   format: "es"
    // },
    optimizeDeps: {
      exclude: ["@ffmpeg/core-mt", "@ffmpeg/ffmpeg", "@ffmpeg/util"],
    },
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
    },
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
