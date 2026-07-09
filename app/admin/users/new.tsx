import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackHeader, Button, Input, Loading, PageContainer, SelectField } from "@/components";
import { useCreateUser, useRequireAdmin } from "@/hooks";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage } from "@/utils";
import type { UserRole } from "@/types";

const ROLE_OPTIONS = [
  { id: "tecnico" as const, label: "Técnico" },
  { id: "admin" as const, label: "Administrador" },
];

export default function NewUserScreen() {
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const createUser = useCreateUser();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargo, setCargo] = useState("Técnico Hidráulico");
  const [empresa, setEmpresa] = useState("DHE Componentes Hidráulicos");
  const [role, setRole] = useState<UserRole>("tecnico");

  const handleSubmit = async () => {
    if (!nome.trim() || !email.trim() || password.length < 6) {
      feedback.toast.error("Preencha nome, e-mail e senha (mín. 6 caracteres).");
      return;
    }

    try {
      await createUser.mutateAsync({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        password,
        cargo: cargo.trim(),
        empresa: empresa.trim(),
        role,
      });
      feedback.toast.success("Usuário criado com sucesso.");
      router.replace("/admin/users/index" as Href);
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao criar usuário."));
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <PageContainer>
          <BackHeader fallback={"/admin/users/index" as Href} />

          <Text className="mb-6 text-2xl font-bold text-dhe-text">Novo usuário</Text>

          <Input label="Nome completo" value={nome} onChangeText={setNome} />
          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Input label="Cargo" value={cargo} onChangeText={setCargo} />
          <Input label="Empresa" value={empresa} onChangeText={setEmpresa} />
          <SelectField label="Perfil" value={role} options={ROLE_OPTIONS} onChange={setRole} />

          <Button
            title="Criar usuário"
            onPress={handleSubmit}
            loading={createUser.isPending}
            fullWidth
            size="lg"
          />
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
