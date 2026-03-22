/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // This makes 'font-poppins' available
        poppins: ['Poppins', 'sans-serif'],
        // Optional: Override the default 'sans' stack so you don't 
        // have to type 'font-poppins' everywhere
        sans: ['Poppins', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}