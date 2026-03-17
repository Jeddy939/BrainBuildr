/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './App.tsx', './components/**/*.{ts,tsx}', './index.tsx'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0f14',
          900: '#101621',
          800: '#151c29',
          700: '#1f2a3a',
          600: '#2c3b4f'
        },
        sand: {
          50: '#fdf8f1',
          100: '#f7efe4',
          200: '#e8dccb'
        },
        tide: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488'
        },
        ember: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48'
        },
        sun: {
          400: '#fbbf24',
          500: '#f59e0b'
        },
        sky: {
          400: '#60a5fa',
          500: '#3b82f6'
        },
        moss: {
          400: '#34d399',
          500: '#10b981'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Trebuchet MS', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['Consolas', 'Cascadia Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.2s ease-in-out infinite'
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: []
};
