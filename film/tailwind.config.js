/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
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
        // Rating colors: red-to-green diverging scale (bad -> good)
        rating: {
          1: '#a50026',  // dark red (critical)
          2: '#d73027',  // red
          3: '#f46d43',  // red-orange
          4: '#fc8d59',  // orange
          5: '#fdae61',  // light orange
          6: '#fee08b',  // pale yellow (neutral)
          7: '#d9ef8b',  // light green
          8: '#a6d96a',  // green
          9: '#66bd63',  // medium green
          10: '#1a9850', // dark green (perfect)
        },
      },
    },
  },
  plugins: [],
}
