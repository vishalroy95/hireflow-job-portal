export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#1e293b',
        danger: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b',
        dark: '#0f172a',
        light: '#f8fafc',
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
      },
    },
  },
  plugins: [],
}
