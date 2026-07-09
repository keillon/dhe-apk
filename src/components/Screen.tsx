import { ScrollView, Text, View, type ScrollViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenProps extends ScrollViewProps {
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  scroll?: boolean;
  children: React.ReactNode;
}

export function Screen({
  title,
  subtitle,
  header,
  scroll = true,
  children,
  className,
  ...props
}: ScreenProps & { className?: string }) {
  const content = (
    <>
      {header}
      {(title || subtitle) && (
        <View className="mb-6">
          {title && <Text className="text-2xl font-bold text-dhe-text">{title}</Text>}
          {subtitle && (
            <Text className="mt-1 text-base text-dhe-textSecondary">{subtitle}</Text>
          )}
        </View>
      )}
      {children}
    </>
  );

  if (!scroll) {
    return (
      <SafeAreaView className={`flex-1 bg-dhe-bg ${className ?? ""}`} edges={["top"]}>
        <View className="flex-1 px-5 pt-4">{content}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 bg-dhe-bg ${className ?? ""}`} edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
        {...props}
      >
        {content}
      </ScrollView>
    </SafeAreaView>
  );
}
