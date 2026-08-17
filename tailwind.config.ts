import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blueberry: {
          DEFAULT: '#2563eb',
          soft: '#4f83f1',
          deep: '#1d4ed8',
        },
        cream: '#fdf6df',
        lavender: {
          50: '#f7f4fd',
          100: '#efeafb',
          200: '#e3dcf6',
        },
        blush: '#ffd9e0',
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-rounded', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        hand: ['var(--font-hand)', 'cursive'],
      },
      boxShadow: {
        card: '0 12px 30px -12px rgba(76, 63, 130, 0.28), 0 2px 6px rgba(76, 63, 130, 0.06)',
        photo: '0 14px 32px -14px rgba(60, 50, 110, 0.42), 0 2px 5px rgba(60, 50, 110, 0.10)',
        button: '0 10px 20px -8px rgba(37, 99, 235, 0.65)',
        soft: '0 6px 18px -8px rgba(76, 63, 130, 0.30)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
