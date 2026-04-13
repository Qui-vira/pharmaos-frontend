/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          '50': '#f0fdf6',
          '100': '#dcfce9',
          '200': '#bbf7d4',
          '300': '#86efb0',
          '400': '#4ade83',
          '500': '#16c05e',
          '600': '#0d9e4a',
          '700': '#0f7d3e',
          '800': '#126335',
          '900': '#11512e',
          '950': '#032d17',
        },
        surface: {
          '0': '#ffffff',
          '50': '#f8fafb',
          '100': '#f1f4f6',
          '200': '#e5e9ed',
          '300': '#d1d7de',
          '400': '#9ba5b1',
          '500': '#6b7685',
          '600': '#4a5261',
          '700': '#363d49',
          '750': '#2c3340',
          '800': '#252a33',
          '850': '#1e222b',
          '900': '#171b22',
          '950': '#0d0f13',
        },
        danger: {
          '500': '#ef4444',
          '600': '#dc2626',
        },
        warning: {
          '500': '#f59e0b',
          '600': '#d97706',
        },
        info: {
          '500': '#3b82f6',
          '600': '#2563eb',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-dark': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.4)',
        elevated: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'elevated-dark': '0 4px 16px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
        glow: '0 0 24px rgba(16,192,94,0.15)',
        'glow-strong': '0 0 40px rgba(16,192,94,0.25), 0 0 80px rgba(16,192,94,0.1)',
        'glow-blue': '0 0 24px rgba(59,130,246,0.15)',
        glass: '0 8px 32px rgba(0,0,0,0.04)',
        'glass-dark': '0 8px 32px rgba(0,0,0,0.3)',
      },
      keyframes: {
        'slide-in': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        shine: {
          '0%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '100%': { backgroundPosition: '0% 0%' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - var(--gap)))' },
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - var(--gap)))' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16,192,94,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(16,192,94,0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        shine: 'shine 8s linear infinite',
        marquee: 'marquee var(--duration) linear infinite',
        'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
