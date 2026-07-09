import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Bell, AlertTriangle, Droplets } from "lucide-react-native";
import { Card, Loading, ErrorState, EmptyState } from "@/components";
import { useNotifications } from "@/hooks";
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
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: notifications, isLoading, error, refetch } = useNotifications(user?.id ?? "");

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id);
    refetch();
  };

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-surface" edges={["top"]}>
      <View className="px-6 pt-2">
        <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center">
          <ArrowLeft size={20} color={colors.dark} />
          <Text className="ml-2 text-dhe-dark">Voltar</Text>
        </Pressable>

        <Text className="mb-4 text-2xl font-bold text-dhe-dark">Notificações</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
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
                      className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon size={18} color={color} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-dhe-dark">{notif.titulo}</Text>
                      <Text className="mt-1 text-sm text-dhe-muted">{notif.mensagem}</Text>
                      <Text className="mt-2 text-xs text-dhe-muted">
                        {formatRelative(notif.created_at)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
