import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './node_modules/@tremor/react/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tremor: {
          brand: {
            faint: '#ecf8f5',
            muted: '#b7ddd6',
            subtle: '#4aa392',
            DEFAULT: '#0f6b5c',
            emphasis: '#0b5247',
            inverted: '#ffffff',
          },
          background: {
            muted: '#f3f5f8',
            subtle: '#e8eef4',
            DEFAULT: '#ffffff',
            emphasis: '#142033',
          },
          border: { DEFAULT: '#d7e0ea' },
          ring: { DEFAULT: '#d7e0ea' },
          content: {
            subtle: '#93a1b3',
            DEFAULT: '#5b6b7f',
            emphasis: '#142033',
            strong: '#0f1724',
            inverted: '#ffffff',
          },
        },
      },
      boxShadow: {
        'tremor-dropdown': '0 10px 30px -18px rgb(20 32 51 / 0.28)',
      },
      borderRadius: {
        'tremor-default': '0.75rem',
      },
      fontSize: {
        'tremor-default': ['0.875rem', { lineHeight: '1.25rem' }],
      },
    },
  },
  safelist: [
    {
      pattern:
        /^(bg|text|fill|stroke)-(teal|amber|emerald|rose|sky|stone|gray)-(400|500|600)$/,
    },
  ],
};

export default config;
