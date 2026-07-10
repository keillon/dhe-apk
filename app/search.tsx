import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, ChevronRight } from "lucide-react-native";
import {
  BackHeader,
  Button,
  Card,
  EmptyState,
  Input,
  Loading,
  PageContainer,
  StatusBadge,
} from "@/components";
import { api } from "@/services/api";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage } from "@/utils";
import type { Equipment } from "@/types";
import { colors } from "@/theme";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Equipment[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      feedback.toast.warning("Informe ao menos 2 caracteres.");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const data = await api.searchEquipments(trimmed);
      setResults(data);
    } catch (error) {
      feedback.toast.error(getApiErrorMessage(error, "Erro ao buscar equipamentos."));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <View className="flex-1 px-5 pb-8 pt-2">
        <PageContainer>
          <BackHeader fallback="/(tabs)" />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Buscar equipamento</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            Pesquise por QR Code, patrimônio, nome ou cliente
          </Text>

          <Input
            label="Termo de busca"
            value={query}
            onChangeText={setQuery}
            placeholder="Ex: DHE-0001, patrimônio ou cliente"
            autoCapitalize="characters"
            onSubmitEditing={() => void handleSearch()}
          />

          <Button
            title="Buscar"
            onPress={() => void handleSearch()}
            loading={loading}
            fullWidth
            className="mb-6"
            icon={<Search size={18} color={colors.bg} />}
          />

          {loading ? (
            <Loading />
          ) : searched && results.length === 0 ? (
            <EmptyState
              title="Nenhum resultado"
              description="Tente outro termo de busca."
            />
          ) : (
            results.map((equipment) => (
              <Pressable
                key={equipment.id}
                onPress={() => router.push(`/equipment/${equipment.id}`)}
              >
                <Card className="mb-3 flex-row items-center gap-3">
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
      </View>
    </SafeAreaView>
  );
}
