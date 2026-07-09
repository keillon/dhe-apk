import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ChevronRight, Camera, PenLine } from "lucide-react-native";
import { Card, Loading, ErrorState, EmptyState } from "@/components";
import { useInspections, useEquipment } from "@/hooks";
import {
  formatDateTime,
  getContaminationColor,
  getContaminationLabel,
} from "@/utils";
import { colors } from "@/theme";

const THUMB_SIZE = 48;

export default function HistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: equipment } = useEquipment(id);
  const { data: inspections, isLoading, error, refetch } = useInspections(id);

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <View className="px-5 pt-2">
        <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center">
          <ArrowLeft size={20} color={colors.text} />
          <Text className="ml-2 text-dhe-text">Voltar</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-dhe-text">Histórico</Text>
        <Text className="mb-5 text-sm text-dhe-textSecondary">
          {equipment?.nome ?? "Equipamento"}
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        {inspections?.length === 0 ? (
          <EmptyState
            title="Nenhuma inspeção registrada"
            description="Realize a primeira inspeção deste equipamento."
          />
        ) : (
          inspections?.map((inspection) => {
            const fotos = inspection.fotos ?? [];
            const fotoCount = fotos.length;
            const previewFotos = fotos.slice(0, 3);

            return (
              <Pressable
                key={inspection.id}
                onPress={() => router.push(`/inspection/${inspection.id}`)}
              >
                <Card className="mb-3">
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-dhe-text">
                      {formatDateTime(inspection.created_at)}
                    </Text>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </View>
                  <Text className="mb-2 text-xs text-dhe-textSecondary">
                    Técnico: {inspection.tecnico?.nome ?? "—"}
                  </Text>
                  <View className="flex-row gap-4">
                    <Text className="text-xs text-dhe-textSecondary">
                      Óleo: {inspection.nivel_oleo}%
                    </Text>
                    <Text
                      className="text-xs font-medium"
                      style={{ color: getContaminationColor(inspection.contaminacao_oleo) }}
                    >
                      {getContaminationLabel(inspection.contaminacao_oleo)}
                    </Text>
                  </View>
                  {inspection.complemento && (
                    <Text className="mt-2 text-xs text-dhe-textMuted" numberOfLines={2}>
                      {inspection.complemento}
                    </Text>
                  )}
                  {(fotoCount > 0 || inspection.assinatura_url) && (
                    <View className="mt-3">
                      {previewFotos.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                          {previewFotos.map((foto) => (
                            <Image
                              key={foto.id}
                              source={{ uri: foto.url }}
                              style={{
                                width: THUMB_SIZE,
                                height: THUMB_SIZE,
                                borderRadius: 8,
                                marginRight: 6,
                              }}
                              contentFit="cover"
                            />
                          ))}
                          {fotoCount > 3 && (
                            <View
                              style={{
                                width: THUMB_SIZE,
                                height: THUMB_SIZE,
                                borderRadius: 8,
                                backgroundColor: colors.elevated,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text className="text-xs font-bold text-dhe-textMuted">
                                +{fotoCount - 3}
                              </Text>
                            </View>
                          )}
                        </ScrollView>
                      )}
                      <View className="flex-row items-center gap-3">
                        {fotoCount > 0 && (
                          <View className="flex-row items-center">
                            <Camera size={12} color={colors.textMuted} />
                            <Text className="ml-1 text-xs text-dhe-textMuted">
                              {fotoCount} foto{fotoCount > 1 ? "s" : ""}
                            </Text>
                          </View>
                        )}
                        {inspection.assinatura_url && (
                          <View className="flex-row items-center">
                            <PenLine size={12} color={colors.primary} />
                            <Text className="ml-1 text-xs text-dhe-primary">Assinatura</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
