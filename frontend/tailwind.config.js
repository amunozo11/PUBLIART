/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // PUBLIART Brand
        primary: {
          DEFAULT: '#F5C400',
          50:  '#FFFCE6',
          100: '#FFF7CC',
          200: '#FFEF99',
          300: '#FFE566',
          400: '#FFD933',
          500: '#F5C400',
          600: '#CC9E00',
          700: '#997700',
          800: '#665000',
          900: '#332800',
        },
        dark: {
          DEFAULT: '#0A0A0B',
          50:  '#1A1A1D',
          100: '#141416',
          200: '#0F0F11',
          300: '#0A0A0B',
        },
        surface: {
          DEFAULT: '#111113',
          2: '#1A1A1D',
          3: '#222226',
          4: '#2A2A2E',
        },
        border: {
          DEFAULT: '#2A2A2E',
          light: '#3A3A3F',
        },
        text: {
          DEFAULT: '#F0F0F0',
          muted: '#8A8A8E',
          dim: '#5A5A5F',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #F5C400 0%, #FFD933 100%)',
        'gradient-dark': 'linear-gradient(135deg, #111113 0%, #1A1A1D 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(245, 196, 0, 0.3)',
        'glow-lg': '0 0 40px rgba(245, 196, 0, 0.2)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
