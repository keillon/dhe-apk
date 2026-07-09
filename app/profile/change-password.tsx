import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock } from "lucide-react-native";
import { BackHeader, Button, Card, Input, Loading } from "@/components";
import { api } from "@/services/api";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage } from "@/utils";
import { colors } from "@/theme";

export default function ChangePasswordScreen() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!senhaAtual || !senhaNova || !confirmarSenha) {
      feedback.toast.warning("Preencha todos os campos.");
      return;
    }

    if (senhaNova.length < 6) {
      feedback.toast.warning("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senhaNova !== confirmarSenha) {
      feedback.toast.warning("A confirmação da senha não confere.");
      return;
    }

    const confirmed = await feedback.confirm(
      "Alterar senha",
      "Confirma a alteração da sua senha?",
      "Alterar"
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await api.changePassword({
        senha_atual: senhaAtual,
        senha_nova: senhaNova,
      });
      feedback.toast.success("Senha alterada com sucesso!");
      setSenhaAtual("");
      setSenhaNova("");
      setConfirmarSenha("");
    } catch (error) {
      feedback.toast.error(getApiErrorMessage(error, "Não foi possível alterar a senha."));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BackHeader title="Alterar senha" fallback="/(tabs)/profile" />

        <Text className="mb-1 text-2xl font-bold text-dhe-text">Segurança</Text>
        <Text className="mb-6 text-sm text-dhe-textSecondary">
          Defina uma nova senha para sua conta.
        </Text>

        <Card className="mb-6">
          <Input
            label="Senha atual"
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            secureTextEntry
            placeholder="••••••••"
          />
          <Input
            label="Nova senha"
            value={senhaNova}
            onChangeText={setSenhaNova}
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
          />
          <Input
            label="Confirmar nova senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
            placeholder="Repita a nova senha"
          />
        </Card>

        <Button
          title="Salvar nova senha"
          fullWidth
          size="lg"
          onPress={handleSave}
          icon={<Lock size={18} color={colors.bg} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
