/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#F0C030',
          dark:    '#C49B20',
          dim:     'rgba(240,192,48,0.08)',
        },
        brand: {
          bg:   '#0E0E12',
          card: '#141418',
          hero: '#111108',
          ink:  '#F0EDE0',
        },
      },
      fontFamily: {
        mono: ['"Kode Mono"', '"Courier New"', 'monospace'],
        sans: ['"Kode Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
};
