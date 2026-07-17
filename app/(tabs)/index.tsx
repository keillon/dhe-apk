import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { QrCode, ClipboardCheck, Bell, Wrench, History, Search, FileText } from "lucide-react-native";
import {
  DheLogo,
  Button,
  StatCard,
  Loading,
  ErrorState,
  RefreshableScrollView,
  PageContainer,
} from "@/components";
import {
  useDashboardStats,
  useMyInspections,
  useNotifications,
} from "@/hooks";
import { useAuthStore } from "@/store";
import { getInspectionDraftCount } from "@/services/draft-inspections";
import { getGreeting, isAdmin } from "@/utils";
import { colors } from "@/theme";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const admin = isAdmin(user);
  const [draftRefresh, setDraftRefresh] = useState(0);
  const draftCount = useMemo(() => {
    void draftRefresh;
    return getInspectionDraftCount();
  }, [draftRefresh]);
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  const { data: myInspections, refetch: refetchMyInspections } = useMyInspections();
  const { data: notifications, refetch: refetchNotifications } = useNotifications(
    admin ? (user?.id ?? "") : ""
  );

  const unreadCount = notifications?.filter((n) => !n.lida).length ?? 0;

  if (admin && isLoading) return <Loading fullScreen />;
  if (admin && error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
        onRefresh={async () => {
          setDraftRefresh((value) => value + 1);
          if (admin) {
            await Promise.all([refetch(), refetchNotifications()]);
          } else {
            await refetchMyInspections();
          }
        }}
      >
        <PageContainer>
            <View className="mb-6 flex-row items-center justify-between">
            <DheLogo variant="mark" size="sm" />
            {admin && (
              <Pressable
                onPress={() => router.push("/notifications")}
                className="relative rounded-full bg-dhe-elevated p-3"
              >
                <Bell size={22} color={colors.text} />
                {unreadCount > 0 && (
                  <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-dhe-danger">
                    <Text className="text-xs font-bold text-white">{unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            )}
          </View>

          <Text className="text-2xl font-bold text-dhe-text">
            {getGreeting()}, {user?.nome?.split(" ")[0] ?? "Técnico"}.
          </Text>
          <Text className="mt-2 text-sm leading-5 text-dhe-textSecondary">
            {admin
              ? "Painel de gestão DHE"
              : "Escaneie QR Codes e acompanhe suas inspeções"}
          </Text>

          {admin ? (
            <View className="mb-6 mt-6 flex-row gap-3">
              <StatCard
                icon={ClipboardCheck}
                label="Inspeções hoje"
                value={stats?.inspecoes_hoje ?? 0}
                color={colors.success}
              />
              <StatCard
                icon={Bell}
                label="Alertas"
                value={unreadCount}
                color={colors.warning}
              />
            </View>
          ) : (
            <>
              <View className="mb-6 mt-6 flex-row gap-3">
                <StatCard
                  icon={ClipboardCheck}
                  label="Minhas inspeções"
                  value={myInspections?.length ?? 0}
                  color={colors.primary}
                />
                <StatCard
                  icon={Wrench}
                  label="Equipamentos"
                  value={
                    new Set((myInspections ?? []).map((i) => i.equipamento_id)).size
                  }
                  color={colors.success}
                />
              </View>

              <Button
                title="Ver minha atividade"
                onPress={() => router.push("/(tabs)/activity")}
                variant="secondary"
                fullWidth
                size="lg"
                icon={<History size={22} color={colors.text} />}
                className="mb-4"
              />
            </>
          )}

          <Button
            title="Escanear QR Code"
            onPress={() => router.push("/scan")}
            fullWidth
            size="lg"
            icon={<QrCode size={24} color={colors.bg} />}
            className="mb-3"
          />

          <Button
            title="Buscar equipamento"
            onPress={() => router.push("/search")}
            variant="secondary"
            fullWidth
            size="lg"
            icon={<Search size={22} color={colors.text} />}
            className="mb-3"
          />

          {draftCount > 0 ? (
            <Button
              title={`Rascunhos (${draftCount})`}
              onPress={() => router.push("/inspection/drafts")}
              variant="outline"
              fullWidth
              size="lg"
              icon={<FileText size={22} color={colors.primary} />}
            />
          ) : null}
        </PageContainer>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
