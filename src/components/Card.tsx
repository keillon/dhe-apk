import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  className?: string;
  elevated?: boolean;
}

export function Card({ children, className, elevated = true, ...props }: CardProps) {
  return (
    <View
      className={`rounded-2xl border border-dhe-border bg-dhe-card p-5 ${
        elevated ? "shadow-lg shadow-black/30" : ""
      } ${className ?? ""}`}
      {...props}
    >
      {children}
    </View>
  );
}
