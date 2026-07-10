import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, AlertTriangle, Droplets, ClipboardList } from "lucide-react-native";
import {
  Card,
  Button,
  Loading,
  ErrorState,
  EmptyState,
  BackHeader,
  PageContainer,
} from "@/components";
import { useNotifications, useRequireAdmin } from "@/hooks";
import { useAuthStore } from "@/store";
import { api } from "@/services/api";
import { feedback } from "@/services/feedback";
import { formatRelative } from "@/utils";
import { colors } from "@/theme";
import type { NotificationType } from "@/types";

const NOTIF_ICONS: Record<NotificationType, typeof Bell> = {
  inspecao_pendente: ClipboardList,
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
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: notifications, isLoading, error, refetch } = useNotifications(user?.id ?? "");

  const unreadCount = notifications?.filter((n) => !n.lida).length ?? 0;

  const handleOpen = async (id: string, equipmentId?: string) => {
    await api.markNotificationRead(id);
    await refetch();

    if (equipmentId) {
      router.push(`/equipment/${equipmentId}`);
    }
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    await refetch();
    feedback.toast.success("Todas as notificações foram marcadas como lidas.");
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <PageContainer>
          <BackHeader />
          <Text className="mb-1 text-2xl font-bold text-dhe-text">Notificações</Text>
          <Text className="mb-5 text-sm text-dhe-textSecondary">
            Alertas de manutenção, inspeções e equipamentos
          </Text>

          {unreadCount > 0 && (
            <Button
              title="Marcar todas como lidas"
              variant="outline"
              size="sm"
              className="mb-5"
              onPress={handleMarkAllRead}
            />
          )}

          {notifications?.length === 0 ? (
            <EmptyState
              title="Nenhuma notificação"
              description="Você está em dia com manutenções e inspeções."
            />
          ) : (
            notifications?.map((notif) => {
              const Icon = NOTIF_ICONS[notif.tipo];
              const color = NOTIF_COLORS[notif.tipo];

              return (
                <Pressable
                  key={notif.id}
                  onPress={() => handleOpen(notif.id, notif.equipamento_id)}
                >
                  <Card
                    className={`mb-3 ${!notif.lida ? "border-l-4" : ""}`}
                    style={!notif.lida ? { borderLeftColor: color } : undefined}
                  >
                    <View className="flex-row items-start gap-3">
                      <View
                        className="h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon size={18} color={color} />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className="font-semibold text-dhe-text">{notif.titulo}</Text>
                        <Text className="mt-1 text-sm leading-5 text-dhe-textSecondary">
                          {notif.mensagem}
                        </Text>
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
