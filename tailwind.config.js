/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 21C Home brand system — shared with the grocery app's --2ic-* tokens.
        // Token *names* are kept from Phase 1 so no component className needs
        // to change; only the underlying hues moved to match the brand.
        cream: { DEFAULT: '#FDF6F0', deep: '#F5E9DE' },
        blush: { DEFAULT: '#F6EAE0', soft: '#FBF3EA' },
        rose: { DEFAULT: '#FF6F61', deep: '#E85541' }, // brand coral — accents, active states
        plum: { DEFAULT: '#22314F', soft: '#48597A', ink: '#17223A' }, // brand navy — ink & hero surfaces
        sage: { DEFAULT: '#20B7A4', deep: '#178F80' }, // brand teal — positive / under-budget
        coral: { DEFAULT: '#E2483A', deep: '#C13327' }, // danger red — over-budget / alerts
        champagne: { DEFAULT: '#F6B84E', deep: '#D99A2E' }, // brand gold — highlights, sparkle
        // 2IC brand accent — used for the logo mark, login hero, and header.
        // Unified with `plum` (brand navy) now that both are the same family.
        teal: { DEFAULT: '#22314F', deep: '#141D30', soft: '#3C4E70' },
      },
      fontFamily: {
        // `serif` name kept from Phase 1 for the same no-className-churn
        // reason as colors above; it now points at the brand's display face.
        serif: ['Fredoka', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        script: ['Pacifico', 'cursive'],
      },
      borderRadius: { xl: '16px', '2xl': '20px', '3xl': '24px' },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(34,49,79,0.08), 0 4px 16px -4px rgba(34,49,79,0.06)',
        card: '0 4px 20px -6px rgba(34,49,79,0.10), 0 8px 32px -12px rgba(34,49,79,0.08)',
        hero: '0 8px 40px -8px rgba(255,111,97,0.24), 0 2px 12px -4px rgba(34,49,79,0.10)',
        lift: '0 12px 32px -8px rgba(34,49,79,0.16)',
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
