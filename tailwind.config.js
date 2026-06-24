/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#60a5fa', // Soft pastel blue
          600: '#3b82f6',
          900: '#1e3a8a',
        },
        dark: {
          bg: '#020617', // Deeper, more premium black
          card: '#0f172a',
          border: '#1e293b'
        }
      },
      boxShadow: {
        'soft': '0 4px 40px -2px rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
};
