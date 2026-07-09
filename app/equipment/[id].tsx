import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ClipboardPlus, History, MapPin, Building2, Calendar } from "lucide-react-native";
import { Image } from "expo-image";
import { Button, Card, StatusBadge, Loading, ErrorState } from "@/components";
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
    <SafeAreaView className="flex-1 bg-dhe-surface" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-dhe-dark px-4 pb-6 pt-2">
          <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center">
            <ArrowLeft size={20} color="#fff" />
            <Text className="ml-2 text-white">Voltar</Text>
          </Pressable>

          <View className="h-48 items-center justify-center rounded-2xl bg-white/10">
            {equipment.foto_url ? (
              <Image
                source={{ uri: equipment.foto_url }}
                style={{ width: "100%", height: 192, borderRadius: 16 }}
                contentFit="cover"
              />
            ) : (
              <View className="items-center">
                <Text className="text-6xl">⚙️</Text>
                <Text className="mt-2 text-sm text-dhe-light">{equipment.qr_code}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="px-6 -mt-4">
          <Card className="mb-4">
            <View className="mb-2 flex-row items-start justify-between">
              <Text className="flex-1 text-xl font-bold text-dhe-dark">
                {equipment.nome}
              </Text>
              <StatusBadge status={equipment.status} />
            </View>

            <View className="mt-3 gap-2">
              <View className="flex-row items-center">
                <Building2 size={16} color={colors.muted} />
                <Text className="ml-2 text-sm text-dhe-muted">
                  {equipment.cliente?.empresa ?? equipment.empresa}
                </Text>
              </View>
              <View className="flex-row items-center">
                <MapPin size={16} color={colors.muted} />
                <Text className="ml-2 text-sm text-dhe-muted">{equipment.localizacao}</Text>
              </View>
              <View className="flex-row items-center">
                <Calendar size={16} color={colors.muted} />
                <Text className="ml-2 text-sm text-dhe-muted">
                  Última inspeção: {formatDate(equipment.ultima_inspecao)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Calendar size={16} color={colors.primary} />
                <Text className="ml-2 text-sm font-medium text-dhe-primary">
                  Próxima manutenção: {formatDate(equipment.proxima_manutencao)}
                </Text>
              </View>
            </View>
          </Card>

          <Card className="mb-4">
            <Text className="mb-3 text-sm font-bold text-dhe-dark">Detalhes</Text>
            {[
              ["Patrimônio", equipment.patrimonio],
              ["Marca", equipment.marca],
              ["Modelo", equipment.modelo],
              ["Nº Série", equipment.numero_serie],
              ["Ano", String(equipment.ano)],
              ["QR Code", equipment.qr_code],
            ].map(([label, value]) => (
              <View key={label} className="mb-2 flex-row justify-between border-b border-dhe-border py-2">
                <Text className="text-sm text-dhe-muted">{label}</Text>
                <Text className="text-sm font-medium text-dhe-dark">{value}</Text>
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
            icon={<ClipboardPlus size={20} color="#fff" />}
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
      </ScrollView>
    </SafeAreaView>
  );
}
