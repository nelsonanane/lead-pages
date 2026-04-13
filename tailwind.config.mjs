/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#15803D',  // Forest green
          light:   '#F0FDF4',  // Very light green tint
          dark:    '#166534',  // Deep forest green (hover)
        },
        dark: '#1A1035',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"Courier Prime"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
};
