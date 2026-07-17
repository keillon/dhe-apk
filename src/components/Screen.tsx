import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useResponsive } from "@/hooks/useResponsive";
import { PageContainer } from "./PageContainer";

interface ScreenProps extends Omit<ScrollViewProps, "contentContainerStyle"> {
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
  edges?: ("top" | "right" | "bottom" | "left")[];
  children: React.ReactNode;
  className?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** When false, skips PageContainer max-width wrapper. */
  constrainWidth?: boolean;
}

/**
 * Layout padrão responsivo: SafeArea + teclado + scroll + largura máxima.
 * Use em telas de formulário e listas para evitar quebra com teclado / telas pequenas.
 */
export function Screen({
  title,
  subtitle,
  header,
  scroll = true,
  keyboard = true,
  edges = ["top"],
  children,
  className,
  contentContainerStyle,
  constrainWidth = true,
  ...props
}: ScreenProps) {
  const {
    horizontalPadding,
    scrollBottomPadding,
    keyboardBehavior,
    keyboardVerticalOffset,
    isCompactHeight,
  } = useResponsive();

  const content = (
    <>
      {header}
      {(title || subtitle) && (
        <View className={isCompactHeight ? "mb-4" : "mb-6"}>
          {title ? (
            <Text
              className={`font-bold text-dhe-text ${isCompactHeight ? "text-xl" : "text-2xl"}`}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text className="mt-1 text-base text-dhe-textSecondary">{subtitle}</Text>
          ) : null}
        </View>
      )}
      {children}
    </>
  );

  const body = constrainWidth ? (
    <PageContainer className="w-full">{content}</PageContainer>
  ) : (
    content
  );

  const paddedStyle = [
    {
      paddingHorizontal: horizontalPadding,
      paddingTop: 12,
      paddingBottom: scrollBottomPadding,
      flexGrow: 1,
    },
    contentContainerStyle,
  ];

  const main = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={paddedStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      {...props}
    >
      {body}
    </ScrollView>
  ) : (
    <View className="flex-1" style={paddedStyle}>
      {body}
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 bg-dhe-bg ${className ?? ""}`} edges={edges}>
      {keyboard ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={keyboardBehavior}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          {main}
        </KeyboardAvoidingView>
      ) : (
        main
      )}
    </SafeAreaView>
  );
}
