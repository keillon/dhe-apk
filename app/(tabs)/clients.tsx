import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Building2, ChevronRight, Plus } from "lucide-react-native";
import { Card, Input, Loading, ErrorState, EmptyState, PageContainer, Button } from "@/components";
import { useClients, useEquipments, useRequireAdmin } from "@/hooks";
import { colors } from "@/theme";

export default function ClientsScreen() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: clients, isLoading, error, refetch } = useClients();
  const { data: equipments } = useEquipments();

  if (authLoading || !allowed) return <Loading fullScreen />;
  const filtered = clients?.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.empresa.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <View className="px-5 pt-4">
        <Text className="mb-1 text-2xl font-bold text-dhe-text">Clientes</Text>
        <Text className="mb-5 text-sm text-dhe-textSecondary">
          Empresas atendidas pela DHE
        </Text>

        <Button
          title="Novo cliente"
          onPress={() => router.push("/client/new")}
          icon={<Plus size={18} color={colors.bg} />}
          className="mb-4"
        />

        <View className="relative mb-5">
          <Input
            placeholder="Pesquisar cliente..."
            value={search}
            onChangeText={setSearch}
            className="mb-0"
          />
          <Search
            size={18}
            color={colors.textMuted}
            style={{ position: "absolute", right: 16, top: 16 }}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        {filtered?.length === 0 ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Tente outro termo de busca ou cadastre um novo cliente."
          />
        ) : (
          filtered?.map((client) => {
            const eqCount =
              equipments?.filter((e) => e.cliente_id === client.id).length ?? 0;

            return (
              <Pressable
                key={client.id}
                onPress={() => router.push(`/client/${client.id}`)}
              >
                <Card className="mb-3 flex-row items-center">
                  <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-dhe-primary/20">
                    <Building2 size={22} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-dhe-text">{client.empresa}</Text>
                    <Text className="mt-1 text-xs text-dhe-textSecondary">
                      {client.nome} • {eqCount} equipamento(s)
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
