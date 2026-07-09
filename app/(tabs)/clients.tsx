import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Building2, ChevronRight } from "lucide-react-native";
import { Card, Input, Loading, ErrorState, EmptyState } from "@/components";
import { useClients, useEquipments } from "@/hooks";
import { colors } from "@/theme";

export default function ClientsScreen() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { data: clients, isLoading, error, refetch } = useClients();
  const { data: equipments } = useEquipments();

  const filtered = clients?.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.empresa.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-surface" edges={["top"]}>
      <View className="px-6 pt-4">
        <Text className="mb-1 text-2xl font-bold text-dhe-dark">Clientes</Text>
        <Text className="mb-4 text-sm text-dhe-muted">
          Empresas atendidas pela DHE
        </Text>

        <View className="relative mb-4">
          <Input
            placeholder="Pesquisar cliente..."
            value={search}
            onChangeText={setSearch}
            className="mb-0"
          />
          <Search
            size={18}
            color={colors.muted}
            style={{ position: "absolute", right: 16, top: 16 }}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {filtered?.length === 0 ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Tente outro termo de busca."
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
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-dhe-primary/10">
                    <Building2 size={22} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-dhe-dark">{client.empresa}</Text>
                    <Text className="text-xs text-dhe-muted">
                      {client.nome} • {eqCount} equipamento(s)
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.muted} />
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
