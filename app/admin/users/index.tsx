import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserPlus, ChevronRight } from "lucide-react-native";
import {
  BackHeader,
  Button,
  Card,
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
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
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
              <Pressable
                key={user.id}
                onPress={() => router.push(`/admin/users/edit/${user.id}` as Href)}
              >
                <Card className="mb-3 flex-row items-center gap-4">
                  <View className="min-w-0 flex-1">
                    <Text className="font-semibold text-dhe-text" numberOfLines={1}>
                      {user.nome}
                    </Text>
                    <Text className="mt-1 text-sm text-dhe-textSecondary" numberOfLines={1}>
                      {user.email}
                    </Text>
                    <Text className="mt-1 text-xs text-dhe-textMuted" numberOfLines={1}>
                      {user.cargo} • {user.empresa}
                    </Text>
                    <Text className="mt-2 text-xs font-bold text-dhe-primary">
                      {user.role === "admin" ? "Administrador" : "Técnico"}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </Card>
              </Pressable>
            ))
          )}
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
