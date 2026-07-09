export const colors = {
  primary: "#3D9EFF",
  primaryDark: "#0073FF",
  bg: "#000A14",
  surface: "#001423",
  card: "#0C2540",
  elevated: "#103050",
  border: "#1E4A73",
  borderLight: "#2D6A9F",
  text: "#FFFFFF",
  textSecondary: "#A8CCE8",
  textMuted: "#6B9ABF",
  success: "#22C55E",
  warning: "#FBBF24",
  danger: "#F87171",
  white: "#FFFFFF",
  overlay: "rgba(0, 10, 20, 0.85)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screen: 20,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const layout = {
  screenPadding: "px-5",
  sectionGap: "mb-6",
  cardPadding: "p-5",
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: "600" as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: "600" as const, lineHeight: 18 },
} as const;
