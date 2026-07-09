/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        dhe: {
          primary: "#0073FF",
          dark: "#001423",
          light: "#7CBFE0",
          muted: "#5396B7",
          surface: "#F5F9FC",
          card: "#FFFFFF",
          border: "#E2EEF5",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
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
      boxShadow: {
        dhe: "0 4px 20px rgba(0, 115, 255, 0.08)",
        "dhe-lg": "0 8px 32px rgba(0, 20, 35, 0.12)",
      },
    },
  },
  plugins: [],
};
