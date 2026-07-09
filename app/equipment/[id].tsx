import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ClipboardPlus, History, MapPin, Building2, Calendar } from "lucide-react-native";
import { Image } from "expo-image";
import { Button, Card, StatusBadge, Loading, ErrorState, RefreshableScrollView } from "@/components";
import { useEquipment } from "@/hooks";
import { formatDate } from "@/utils";
import { colors } from "@/theme";

export default function EquipmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: equipment, isLoading, error, refetch } = useEquipment(id);

  if (isLoading) return <Loading fullScreen />;
  if (error || !equipment) return <ErrorState onRetry={refetch} message="Equipamento não encontrado." />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <RefreshableScrollView showsVerticalScrollIndicator={false} onRefresh={refetch}>
        <View className="bg-dhe-surface px-5 pb-6 pt-2">
          <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center">
            <ArrowLeft size={20} color={colors.text} />
            <Text className="ml-2 text-dhe-text">Voltar</Text>
          </Pressable>

          <View className="h-48 items-center justify-center rounded-2xl bg-dhe-elevated">
            {equipment.foto_url ? (
              <Image
                source={{ uri: equipment.foto_url }}
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
        </View>

        <View className="-mt-4 px-5 pb-8">
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
                <Text className="ml-3 text-sm text-dhe-textSecondary">
                  {equipment.cliente?.empresa ?? equipment.empresa}
                </Text>
              </View>
              <View className="flex-row items-center">
                <MapPin size={16} color={colors.textMuted} />
                <Text className="ml-3 text-sm text-dhe-textSecondary">{equipment.localizacao}</Text>
              </View>
              <View className="flex-row items-center">
                <Calendar size={16} color={colors.textMuted} />
                <Text className="ml-3 text-sm text-dhe-textSecondary">
                  Última inspeção: {formatDate(equipment.ultima_inspecao)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Calendar size={16} color={colors.primary} />
                <Text className="ml-3 text-sm font-medium text-dhe-primary">
                  Próxima manutenção: {formatDate(equipment.proxima_manutencao)}
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
              <View key={label} className="mb-2 flex-row justify-between border-b border-dhe-border py-3">
                <Text className="text-sm text-dhe-textMuted">{label}</Text>
                <Text className="text-sm font-medium text-dhe-text">{value}</Text>
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
            onPress={() => router.push(`/equipment/history/${equipment.id}`)}
            fullWidth
            size="lg"
            icon={<History size={20} color={colors.primary} />}
          />
        </View>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
