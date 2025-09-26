import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        bittersweet: {
          DEFAULT: '#ff595e',
          100: '#440002',
          200: '#890005',
          300: '#cd0007',
          400: '#ff121a',
          500: '#ff595e',
          600: '#ff787d',
          700: '#ff9a9d',
          800: '#ffbcbe',
          900: '#ffddde',
        },
        sunglow: {
          DEFAULT: '#ffca3a',
          100: '#3e2e00',
          200: '#7c5b00',
          300: '#bb8900',
          400: '#f9b700',
          500: '#ffca3a',
          600: '#ffd560',
          700: '#ffdf88',
          800: '#ffeaaf',
          900: '#fff4d7',
        },
        yellow_green: {
          DEFAULT: '#8ac926',
          100: '#1c2808',
          200: '#38510f',
          300: '#537917',
          400: '#6fa11f',
          500: '#8ac926',
          600: '#a4dc49',
          700: '#bbe577',
          800: '#d2eea4',
          900: '#e8f6d2',
        },
        steel_blue: 'hsl(var(--steel-blue))',
        ultra_violet: {
          DEFAULT: '#6a4c93',
          100: '#150f1e',
          200: '#2a1f3b',
          300: '#402e59',
          400: '#553d76',
          500: '#6a4c93',
          600: '#8768b1',
          700: '#a58ec5',
          800: '#c3b4d8',
          900: '#e1d9ec',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
