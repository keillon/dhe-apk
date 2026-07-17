import { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Lock } from "lucide-react-native";
import { Button, Input, Screen } from "@/components";
import { api } from "@/services/api";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage, getRouteParam } from "@/utils";
import { colors } from "@/theme";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = getRouteParam(params.token);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!token) {
      feedback.toast.error("Token inválido ou ausente.");
      return;
    }

    if (password.length < 6) {
      feedback.toast.warning("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      feedback.toast.warning("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await api.confirmResetPassword(token, password);
      setDone(true);
      feedback.toast.success("Senha redefinida com sucesso!");
    } catch (error) {
      feedback.toast.error(getApiErrorMessage(error, "Não foi possível redefinir a senha."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={["top", "bottom"]} contentContainerStyle={{ justifyContent: "center" }}>
      <Text className="mb-2 text-2xl font-bold text-dhe-text">Redefinir senha</Text>
      <Text className="mb-8 text-base text-dhe-textSecondary">
        Informe sua nova senha para acessar o DHE.
      </Text>

      {done ? (
        <View className="rounded-2xl border border-dhe-success/40 bg-dhe-success/10 p-6">
          <Text className="mb-4 text-center text-base text-dhe-success">
            Senha atualizada. Faça login com a nova senha.
          </Text>
          <Button title="Ir para login" onPress={() => router.replace("/(auth)/login")} fullWidth />
        </View>
      ) : (
        <>
          <Input
            label="Nova senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Input
            label="Confirmar senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Button
            title="Redefinir senha"
            onPress={() => void handleReset()}
            loading={loading}
            fullWidth
            size="lg"
            icon={<Lock size={18} color={colors.bg} />}
          />
        </>
      )}
    </Screen>
  );
}
