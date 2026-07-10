import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClipboardPlus, History, MapPin, Building2, Calendar, Pencil, Printer, Trash2 } from "lucide-react-native";
import { Image } from "expo-image";
import {
  Button,
  Card,
  StatusBadge,
  Loading,
  ErrorState,
  RefreshableScrollView,
  BackHeader,
  PageContainer,
} from "@/components";
import { useEquipment, useDeleteEquipment } from "@/hooks";
import { useAuthStore } from "@/store";
import { feedback } from "@/services/feedback";
import { formatDate, getApiErrorMessage, getRouteParam, isAdmin, resolveMediaUrl } from "@/utils";
import { colors } from "@/theme";

export default function EquipmentScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const equipmentId = getRouteParam(params.id);
  const router = useRouter();
  const { user } = useAuthStore();
  const admin = isAdmin(user);
  const { data: equipment, isLoading, isFetching, error, refetch } = useEquipment(equipmentId);
  const deleteEquipment = useDeleteEquipment();

  const handleDelete = async () => {
    if (!equipment) return;

    const confirmed = await feedback.choose(
      "Excluir equipamento",
      `Deseja remover ${equipment.nome}? Remova as inspeções antes, se houver.`,
      [
        { text: "Cancelar", value: "cancel", style: "cancel" },
        { text: "Excluir", value: "delete", style: "destructive" },
      ]
    );

    if (confirmed !== "delete") return;

    try {
      await deleteEquipment.mutateAsync(equipment.id);
      feedback.toast.success("Equipamento removido.");
      router.replace("/(tabs)");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao remover equipamento."));
    }
  };

  if (!equipmentId || isLoading || (isFetching && !equipment)) {
    return <Loading fullScreen />;
  }

  if (error || !equipment) {
    return (
      <ErrorState
        onRetry={refetch}
        message={error instanceof Error ? error.message : "Equipamento não encontrado."}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <RefreshableScrollView showsVerticalScrollIndicator={false} onRefresh={refetch}>
        <View className="bg-dhe-surface px-5 pb-6 pt-2">
          <PageContainer>
            <BackHeader fallback="/(tabs)" />

            <View className="h-48 items-center justify-center overflow-hidden rounded-2xl bg-dhe-elevated">
              {equipment.foto_url ? (
                <Image
                  source={{ uri: resolveMediaUrl(equipment.foto_url) }}
                  style={{ width: "100%", height: 192, borderRadius: 16 }}
                  contentFit="cover"
                />
              ) : (
                <View className="items-center">
                  <Text className="text-6xl">⚙️</Text>
                  <Text className="mt-2 text-sm text-dhe-textSecondary">{equipment.qr_code}</Text>
                </View>
              )}
            </View>
          </PageContainer>
        </View>

        <View className="-mt-4 px-5 pb-8">
          <PageContainer>
            <Card className="mb-4">
              <View className="mb-3 flex-row items-start justify-between">
                <Text className="flex-1 pr-3 text-xl font-bold text-dhe-text">
                  {equipment.nome}
                </Text>
                <StatusBadge status={equipment.status} />
              </View>

              <View className="mt-2 gap-3">
                <View className="flex-row items-center">
                  <Building2 size={16} color={colors.textMuted} />
                  <Text className="ml-3 flex-1 text-sm text-dhe-textSecondary">
                    {equipment.cliente?.empresa ?? equipment.empresa}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MapPin size={16} color={colors.textMuted} />
                  <Text className="ml-3 flex-1 text-sm text-dhe-textSecondary">
                    {equipment.localizacao}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Calendar size={16} color={colors.textMuted} />
                  <Text className="ml-3 flex-1 text-sm text-dhe-textSecondary">
                    Última inspeção: {formatDate(equipment.ultima_inspecao)}
                  </Text>
                </View>
              </View>
            </Card>

            <Card className="mb-4">
              <Text className="mb-4 text-sm font-bold text-dhe-text">Detalhes</Text>
              {[
                ["Patrimônio", equipment.patrimonio],
                ["Marca", equipment.marca],
                ["Modelo", equipment.modelo],
                ["Nº Série", equipment.numero_serie],
                ["Ano", String(equipment.ano)],
                ["QR Code", equipment.qr_code],
              ].map(([label, value]) => (
                <View
                  key={label}
                  className="mb-2 flex-row justify-between border-b border-dhe-border py-3"
                >
                  <Text className="text-sm text-dhe-textMuted">{label}</Text>
                  <Text className="max-w-[55%] text-right text-sm font-medium text-dhe-text">
                    {value}
                  </Text>
                </View>
              ))}
            </Card>

            <Button
              title="Nova Inspeção"
              onPress={() =>
                router.push({
                  pathname: "/inspection/new",
                  params: { equipmentId: equipment.id },
                })
              }
              fullWidth
              size="lg"
              icon={<ClipboardPlus size={20} color={colors.bg} />}
              className="mb-3"
            />

            <Button
              title="Histórico"
              variant="outline"
              onPress={() => router.push(`/equipment/history/${equipmentId}`)}
              fullWidth
              size="lg"
              icon={<History size={20} color={colors.primary} />}
              className="mb-3"
            />

            {admin && (
              <>
                <Button
                  title="Imprimir QR Code"
                  variant="secondary"
                  onPress={() => router.push(`/qrcodes/print/${equipment.id}`)}
                  fullWidth
                  size="lg"
                  icon={<Printer size={20} color={colors.text} />}
                  className="mb-3"
                />
                <Button
                  title="Editar equipamento"
                  variant="outline"
                  onPress={() => router.push(`/equipment/edit/${equipment.id}`)}
                  fullWidth
                  size="lg"
                  icon={<Pencil size={20} color={colors.primary} />}
                  className="mb-3"
                />
                <Button
                  title="Excluir equipamento"
                  variant="outline"
                  onPress={handleDelete}
                  loading={deleteEquipment.isPending}
                  fullWidth
                  size="lg"
                  icon={<Trash2 size={20} color={colors.danger} />}
                />
              </>
            )}
          </PageContainer>
        </View>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
