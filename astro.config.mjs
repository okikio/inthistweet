import { defineConfig } from 'astro/config';

// https://astro.build/config
import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';

// https://astro.build/config
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

import serviceWorker from "astrojs-service-worker"; 

import netlify from "@astrojs/netlify/edge-functions";
import vercel from "@astrojs/vercel/edge";
import cloudflare from "@astrojs/cloudflare";
import deno from "@astrojs/deno";
import node from "@astrojs/node";  

const adapter = (ssr) => {
  switch (ssr) {
    case "netlify": 
      return netlify({
        dist: new URL('./dist/', import.meta.url)
      });

    case "vercel": 
      return vercel();
    
    case "cloudflare": 
      return cloudflare();

    case "deno": 
      return deno();
    
    case "node": 
    default: 
      return node({
        mode: 'standalone'
      });
  }
}

// https://astro.build/config
export default defineConfig({
  site: "https://inthistweet.app",
  integrations: [
    svelte(), 
    tailwind(), 
    sitemap({ customPages: ['https://inthistweet.app/'] }), 
    serviceWorker({
      // registration: { autoRegister: false },
      // @ts-ignore
      workbox: {
        skipWaiting: false,
        clientsClaim: false,

        // globDirectory: outDir,
        globPatterns: ["**/*.{html,js,css,svg,ttf,woff2,png,webp,jpg,jpeg,wasm,ico,json,xml}"], //
        ignoreURLParametersMatching: [/index\.html\?(.*)/, /\\?(.*)/],
        cleanupOutdatedCaches: true,

        // Define runtime caching rules.
        runtimeCaching: [
          {
            // Match any request that starts with https://api.producthunt.com, https://api.countapi.xyz, https://opencollective.com, etc...
            urlPattern:
              /(\/api\/twitter)|(?:^https:\/\/((?:api\.producthunt\.com)|(?:api\.countapi\.xyz)|(?:opencollective\.com)|(?:giscus\.bundlejs\.com)|(?:bundlejs\.com\/take-measurement)))/,
            // Apply a network-first strategy.
            handler: "NetworkFirst",
            method: "GET",
            options: {
              cacheableResponse: {
                statuses: [0, 200]
              },
            }
          },
          {
            // Match any request that ends with .png, .jpg, .jpeg, .svg, etc....
            urlPattern:
              /workbox\-(.*)\.js|\.(?:png|jpg|jpeg|svg|webp|map|ts|wasm|css)$|^https:\/\/(?:cdn\.polyfill\.io)/,
            // Apply a stale-while-revalidate strategy.
            handler: "StaleWhileRevalidate",
            method: "GET",
            options: {
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache `monaco-editor` etc...
            urlPattern:
              /(?:chunks|assets|favicon|fonts|giscus)\/(.*)$/,
            // Apply a network-first strategy.
            handler: "CacheFirst",
            method: "GET",
            options: {
              cacheableResponse: {
                statuses: [0, 200]
              },
            }
          },
        ]
      }
    })
  ],
  output: "server",
  adapter: adapter(process.env?.SSR_MODE ?? 'netlify'),
  experimental: {
    prerender: false,
    errorOverlay: true,
    contentCollections: false,
  },
  vite: {
    server: {
      cors: true
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
      })
    ]
  }
});
