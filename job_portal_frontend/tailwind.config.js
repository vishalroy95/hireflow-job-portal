/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A66C2',
        secondary: '#00A4EF',
        accent: '#E7622D',
        dark: '#0D1117',
        light: '#F6F8FA',
        success: '#28A745',
        warning: '#FFC107',
        danger: '#DC3545',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
