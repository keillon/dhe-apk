import { View, type ViewProps, type StyleProp, type ViewStyle } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";

interface PageContainerProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/** Conteúdo centralizado com largura máxima em tablets e 100% em celulares. */
export function PageContainer({
  children,
  className = "",
  style,
  ...props
}: PageContainerProps) {
  const { contentMaxWidth, isTablet } = useResponsive();

  return (
    <View
      className={`w-full self-center ${className}`}
      style={[{ maxWidth: isTablet ? contentMaxWidth : "100%", width: "100%" }, style]}
      {...props}
    >
      {children}
    </View>
  );
}
