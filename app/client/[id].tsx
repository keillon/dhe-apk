import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Wrench, ChevronRight } from "lucide-react-native";
import { Card, Loading, ErrorState, EmptyState } from "@/components";
import { useClient, useEquipments } from "@/hooks";
import { colors } from "@/theme";

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: client, isLoading, error, refetch } = useClient(id);
  const { data: equipments } = useEquipments();

  const clientEquipments = equipments?.filter((e) => e.cliente_id === id);

  if (isLoading) return <Loading fullScreen />;
  if (error || !client) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center pt-2">
          <ArrowLeft size={20} color={colors.text} />
          <Text className="ml-2 text-dhe-text">Voltar</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-dhe-text">{client.empresa}</Text>
        <Text className="mb-6 text-sm text-dhe-textSecondary">
          {client.nome} {client.telefone ? `• ${client.telefone}` : ""}
        </Text>

        <Text className="mb-4 text-lg font-bold text-dhe-text">
          Equipamentos ({clientEquipments?.length ?? 0})
        </Text>

        {clientEquipments?.length === 0 ? (
          <EmptyState title="Nenhum equipamento" description="Este cliente ainda não possui equipamentos cadastrados." />
        ) : (
          clientEquipments?.map((eq) => (
            <Pressable
              key={eq.id}
              onPress={() => router.push(`/equipment/${eq.id}`)}
            >
              <Card className="mb-3 flex-row items-center">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-dhe-primary/20">
                  <Wrench size={22} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-dhe-text">{eq.nome}</Text>
                  <Text className="mt-1 text-xs text-dhe-textSecondary">
                    {eq.qr_code} • {eq.localizacao}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
