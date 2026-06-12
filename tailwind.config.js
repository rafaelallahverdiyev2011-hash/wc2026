/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        anton: ['Anton', 'Impact', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        wc: {
          red:    '#E3000B',
          blue:   '#0057A8',
          purple: '#6B2D8B',
          green:  '#00A850',
          yellow: '#C8D400',
          black:  '#0e1a2b',
          white:  '#FFFFFF',
        },
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'pulse-red': 'pulse-red 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
