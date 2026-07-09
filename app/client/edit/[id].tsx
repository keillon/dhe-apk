import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2 } from "lucide-react-native";
import { BackHeader, Button, ErrorState, Input, Loading, PageContainer } from "@/components";
import { useClient, useUpdateClient, useDeleteClient, useRequireAdmin } from "@/hooks";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage } from "@/utils";
import { colors } from "@/theme";

export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: client, isLoading, error, refetch } = useClient(id);
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  useEffect(() => {
    if (!client) return;
    setNome(client.nome);
    setEmpresa(client.empresa);
    setEmail(client.email ?? "");
    setTelefone(client.telefone ?? "");
  }, [client]);

  const handleSave = async () => {
    if (!client || !nome.trim() || !empresa.trim()) {
      feedback.toast.error("Nome e empresa são obrigatórios.");
      return;
    }

    try {
      await updateClient.mutateAsync({
        id: client.id,
        data: {
          nome: nome.trim(),
          empresa: empresa.trim(),
          email: email.trim() || undefined,
          telefone: telefone.trim() || undefined,
        },
      });
      feedback.toast.success("Cliente atualizado.");
      router.back();
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao atualizar cliente."));
    }
  };

  const handleDelete = async () => {
    if (!client) return;

    const confirmed = await feedback.choose(
      "Excluir cliente",
      `Deseja remover ${client.empresa}? Remova os equipamentos antes, se houver.`,
      [
        { text: "Cancelar", value: "cancel", style: "cancel" },
        { text: "Excluir", value: "delete", style: "destructive" },
      ]
    );

    if (confirmed !== "delete") return;

    try {
      await deleteClient.mutateAsync(client.id);
      feedback.toast.success("Cliente removido.");
      router.replace("/(tabs)/clients");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao remover cliente."));
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error || !client) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <PageContainer>
          <BackHeader fallback={`/client/${id}`} />

          <Text className="mb-6 text-2xl font-bold text-dhe-text">Editar cliente</Text>

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
            title="Salvar alterações"
            onPress={handleSave}
            loading={updateClient.isPending}
            fullWidth
            size="lg"
            className="mb-3"
          />

          <Button
            title="Excluir cliente"
            variant="outline"
            onPress={handleDelete}
            loading={deleteClient.isPending}
            fullWidth
            icon={<Trash2 size={18} color={colors.danger} />}
          />
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
