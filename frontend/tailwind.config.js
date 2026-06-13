/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#090d10',
        darkCard: 'rgba(21, 28, 35, 0.6)',
        darkBorder: 'rgba(255, 255, 255, 0.08)',
        ecoGreen: {
          light: '#34d399',
          DEFAULT: '#10b981',
          dark: '#047857',
        },
        ecoTeal: {
          light: '#2dd4bf',
          DEFAULT: '#14b8a6',
          dark: '#0f766e',
        },
        ecoGold: '#f59e0b',
        ecoRed: '#ef4444',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(16, 185, 129, 0.15)',
        glowTeal: '0 0 20px rgba(20, 184, 166, 0.15)',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
