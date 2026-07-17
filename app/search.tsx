import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import {
  BackHeader,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  PageContainer,
  StatusBadge,
} from "@/components";
import { useEquipments, useResponsive } from "@/hooks";
import { colors } from "@/theme";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: equipments, isLoading, error, refetch } = useEquipments();
  const { horizontalPadding, screenTopPadding, scrollBottomPadding } = useResponsive();

  const results = useMemo(() => {
    const list = equipments ?? [];
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return list;

    return list.filter((equipment) => {
      const haystack = [
        equipment.qr_code,
        equipment.patrimonio,
        equipment.nome,
        equipment.empresa,
        equipment.localizacao,
        equipment.cliente?.empresa,
        equipment.cliente?.nome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(trimmed);
    });
  }, [equipments, query]);

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: screenTopPadding,
          paddingBottom: scrollBottomPadding,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PageContainer>
          <BackHeader fallback="/(tabs)" />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Buscar equipamento</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            Todos os equipamentos já aparecem abaixo. Filtre por QR, patrimônio, nome ou cliente.
          </Text>

          <Input
            label="Filtrar"
            value={query}
            onChangeText={setQuery}
            placeholder="Ex: DHE-0001, patrimônio ou cliente"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text className="mb-4 text-xs font-semibold uppercase tracking-wide text-dhe-textMuted">
            {results.length} equipamento{results.length === 1 ? "" : "s"}
          </Text>

          {results.length === 0 ? (
            <EmptyState
              title="Nenhum resultado"
              description={
                query.trim()
                  ? "Tente outro termo de busca."
                  : "Nenhum equipamento cadastrado."
              }
            />
          ) : (
            results.map((equipment) => (
              <Pressable
                key={equipment.id}
                onPress={() => router.push(`/equipment/${equipment.id}`)}
              >
                <Card className="mb-4 flex-row items-center gap-3">
                  <View className="min-w-0 flex-1">
                    <View className="mb-1 flex-row items-center justify-between gap-2">
                      <Text className="flex-1 font-semibold text-dhe-text" numberOfLines={1}>
                        {equipment.nome}
                      </Text>
                      <StatusBadge status={equipment.status} />
                    </View>
                    <Text className="text-xs text-dhe-textSecondary">
                      {equipment.qr_code} • Patrimônio {equipment.patrimonio}
                    </Text>
                    <Text className="mt-1 text-xs text-dhe-textMuted">
                      {equipment.cliente?.empresa ?? equipment.empresa}
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
