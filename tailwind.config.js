/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        dhe: {
          bg: "#000A14",
          surface: "#001423",
          card: "#0C2540",
          elevated: "#103050",
          primary: "#0172FE",
          primaryDark: "#0056C7",
          text: "#FFFFFF",
          textSecondary: "#A8CCE8",
          textMuted: "#6B9ABF",
          border: "#1E4A73",
          borderLight: "#2D6A9F",
          success: "#22C55E",
          warning: "#FBBF24",
          danger: "#F87171",
          overlay: "rgba(0, 10, 20, 0.85)",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        dhe: "16px",
        "dhe-lg": "20px",
        "dhe-xl": "24px",
      },
      spacing: {
        screen: "20px",
        section: "24px",
        card: "16px",
      },
    },
  },
  plugins: [],
};
