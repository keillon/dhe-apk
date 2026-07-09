import { Text, View } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { Button } from "./Button";
import { colors } from "@/theme";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Ocorreu um erro ao carregar os dados.",
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="mb-4 rounded-full bg-red-50 p-6">
        <AlertCircle size={48} color={colors.danger} />
      </View>
      <Text className="mb-2 text-center text-lg font-semibold text-dhe-dark dark:text-white">
        Algo deu errado
      </Text>
      <Text className="mb-6 text-center text-base text-dhe-muted">{message}</Text>
      {onRetry && <Button title="Tentar novamente" onPress={onRetry} variant="outline" />}
    </View>
  );
}
