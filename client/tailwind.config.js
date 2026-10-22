/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { navy: '#0F2058', accent: '#3B82F6', bg: '#F6F8FF', muted: '#64748B', surface: '#F1F5F9' },
    fontFamily: { heading: ['"Playfair Display"', 'serif'], body: ['"DM Sans"', 'sans-serif'] },
    boxShadow: { card: '0 4px 24px rgba(15,32,88,.08)', soft: '0 2px 12px rgba(15,32,88,.06)' },
  }},
  plugins: [],
};
