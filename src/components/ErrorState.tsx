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
    <View className="flex-1 items-center justify-center bg-dhe-bg px-6 py-16">
      <View className="mb-5 rounded-full border border-dhe-danger/30 bg-dhe-card p-6">
        <AlertCircle size={48} color={colors.danger} />
      </View>
      <Text className="mb-2 text-center text-xl font-bold text-dhe-text">Algo deu errado</Text>
      <Text className="mb-6 text-center text-base leading-6 text-dhe-textSecondary">
        {message}
      </Text>
      {onRetry && <Button title="Tentar novamente" onPress={onRetry} variant="outline" />}
    </View>
  );
}
