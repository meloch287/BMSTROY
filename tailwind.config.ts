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
        logo: ['HYWenHei', 'sans-serif'],
      },
      colors: {
        plaster: {
          light: '#F5F5F0',    // Light plaster base
          DEFAULT: '#E8E8E0',  // Default plaster
          dark: '#D0D0C8',     // Darker plaster shade
        },
        brand: {
          green: '#7CB342',         // Primary brand green (from logo)
          'green-dark': '#558B2F',  // Hover/active state
          'green-light': '#9CCC65', // Light accent
        },
        text: {
          primary: '#2C2C2C',   // Dark gray for main text
          secondary: '#5A5A5A', // Medium gray for secondary text
        },
        // Keep for backward compatibility during migration
        'brand-green': '#7CB342',
        'brand-green-dark': '#558B2F',
        'brand-green-light': '#9CCC65',
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