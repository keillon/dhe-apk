import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackHeader, Button, Input, Loading, PageContainer } from "@/components";
import { useCreateClient, useRequireAdmin } from "@/hooks";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage } from "@/utils";

export default function NewClientScreen() {
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const createClient = useCreateClient();

  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const handleSubmit = async () => {
    if (!nome.trim() || !empresa.trim()) {
      feedback.toast.error("Nome e empresa são obrigatórios.");
      return;
    }

    try {
      const client = await createClient.mutateAsync({
        nome: nome.trim(),
        empresa: empresa.trim(),
        email: email.trim() || undefined,
        telefone: telefone.trim() || undefined,
      });
      feedback.toast.success("Cliente cadastrado.");
      router.replace(`/client/${client.id}`);
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao cadastrar cliente."));
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <PageContainer>
          <BackHeader fallback="/(tabs)/clients" />

          <Text className="mb-6 text-2xl font-bold text-dhe-text">Novo cliente</Text>

          <Input label="Nome do contato" value={nome} onChangeText={setNome} />
          <Input label="Empresa" value={empresa} onChangeText={setEmpresa} />
          <Input
            label="E-mail (opcional)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Telefone (opcional)"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />

          <Button
            title="Cadastrar cliente"
            onPress={handleSubmit}
            loading={createClient.isPending}
            fullWidth
            size="lg"
          />
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
