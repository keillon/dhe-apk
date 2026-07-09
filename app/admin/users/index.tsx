import { ScrollView, Text } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserPlus } from "lucide-react-native";
import {
  BackHeader,
  Button,
  EmptyState,
  ErrorState,
  Loading,
  PageContainer,
} from "@/components";
import { useUsers, useRequireAdmin } from "@/hooks";
import { colors } from "@/theme";

export default function UsersListScreen() {
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: users, isLoading, error, refetch } = useUsers();

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <PageContainer>
          <BackHeader fallback="/(tabs)/manage" />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Usuários</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            Técnicos e administradores do sistema
          </Text>

          <Button
            title="Novo usuário"
            onPress={() => router.push("/admin/users/new")}
            icon={<UserPlus size={18} color={colors.bg} />}
            className="mb-6"
          />

          {users?.length === 0 ? (
            <EmptyState title="Nenhum usuário" description="Cadastre o primeiro usuário." />
          ) : (
            users?.map((user) => (
              <Button
                key={user.id}
                title={`${user.nome} • ${user.role === "admin" ? "Admin" : "Técnico"}`}
                variant="outline"
                onPress={() => router.push(`/admin/users/edit/${user.id}` as Href)}
                className="mb-3"
              />
            ))
          )}
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
