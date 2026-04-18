/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        schola: {
          navy: '#1e3a5f',
          blue: '#2563eb',
          gold: '#d97706',
          light: '#f0f4f8',
          muted: '#64748b',
          cream: '#faf7f2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        '3.5xl': '56rem',
      },
    },
  },
  plugins: [],
};
