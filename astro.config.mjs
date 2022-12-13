import { defineConfig } from 'astro/config';

// https://astro.build/config
import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';

// https://astro.build/config
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import netlify from "@astrojs/netlify/edge-functions";

// https://astro.build/config
export default defineConfig({
  site: "https://media.okikio.dev",
  integrations: [svelte(), tailwind(), sitemap({ customPages: ['https://media.okikio.dev/'] })],
  output: "server",
  adapter: netlify({
    dist: new URL('./dist/', import.meta.url)
  }),
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