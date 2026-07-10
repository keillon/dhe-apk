import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Wrench, ChevronRight, Pencil, Plus } from "lucide-react-native";
import { Button, Card, Loading, ErrorState, EmptyState, DisplayImage, AuditLogList } from "@/components";
import { useClient, useEquipments, useRequireAdmin } from "@/hooks";
import { colors } from "@/theme";
import { resolveMediaUrl } from "@/utils";

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { allowed } = useRequireAdmin();
  const { data: client, isLoading, error, refetch } = useClient(id);
  const { data: equipments } = useEquipments();

  const clientEquipments = equipments?.filter((e) => e.cliente_id === id);

  if (isLoading) return <Loading fullScreen />;
  if (error || !client) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center pt-2">
          <Text className="text-dhe-text">← Voltar</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-dhe-text">{client.empresa}</Text>
        <Text className="mb-4 text-sm text-dhe-textSecondary">
          {client.nome} {client.telefone ? `• ${client.telefone}` : ""}
        </Text>

        {allowed && (
          <View className="mb-6 flex-row gap-3">
            <Button
              title="Editar"
              variant="outline"
              size="sm"
              className="flex-1"
              icon={<Pencil size={16} color={colors.primary} />}
              onPress={() => router.push(`/client/edit/${client.id}`)}
            />
            <Button
              title="Novo equipamento"
              size="sm"
              className="flex-1"
              icon={<Plus size={16} color={colors.bg} />}
              onPress={() =>
                router.push({
                  pathname: "/equipment/new",
                  params: { clientId: client.id },
                })
              }
            />
          </View>
        )}

        <Text className="mb-4 text-lg font-bold text-dhe-text">
          Equipamentos ({clientEquipments?.length ?? 0})
        </Text>

        {clientEquipments?.length === 0 ? (
          <EmptyState
            title="Nenhum equipamento"
            description="Cadastre o primeiro equipamento deste cliente."
          />
        ) : (
          clientEquipments?.map((eq) => (
            <Pressable
              key={eq.id}
              onPress={() => router.push(`/equipment/${eq.id}`)}
            >
              <Card className="mb-3 flex-row items-center">
                <View className="mr-4 h-12 w-12 overflow-hidden rounded-xl bg-dhe-primary/20">
                  {eq.foto_url ? (
                    <DisplayImage
                      uri={resolveMediaUrl(eq.foto_url)}
                      style={{ width: 48, height: 48 }}
                    />
                  ) : (
                    <View className="h-12 w-12 items-center justify-center">
                      <Wrench size={22} color={colors.primary} />
                    </View>
                  )}
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

        {allowed ? (
          <Card className="mt-6">
            <Text className="mb-4 text-sm font-bold text-dhe-text">Histórico de alterações</Text>
            <AuditLogList entidade="cliente" entidadeId={client.id} />
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
