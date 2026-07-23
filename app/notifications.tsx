import { useCallback, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, AlertTriangle, Droplets, ClipboardList, CheckCheck } from "lucide-react-native";
import {
  Card,
  Button,
  Loading,
  ErrorState,
  EmptyState,
  BackHeader,
  PageContainer,
  RefreshableScrollView,
} from "@/components";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useResponsive,
} from "@/hooks";
import { useAuthStore } from "@/store";
import { feedback } from "@/services/feedback";
import { dismissPresentedNotifications } from "@/services/push-notifications";
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
  const { data: notifications, isLoading, error, refetch } = useNotifications(user?.id ?? "");
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const { horizontalPadding, screenTopPadding, scrollBottomPadding } = useResponsive();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const openingLockRef = useRef(false);

  const unreadCount = notifications?.filter((n) => !n.lida).length ?? 0;

  const markAsRead = useCallback(
    async (id: string) => {
      await markRead.mutateAsync(id);
      await dismissPresentedNotifications();
    },
    [markRead]
  );

  const handleOpen = useCallback(
    async (id: string, equipmentId?: string, alreadyRead?: boolean) => {
      if (openingLockRef.current) return;
      openingLockRef.current = true;
      setOpeningId(id);

      try {
        if (!alreadyRead) {
          await markAsRead(id);
        }
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
    [markAsRead, router]
  );

  const handleMarkReadOnly = useCallback(
    async (id: string) => {
      if (openingLockRef.current) return;
      openingLockRef.current = true;
      setOpeningId(id);
      try {
        await markAsRead(id);
        feedback.toast.success("Notificação marcada como lida.");
      } catch (err) {
        feedback.toast.error(getApiErrorMessage(err, "Não foi possível marcar como lida."));
      } finally {
        openingLockRef.current = false;
        setOpeningId(null);
      }
    },
    [markAsRead]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (markAllRead.isPending || unreadCount === 0) return;

    try {
      await markAllRead.mutateAsync();
      await dismissPresentedNotifications();
      feedback.toast.success("Todas as notificações foram marcadas como lidas.");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Não foi possível marcar todas como lidas."));
    }
  }, [markAllRead, unreadCount]);

  if (!user) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <RefreshableScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: screenTopPadding,
          paddingBottom: scrollBottomPadding,
        }}
        showsVerticalScrollIndicator={false}
        onRefresh={async () => {
          await refetch();
        }}
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
              icon={<CheckCheck size={16} color={colors.primary} />}
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
                <View key={notif.id} className="mb-4">
                  <Pressable
                    disabled={busy}
                    onPress={() => void handleOpen(notif.id, notif.equipamento_id, notif.lida)}
                  >
                    <Card
                      className={!notif.lida ? "border-l-4" : "opacity-80"}
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
                            ) : (
                              <Text className="text-[10px] font-bold uppercase text-dhe-textMuted">
                                Lida
                              </Text>
                            )}
                          </View>
                          <Text className="mt-2 text-sm leading-5 text-dhe-textSecondary">
                            {notif.mensagem}
                          </Text>
                          <Text className="mt-3 text-xs text-dhe-textMuted">
                            {formatRelative(notif.created_at)}
                          </Text>
                          {!notif.lida ? (
                            <Pressable
                              className="mt-3 self-start rounded-full bg-dhe-elevated px-3 py-1.5"
                              disabled={busy}
                              onPress={(event) => {
                                event.stopPropagation?.();
                                void handleMarkReadOnly(notif.id);
                              }}
                            >
                              <Text className="text-xs font-bold text-dhe-primary">
                                Marcar como lida
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                </View>
              );
            })
          )}
        </PageContainer>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
