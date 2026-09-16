import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1C2321',
        paper: '#F7F5F0',
        signal: '#2F6F4E',
        signalDark: '#1F4D35',
        clay: '#C4602A',
        line: '#DCD8CE'
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)']
      }
    }
  },
  plugins: []
};

export default config;
