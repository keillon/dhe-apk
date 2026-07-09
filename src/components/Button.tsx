import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import { colors } from "@/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: "bg-dhe-primary", text: "text-white" },
  secondary: { bg: "bg-dhe-dark", text: "text-white" },
  outline: { bg: "bg-transparent border-2 border-dhe-primary", text: "text-dhe-primary" },
  danger: { bg: "bg-red-500", text: "text-white" },
  ghost: { bg: "bg-transparent", text: "text-dhe-primary" },
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5",
  md: "px-6 py-4",
  lg: "px-8 py-5",
};

const textSizes: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  const v = variantStyles[variant];

  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-2xl ${v.bg} ${sizeStyles[size]} ${
        fullWidth ? "w-full" : ""
      } ${disabled || loading ? "opacity-50" : "active:opacity-80"} ${className ?? ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? colors.primary : "#fff"} />
      ) : (
        <>
          {icon}
          <Text className={`font-semibold ${v.text} ${textSizes[size]} ${icon ? "ml-2" : ""}`}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
