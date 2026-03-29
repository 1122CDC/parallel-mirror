/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,js,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: '#07111f',
          panel: '#0d1728',
          soft: '#111c31',
          line: '#1f2b44',
          green: '#25c16f',
        },
      },
    },
  },
  plugins: [],
}
