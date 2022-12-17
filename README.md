# inthistweet

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/okikio/twitter-media)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/s/github/okikio/twitter-media)

![in-this-tweet light logo](public/logo-full-light.svg#gh-light-mode-only)
![in-this-tweet dark logo](public/logo-full-dark.svg#gh-dark-mode-only)

Quick and easy twitter image/video downloader. 
Enter a Tweet URL, click search, and download the image/videos in it.

[inthistweet.app](https://inthistweet.app)

## 🚀 Project Structure

Inside of your [Astro](https://astro.build) project, you'll see the following folders and files:

```
/
├── public/
│   ├── ...
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── search.svelte
│   ├── icons/
│   │   └── logo.svg
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── api/
│   │   │   └── twitter.ts
│   │   └── index.astro
│   ├── scripts/
│   │   └── measure.ts
│   └── utils.ts
└── package.json
```

[Astro](https://astro.build) looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any [Astro](https://astro.build)/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                             |
| :--------------------- | :------------------------------------------------- |
| `npm install`          | Installs dependencies                              |
| `npm run dev`          | Starts local dev server at `localhost:3000`        |
| `npm run build`        | Build your production site to `./dist/`            |
| `npm run preview`      | Preview your build locally, before deploying       |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro preview` |
| `npm run astro --help` | Get help using the Astro CLI                       |

## 👀 Want to learn more?

Feel free to check out the [Astro documentation](https://docs.astro.build) or jump into our the [Astro Discord server](https://astro.build/chat).

## License

MIT - © 2022 [Okiki Ojo](https://okikio.dev)