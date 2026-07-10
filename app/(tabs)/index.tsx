import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  QrCode,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  Bell,
  ChevronRight,
  Printer,
  History,
} from "lucide-react-native";
import {
  DheLogo,
  Button,
  Card,
  StatCard,
  Loading,
  ErrorState,
  OfflineBanner,
  RefreshableScrollView,
  PageContainer,
} from "@/components";
import { useDashboardStats, useEquipments, useMyInspections, useNetworkStatus } from "@/hooks";
import { useAuthStore } from "@/store";
import { getGreeting, isAdmin } from "@/utils";
import { colors } from "@/theme";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const admin = isAdmin(user);
  const { isOffline } = useNetworkStatus();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  const { data: equipments, refetch: refetchEquipments } = useEquipments();
  const { data: myInspections, refetch: refetchMyInspections } = useMyInspections();

  const pendingEquipments = equipments?.filter(
    (e) => e.proxima_manutencao && new Date(e.proxima_manutencao) < new Date()
  );

  if (admin && isLoading) return <Loading fullScreen />;
  if (admin && error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      {isOffline && <OfflineBanner />}

      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
        onRefresh={async () => {
          if (admin) {
            await Promise.all([refetch(), refetchEquipments()]);
          } else {
            await refetchMyInspections();
          }
        }}
      >
        <View className="bg-dhe-surface px-5 pb-6 pt-4">
          <PageContainer>
            <View className="mb-4 flex-row items-center justify-between">
              <DheLogo variant="white" size="sm" />
              {admin && (
                <Pressable
                  onPress={() => router.push("/notifications")}
                  className="relative rounded-full bg-dhe-elevated p-3"
                >
                  <Bell size={22} color={colors.text} />
                  {(stats?.pendencias ?? 0) > 0 && (
                    <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-dhe-danger">
                      <Text className="text-xs font-bold text-white">
                        {stats?.pendencias}
                      </Text>
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
          </PageContainer>
        </View>

        <View className="px-5 pt-6">
          <PageContainer>
            {admin && (
              <>
                <View className="mb-6 flex-row gap-3">
                  <StatCard
                    icon={Wrench}
                    label="Equipamentos"
                    value={stats?.equipamentos_cadastrados ?? 0}
                  />
                  <StatCard
                    icon={ClipboardCheck}
                    label="Inspeções hoje"
                    value={stats?.inspecoes_hoje ?? 0}
                    color={colors.success}
                  />
                </View>

                {(pendingEquipments?.length ?? 0) > 0 && (
                  <Card className="mb-6 border-l-4 border-l-dhe-warning">
                    <View className="flex-row items-center">
                      <AlertTriangle size={20} color={colors.warning} />
                      <Text className="ml-3 flex-1 text-sm font-semibold text-dhe-text">
                        {pendingEquipments?.length} equipamento(s) pendente(s)
                      </Text>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </View>
                  </Card>
                )}

                <Button
                  title="Gerar QR Codes"
                  onPress={() => router.push("/qrcodes")}
                  variant="secondary"
                  fullWidth
                  size="lg"
                  icon={<Printer size={22} color={colors.text} />}
                  className="mb-4"
                />
              </>
            )}

            {!admin && (
              <>
                <View className="mb-6 flex-row gap-3">
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
              className="mb-4"
            />

            {!admin && (
              <Card className="mb-6">
                <Text className="mb-3 text-sm font-bold text-dhe-text">Como funciona</Text>
                <View className="gap-3">
                  <View className="flex-row items-start gap-2">
                    <Text className="text-dhe-primary">1.</Text>
                    <Text className="flex-1 text-sm leading-5 text-dhe-textSecondary">
                      Escaneie o QR Code do equipamento.
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <Text className="text-dhe-primary">2.</Text>
                    <Text className="flex-1 text-sm leading-5 text-dhe-textSecondary">
                      Registre uma nova inspeção com fotos e assinatura.
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <History size={16} color={colors.primary} style={{ marginTop: 2 }} />
                    <Text className="flex-1 text-sm leading-5 text-dhe-textSecondary">
                      Consulte o histórico de inspeções pelo equipamento.
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {admin && (
              <>
                <Text className="mb-4 text-lg font-bold text-dhe-text">
                  Equipamentos recentes
                </Text>

                {equipments?.slice(0, 3).map((eq) => (
                  <Pressable
                    key={eq.id}
                    onPress={() => router.push(`/equipment/${eq.id}`)}
                  >
                    <Card className="mb-3 flex-row items-center">
                      <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-dhe-primary/20">
                        <Wrench size={22} color={colors.primary} />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className="font-semibold text-dhe-text" numberOfLines={1}>
                          {eq.nome}
                        </Text>
                        <Text className="mt-1 text-xs text-dhe-textSecondary" numberOfLines={1}>
                          {eq.cliente?.empresa ?? eq.empresa} • {eq.qr_code}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </Card>
                  </Pressable>
                ))}
              </>
            )}
          </PageContainer>
        </View>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
