/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        pfm: {
          bg: '#0f0f14',
          'bg-alt': '#12121a',
          surface: '#1a1a22',
          'surface-hover': '#22222d',
          border: '#2a2a36',
          'border-muted': '#1e1e28',
          accent: '#ec4899',
          'accent-hover': '#f472b6',
          'accent-muted': '#a21caf',
          text: '#f4f4f5',
          'text-muted': '#a1a1aa',
          success: '#22c55e',
          'success-muted': '#16a34a',
          error: '#ef4444',
          'error-muted': '#dc2626',
          warning: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}
