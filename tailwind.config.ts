import type { Config } from "tailwindcss"

const config: Config = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			screens: {
				"3xl": "1633px",
				"1.5xl": "1333px",
				"lt-2xl": { max: "1535px" },

				"lt-xl": { max: "1279px" },

				"lt-lg": { max: "1023px" },

				"lt-md": { max: "767px" },

				"lt-sm": { max: "639px" },

				"xsm": "439px",
				"lt-xsm": { max: "439px" },

				"xxsm": "339px",
				"lt-xxsm": { max: "339px" },

				'coarse': { 'raw': '(pointer: coarse)' },
				'fine': { 'raw': '(pointer: fine)' },
			},
			colors: {
				"primary": "#60a5fa",
				"secondary": "#1d4ed8",
				"elevated": "#1C1C1E",
				"elevated-2": "#262628",
				"label": "#ddd",
				"tertiary": "#555",
				"quaternary": "#333",
				"center-container-dark": "#121212",
			},
		},
	},
	plugins: [],
}

export default config