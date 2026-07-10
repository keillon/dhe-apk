import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { addDays, startOfDay } from "date-fns";
import { CalendarDays, ChevronRight } from "lucide-react-native";
import { Pressable } from "react-native";
import {
  Card,
  EmptyState,
  ErrorState,
  Loading,
  PageContainer,
  RefreshableScrollView,
  StatusBadge,
} from "@/components";
import { api } from "@/services/api";
import { formatDate } from "@/utils";
import { colors } from "@/theme";

export default function CalendarScreen() {
  const router = useRouter();
  const [rangeDays] = useState(60);

  const from = useMemo(() => startOfDay(new Date()).toISOString(), []);
  const to = useMemo(() => addDays(new Date(), rangeDays).toISOString(), [rangeDays]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["maintenance-calendar", from, to],
    queryFn: () => api.getMaintenanceCalendar(from, to),
  });

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  const overdueCount = data?.filter((event) => event.atrasada).length ?? 0;

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
              <Text className="mb-1 text-2xl font-bold text-dhe-text">Calendário</Text>
              <Text className="text-sm text-dhe-textSecondary">
                Próximas manutenções • {overdueCount} atrasada(s)
              </Text>
            </View>
            <CalendarDays size={28} color={colors.primary} />
          </View>

          {(data?.length ?? 0) === 0 ? (
            <EmptyState
              title="Nenhuma manutenção"
              description="Não há manutenções programadas neste período."
            />
          ) : (
            data?.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => router.push(`/equipment/${event.equipamento.id}`)}
              >
                <Card className="mb-3">
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-dhe-primary">
                      {formatDate(event.data)}
                    </Text>
                    {event.atrasada ? (
                      <Text className="text-xs font-bold text-dhe-danger">Atrasada</Text>
                    ) : (
                      <StatusBadge status={event.equipamento.status} />
                    )}
                  </View>
                  <Text className="text-base font-semibold text-dhe-text">
                    {event.equipamento.nome}
                  </Text>
                  <Text className="mt-1 text-xs text-dhe-textSecondary">
                    {event.equipamento.cliente?.empresa ?? event.equipamento.empresa}
                  </Text>
                  <View className="mt-3 flex-row items-center justify-end">
                    <Text className="mr-1 text-xs font-semibold text-dhe-primary">Ver equipamento</Text>
                    <ChevronRight size={14} color={colors.primary} />
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </PageContainer>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
