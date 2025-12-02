import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: { 
        sans: ['Manrope', 'sans-serif'],
        // HYWenHei с системными fallback для мгновенного LCP
        logo: ['HYWenHei', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        plaster: {
          light: '#F5F5F0',    // Light plaster base
          DEFAULT: '#E8E8E0',  // Default plaster
          dark: '#D0D0C8',     // Darker plaster shade
        },
        brand: {
          green: '#4A7C23',         // Primary brand green - WCAG AA compliant
          'green-dark': '#3D6B1C',  // Hover/active state - WCAG AA compliant
          'green-light': '#7CB342', // Light accent
          'green-text': '#2D5A12',  // Accessible text color (7:1 contrast on white)
        },
        text: {
          primary: '#2C2C2C',   // Dark gray for main text
          secondary: '#5A5A5A', // Medium gray for secondary text
        },
        // Keep for backward compatibility during migration - WCAG AA compliant
        'brand-green': '#4A7C23',
        'brand-green-dark': '#3D6B1C',
        'brand-green-light': '#7CB342',
        'brand-green-text': '#2D5A12', // Accessible text color (7:1 contrast)
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s infinite',
      },
      keyframes: {
        'pulse-glow': {
            '0%, 100%': { boxShadow: '0 0 5px #0EA5E9' },
            '50%': { boxShadow: '0 0 20px #0EA5E9' },
        }
      }
    },
  },
  plugins: [],
};
export default config;