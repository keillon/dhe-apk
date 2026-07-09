export const colors = {
  primary: "#0073FF",
  primaryDark: "#0056CC",
  dark: "#001423",
  light: "#7CBFE0",
  lightMuted: "#5396B7",
  muted: "#5396B7",
  white: "#FFFFFF",
  surface: "#F5F9FC",
  surfaceDark: "#0A1F33",
  card: "#FFFFFF",
  cardDark: "#0D2840",
  border: "#E2EEF5",
  borderDark: "#1A3A5C",
  text: "#001423",
  textSecondary: "#5396B7",
  textLight: "#7CBFE0",
  textDark: "#F5F9FC",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  overlay: "rgba(0, 20, 35, 0.6)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#0073FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#001423",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: "#001423",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: "500" as const, lineHeight: 18 },
} as const;
