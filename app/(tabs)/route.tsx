import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MapPin, RefreshCw, Route } from "lucide-react-native";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  PageContainer,
  RefreshableScrollView,
  StatusBadge,
} from "@/components";
import { api } from "@/services/api";
import { feedback } from "@/services/feedback";
import { formatDate, getApiErrorMessage } from "@/utils";
import { colors } from "@/theme";

export default function RouteScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: route, isLoading, error, refetch } = useQuery({
    queryKey: ["daily-route"],
    queryFn: () => api.getTodayRoute(),
  });

  const visitMutation = useMutation({
    mutationFn: (itemId: string) => api.visitRouteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-route"] });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.regenerateTodayRoute(),
    onSuccess: (data) => {
      queryClient.setQueryData(["daily-route"], data);
      feedback.toast.success("Rota regenerada com sucesso.");
    },
    onError: (err) => {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao regenerar rota."));
    },
  });

  const handleVisit = async (itemId: string) => {
    try {
      await visitMutation.mutateAsync(itemId);
      feedback.toast.success("Visita registrada.");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao registrar visita."));
    }
  };

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  const visitedCount = route?.itens.filter((item) => item.visitado_em).length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4"
        onRefresh={refetch}
      >
        <PageContainer>
          <View className="mb-6 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="mb-1 text-2xl font-bold text-dhe-text">Rota do dia</Text>
              <Text className="text-sm text-dhe-textSecondary">
                {formatDate(route?.data)} • {visitedCount}/{route?.itens.length ?? 0} visitados
              </Text>
            </View>
            <Route size={28} color={colors.primary} />
          </View>

          <Button
            title="Regenerar rota"
            variant="secondary"
            onPress={() => regenerateMutation.mutate()}
            loading={regenerateMutation.isPending}
            fullWidth
            className="mb-6"
            icon={<RefreshCw size={18} color={colors.text} />}
          />

          {(route?.itens.length ?? 0) === 0 ? (
            <EmptyState
              title="Rota vazia"
              description="Nenhum equipamento sugerido para hoje."
            />
          ) : (
            route?.itens.map((item) => {
              const visited = !!item.visitado_em;
              return (
                <Card key={item.id} className="mb-3">
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-xs font-bold uppercase text-dhe-primary">
                      #{item.ordem}
                    </Text>
                    {visited ? (
                      <View className="flex-row items-center">
                        <CheckCircle2 size={16} color={colors.success} />
                        <Text className="ml-1 text-xs font-semibold text-dhe-success">
                          Visitado
                        </Text>
                      </View>
                    ) : (
                      <StatusBadge status={item.equipamento.status} />
                    )}
                  </View>

                  <Pressable onPress={() => router.push(`/equipment/${item.equipamento.id}`)}>
                    <Text className="text-base font-semibold text-dhe-text">
                      {item.equipamento.nome}
                    </Text>
                    <View className="mt-2 flex-row items-center">
                      <MapPin size={14} color={colors.textMuted} />
                      <Text className="ml-2 flex-1 text-sm text-dhe-textSecondary">
                        {item.equipamento.localizacao}
                      </Text>
                    </View>
                    <Text className="mt-1 text-xs text-dhe-textMuted">
                      {item.equipamento.cliente?.empresa ?? item.equipamento.empresa}
                    </Text>
                  </Pressable>

                  {!visited ? (
                    <Button
                      title="Marcar como visitado"
                      size="sm"
                      className="mt-4"
                      onPress={() => void handleVisit(item.id)}
                      loading={visitMutation.isPending}
                    />
                  ) : null}
                </Card>
              );
            })
          )}
        </PageContainer>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
