import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2 } from "lucide-react-native";
import {
  BackHeader,
  Button,
  ErrorState,
  Input,
  Loading,
  PageContainer,
  SelectField,
} from "@/components";
import { useUsers, useUpdateUser, useDeleteUser, useRequireAdmin } from "@/hooks";
import { useAuthStore } from "@/store";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage } from "@/utils";
import { colors } from "@/theme";
import type { UserRole } from "@/types";

const ROLE_OPTIONS = [
  { id: "tecnico" as const, label: "Técnico" },
  { id: "admin" as const, label: "Administrador" },
];

export default function EditUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: users, isLoading, error, refetch } = useUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const user = users?.find((u) => u.id === id);

  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [role, setRole] = useState<UserRole>("tecnico");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!user) return;
    setNome(user.nome);
    setCargo(user.cargo);
    setEmpresa(user.empresa);
    setRole(user.role);
  }, [user]);

  const handleSave = async () => {
    if (!user || !nome.trim()) {
      feedback.toast.error("Nome é obrigatório.");
      return;
    }

    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          nome: nome.trim(),
          cargo: cargo.trim(),
          empresa: empresa.trim(),
          role,
          ...(password.length >= 6 ? { password } : {}),
        },
      });
      feedback.toast.success("Usuário atualizado.");
      router.back();
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao atualizar usuário."));
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    const confirmed = await feedback.choose(
      "Excluir usuário",
      `Deseja remover ${user.nome}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", value: "cancel", style: "cancel" },
        { text: "Excluir", value: "delete", style: "destructive" },
      ]
    );

    if (confirmed !== "delete") return;

    try {
      await deleteUser.mutateAsync(user.id);
      feedback.toast.success("Usuário removido.");
      router.replace("/admin/users" as Href);
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao remover usuário."));
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;
  if (!user) return <ErrorState message="Usuário não encontrado." onRetry={refetch} />;

  const isSelf = currentUser?.id === user.id;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <PageContainer>
          <BackHeader fallback={"/admin/users" as Href} />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Editar usuário</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">{user.email}</Text>

          <Input label="Nome completo" value={nome} onChangeText={setNome} />
          <Input label="Cargo" value={cargo} onChangeText={setCargo} />
          <Input label="Empresa" value={empresa} onChangeText={setEmpresa} />
          <SelectField label="Perfil" value={role} options={ROLE_OPTIONS} onChange={setRole} />
          <Input
            label="Nova senha (opcional)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
          />

          <Button
            title="Salvar alterações"
            onPress={handleSave}
            loading={updateUser.isPending}
            fullWidth
            size="lg"
            className="mb-3"
          />

          {!isSelf && (
            <Button
              title="Excluir usuário"
              variant="outline"
              onPress={handleDelete}
              loading={deleteUser.isPending}
              fullWidth
              icon={<Trash2 size={18} color={colors.danger} />}
            />
          )}
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
