import { View, type ViewProps } from "react-native";

interface PageContainerProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "", ...props }: PageContainerProps) {
  return (
    <View className={`w-full max-w-xl self-center ${className}`} {...props}>
      {children}
    </View>
  );
}
