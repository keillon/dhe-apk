import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, AlertTriangle, Droplets } from "lucide-react-native";
import { Card, Loading, ErrorState, EmptyState, BackHeader, PageContainer } from "@/components";
import { useNotifications, useRequireAdmin } from "@/hooks";
import { useAuthStore } from "@/store";
import { api } from "@/services/api";
import { formatRelative } from "@/utils";
import { colors } from "@/theme";
import type { NotificationType } from "@/types";

const NOTIF_ICONS: Record<NotificationType, typeof Bell> = {
  inspecao_pendente: Bell,
  manutencao_vencida: AlertTriangle,
  oleo_contaminado: Droplets,
};

const NOTIF_COLORS: Record<NotificationType, string> = {
  inspecao_pendente: colors.primary,
  manutencao_vencida: colors.warning,
  oleo_contaminado: colors.danger,
};

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: notifications, isLoading, error, refetch } = useNotifications(user?.id ?? "");

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id);
    refetch();
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <View className="px-5 pt-2">
        <PageContainer>
          <BackHeader />
          <Text className="mb-5 text-2xl font-bold text-dhe-text">Notificações</Text>
        </PageContainer>
      </View>

      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <PageContainer>
        {notifications?.length === 0 ? (
          <EmptyState
            title="Nenhuma notificação"
            description="Você está em dia com todas as inspeções."
          />
        ) : (
          notifications?.map((notif) => {
            const Icon = NOTIF_ICONS[notif.tipo];
            const color = NOTIF_COLORS[notif.tipo];

            return (
              <Pressable key={notif.id} onPress={() => handleMarkRead(notif.id)}>
                <Card
                  className={`mb-3 ${!notif.lida ? "border-l-4" : ""}`}
                  style={!notif.lida ? { borderLeftColor: color } : undefined}
                >
                  <View className="flex-row items-start">
                    <View
                      className="mr-4 h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon size={18} color={color} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-dhe-text">{notif.titulo}</Text>
                      <Text className="mt-1 text-sm text-dhe-textSecondary">{notif.mensagem}</Text>
                      <Text className="mt-2 text-xs text-dhe-textMuted">
                        {formatRelative(notif.created_at)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
