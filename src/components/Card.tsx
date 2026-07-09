import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  className?: string;
  elevated?: boolean;
}

export function Card({ children, className, elevated = true, ...props }: CardProps) {
  return (
    <View
      className={`rounded-2xl bg-white p-4 dark:bg-dhe-dark ${
        elevated ? "shadow-dhe" : ""
      } ${className ?? ""}`}
      {...props}
    >
      {children}
    </View>
  );
}
