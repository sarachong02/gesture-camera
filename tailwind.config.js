/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:         '#1A657B',
        'primary-light': '#B5D7C5',
        'primary-dark':  '#134E5E',
        sand:            '#F5EDDE',
      },
      fontFamily: {
        display: ['"Gilda Display"', 'Georgia', 'serif'],
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '999px',
      },
      animation: {
        "fade-in":   "fadeIn 0.4s ease-out forwards",
        "slide-up":  "slideUp 0.4s ease-out forwards",
        "pulse-ring":"pulseRing 1.5s ease-out infinite",
        "countdown": "countdown 1s linear forwards",
        "enter":     "fadeSlideUp 280ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        pulseRing: {
          "0%":   { transform: "scale(1)",   opacity: "1" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        countdown: {
          from: { strokeDashoffset: "0" },
          to:   { strokeDashoffset: "251.2" },
        },
        fadeSlideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
