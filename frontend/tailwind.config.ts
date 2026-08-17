import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './node_modules/@tremor/react/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tremor: {
          brand: {
            faint: 'var(--brand-soft)',
            muted: 'var(--brand-soft)',
            subtle: 'var(--brand)',
            DEFAULT: 'var(--brand)',
            emphasis: 'var(--brand-dark)',
            inverted: 'var(--surface)',
          },
          background: {
            muted: 'var(--bg)',
            subtle: 'var(--hover)',
            DEFAULT: 'var(--surface)',
            emphasis: 'var(--ink)',
          },
          border: { DEFAULT: 'var(--line)' },
          ring: { DEFAULT: 'var(--line)' },
          content: {
            subtle: 'var(--muted)',
            DEFAULT: 'var(--muted)',
            emphasis: 'var(--ink)',
            strong: 'var(--ink)',
            inverted: 'var(--surface)',
          },
        },
      },
      boxShadow: {
        'tremor-dropdown': 'var(--shadow)',
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
