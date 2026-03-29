/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,js,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wechat: {
          green: '#07c160',
          bg: '#f2f2f2',
          soft: '#f7f7f7',
          line: '#e5e7eb',
        },
      },
    },
  },
  plugins: [],
}

