/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Film-themed color palette
        film: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Rating colors
        rating: {
          1: '#ef4444',  // red
          2: '#f97316',  // orange
          3: '#f59e0b',  // amber
          4: '#eab308',  // yellow
          5: '#84cc16',  // lime
          6: '#22c55e',  // green
          7: '#10b981',  // emerald
          8: '#14b8a6',  // teal
          9: '#06b6d4',  // cyan
          10: '#3b82f6', // blue
        },
      },
    },
  },
  plugins: [],
}
