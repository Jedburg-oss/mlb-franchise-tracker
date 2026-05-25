/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Anton', 'Impact', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#0a0a0c',
          surface: '#13141a',
          elevated: '#1a1b22',
          input: '#0f1014',
        },
        border: {
          DEFAULT: '#22232b',
          bright: '#33343d',
        },
        accent: {
          DEFAULT: '#ff2d2d',
          dim: '#cc2424',
          bright: '#ff5050',
        },
        cool: {
          DEFAULT: '#00d4ff',
          dim: '#0099bb',
        },
        text: {
          primary: '#f5f5f7',
          secondary: '#a1a1a6',
          tertiary: '#6e6e73',
          dim: '#48484d',
        },
        positive: '#22c55e',
        negative: '#ef4444',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(255, 45, 45, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 20px 0 rgba(255, 45, 45, 0.2)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
