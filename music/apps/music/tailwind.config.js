const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
        display: [
          'Outfit',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'ui-monospace',
          'SFMono-Regular',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        // Base sizes
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],

        // Headings with proper hierarchy
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
        '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.025em' }],

        // Music-specific typography
        'page-title': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '700' }],
        'section-title': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.025em', fontWeight: '600' }],
        'card-title': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.025em', fontWeight: '600' }],
        'artist-name': ['1.125rem', { lineHeight: '1.4', letterSpacing: '-0.015em', fontWeight: '500' }],
        'album-title': ['1rem', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '500' }],
        'song-title': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '400' }],
        'metadata': ['0.75rem', { lineHeight: '1.3', letterSpacing: '0.025em', fontWeight: '400' }],
        'label': ['0.875rem', { lineHeight: '1.25', letterSpacing: '0.025em', fontWeight: '500' }],
        'button': ['0.875rem', { lineHeight: '1.25', letterSpacing: '0.025em', fontWeight: '500' }],
        'caption': ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.025em', fontWeight: '400' }],
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      letterSpacing: {
        tightest: '-0.075em',
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      lineHeight: {
        none: '1',
        tight: '1.1',
        snug: '1.2',
        normal: '1.3',
        relaxed: '1.4',
        loose: '1.5',
        extra: '1.6',
      },
      spacing: {
        // 8px base unit system for consistent spacing
        '0': '0px',
        '0.5': '2px',    // 0.25 * 8px
        '1': '4px',      // 0.5 * 8px
        '1.5': '6px',    // 0.75 * 8px
        '2': '8px',      // 1 * 8px (base unit)
        '3': '12px',     // 1.5 * 8px
        '4': '16px',     // 2 * 8px
        '5': '20px',     // 2.5 * 8px
        '6': '24px',     // 3 * 8px
        '7': '28px',     // 3.5 * 8px
        '8': '32px',     // 4 * 8px
        '10': '40px',    // 5 * 8px
        '12': '48px',    // 6 * 8px
        '14': '56px',    // 7 * 8px
        '16': '64px',    // 8 * 8px
        '20': '80px',    // 10 * 8px
        '24': '96px',    // 12 * 8px
        '28': '112px',   // 14 * 8px
        '32': '128px',   // 16 * 8px
        '36': '144px',   // 18 * 8px
        '40': '160px',   // 20 * 8px
        '44': '176px',   // 22 * 8px
        '48': '192px',   // 24 * 8px
        '52': '208px',   // 26 * 8px
        '56': '224px',   // 28 * 8px
        '60': '240px',   // 30 * 8px
        '64': '256px',   // 32 * 8px
        '72': '288px',   // 36 * 8px
        '80': '320px',   // 40 * 8px
        '96': '384px',   // 48 * 8px
        // Layout spacing
        'layout-xs': '16px',   // 2 * 8px
        'layout-sm': '24px',   // 3 * 8px
        'layout-md': '32px',   // 4 * 8px
        'layout-lg': '48px',   // 6 * 8px
        'layout-xl': '64px',   // 8 * 8px
        'layout-2xl': '96px',  // 12 * 8px
        // Component spacing
        'component-xs': '8px',   // 1 * 8px
        'component-sm': '16px',  // 2 * 8px
        'component-md': '24px',  // 3 * 8px
        'component-lg': '32px',  // 4 * 8px
        'component-xl': '48px',  // 6 * 8px
      },
      maxWidth: {
        'container-xs': '480px',
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
        'container-2xl': '1536px',
        'content': '65ch',        // Optimal reading width
        'prose': '75ch',          // Prose content width
      },
      colors: {
        // Primary Brand Colors - Music Theme
        music: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef', // Primary purple
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },
        // Secondary Accent Colors
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Orange accent
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Warm Gold for Premium/Special Elements
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Gold
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Sophisticated Neutrals
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373', // Mid gray
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Semantic Colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Success green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Warning amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Error red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Music-specific Colors
        rating: {
          bronze: '#cd7f32',
          silver: '#c0c0c0',
          gold: '#ffd700',
          platinum: '#e5e4e2',
        }
      },
    },
  },
  plugins: [],
};
