import { useCallback, useRef, useState } from "react";
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
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useRequireAdmin,
  useResponsive,
} from "@/hooks";
import { useAuthStore } from "@/store";
import { feedback } from "@/services/feedback";
import { formatRelative, getApiErrorMessage } from "@/utils";
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
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const { horizontalPadding, screenTopPadding, scrollBottomPadding } = useResponsive();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const openingLockRef = useRef(false);

  const unreadCount = notifications?.filter((n) => !n.lida).length ?? 0;

  const handleOpen = useCallback(
    async (id: string, equipmentId?: string) => {
      if (openingLockRef.current) return;
      openingLockRef.current = true;
      setOpeningId(id);

      try {
        await markRead.mutateAsync(id);
        if (equipmentId) {
          router.push(`/equipment/${equipmentId}`);
        }
      } catch (err) {
        feedback.toast.error(getApiErrorMessage(err, "Não foi possível marcar como lida."));
      } finally {
        openingLockRef.current = false;
        setOpeningId(null);
      }
    },
    [markRead, router]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (markAllRead.isPending || unreadCount === 0) return;

    try {
      await markAllRead.mutateAsync();
      feedback.toast.success("Todas as notificações foram marcadas como lidas.");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Não foi possível marcar todas como lidas."));
    }
  }, [markAllRead, unreadCount]);

  if (authLoading || !allowed) return <Loading fullScreen />;
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
        showsVerticalScrollIndicator={false}
      >
        <PageContainer>
          <BackHeader />
          <Text className="mb-2 text-2xl font-bold text-dhe-text">Notificações</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            Alertas de manutenção, inspeções e equipamentos
          </Text>

          {unreadCount > 0 ? (
            <Button
              title="Marcar todas como lidas"
              variant="outline"
              size="sm"
              className="mb-6"
              loading={markAllRead.isPending}
              disabled={markAllRead.isPending}
              onPress={() => void handleMarkAllRead()}
            />
          ) : null}

          {notifications?.length === 0 ? (
            <EmptyState
              title="Nenhuma notificação"
              description="Você está em dia com manutenções e inspeções."
            />
          ) : (
            notifications?.map((notif) => {
              const Icon = NOTIF_ICONS[notif.tipo];
              const color = NOTIF_COLORS[notif.tipo];
              const busy = openingId === notif.id;

              return (
                <Pressable
                  key={notif.id}
                  disabled={busy || openingLockRef.current}
                  onPress={() => void handleOpen(notif.id, notif.equipamento_id)}
                >
                  <Card
                    className={`mb-4 ${!notif.lida ? "border-l-4" : "opacity-80"}`}
                    style={!notif.lida ? { borderLeftColor: color } : undefined}
                  >
                    <View className="flex-row items-start gap-4">
                      <View
                        className="h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon size={18} color={color} />
                      </View>
                      <View className="min-w-0 flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="flex-1 font-semibold text-dhe-text">{notif.titulo}</Text>
                          {!notif.lida ? (
                            <View className="h-2.5 w-2.5 rounded-full bg-dhe-primary" />
                          ) : null}
                        </View>
                        <Text className="mt-2 text-sm leading-5 text-dhe-textSecondary">
                          {notif.mensagem}
                        </Text>
                        <Text className="mt-3 text-xs text-dhe-textMuted">
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
