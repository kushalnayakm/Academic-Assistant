/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Light academic palette (aliases keep existing class names working)
        night: '#F8FDF5',
        ink: '#FFFFFF',
        panel: '#F8FDF5',
        cardDark: '#FFFFFF',
        elevated: '#F0FDF4',
        glow: '#16A34A',
        violet: '#FACC15',
        mist: '#111827',
        soft: '#64748B',
        line: '#E5E7EB',
        leaf: '#DCFCE7',
        sun: '#FEF9C3',
        forest: '#087F43',
        // Shared aliases
        bg: '#FFFFFF',
        navy: '#111827',
        accent: '#16A34A',
        muted: '#64748B',
        surface: '#FFFFFF',
      },
      fontFamily: {
        heading: ['"DM Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 24px rgba(17,24,39,.06)',
        soft: '0 4px 14px rgba(17,24,39,.05)',
        glow: '0 8px 20px rgba(22,163,74,.18)',
        'glow-sm': '0 4px 12px rgba(22,163,74,.14)',
      },
      backgroundImage: {
        'ask-radial':
          'radial-gradient(ellipse at top right, rgba(250,204,21,.18), transparent 45%), radial-gradient(ellipse at bottom left, rgba(22,163,74,.12), transparent 40%)',
        'leaf-shape':
          'radial-gradient(circle at 0% 100%, rgba(220,252,231,.9), transparent 40%), radial-gradient(circle at 100% 100%, rgba(254,249,195,.85), transparent 35%)',
      },
    },
  },
  plugins: [],
};
