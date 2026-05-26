/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00f3ff',
        'neon-purple': '#b026ff',
        'neon-pink': '#ff00ea',
        'neon-green': '#39ff14',
        'dark-bg': '#050505',
        'dark-card': '#0a0a0f',
        'dark-surface': 'rgba(12, 12, 18, 0.75)',
        'dark-border': 'rgba(255, 255, 255, 0.06)',
        'dark-elevated': '#111118',
      }
    },
  },
  plugins: [],
}
