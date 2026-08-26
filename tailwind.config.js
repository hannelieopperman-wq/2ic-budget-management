/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#FFFBF9', deep: '#FBF3EF' },
        blush: { DEFAULT: '#F7E3E6', soft: '#FCEEF0' },
        rose: { DEFAULT: '#D98CA0', deep: '#C56E85' },
        plum: { DEFAULT: '#5B3A4B', soft: '#7A5266', ink: '#402736' },
        sage: { DEFAULT: '#A8C6A1', deep: '#82A97B' },
        coral: { DEFAULT: '#E38B7B', deep: '#D06B58' },
        champagne: { DEFAULT: '#D9BE86', deep: '#C4A566' },
        // 2IC brand accent — used for the logo mark, login hero, and header.
        // Kept as an accent rather than a full palette swap so the envelope
        // pool/transaction screens stay in the calm cream/plum system.
        teal: { DEFAULT: '#1B3A4B', deep: '#12293A', soft: '#2C5265' },
      },
      fontFamily: {
        serif: ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl: '16px', '2xl': '20px', '3xl': '24px' },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(91,58,75,0.08), 0 4px 16px -4px rgba(91,58,75,0.06)',
        card: '0 4px 20px -6px rgba(91,58,75,0.10), 0 8px 32px -12px rgba(91,58,75,0.08)',
        hero: '0 8px 40px -8px rgba(217,140,160,0.24), 0 2px 12px -4px rgba(91,58,75,0.10)',
        lift: '0 12px 32px -8px rgba(91,58,75,0.16)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'check-draw': { '0%': { strokeDashoffset: '24' }, '100%': { strokeDashoffset: '0' } },
        'sparkle': { '0%,100%': { opacity: '0', transform: 'scale(0.5)' }, '50%': { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease both',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'check-draw': 'check-draw 0.6s ease forwards',
        'sparkle': 'sparkle 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
