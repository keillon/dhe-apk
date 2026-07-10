import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileText, Trash2 } from "lucide-react-native";
import {
  BackHeader,
  Button,
  Card,
  EmptyState,
  PageContainer,
  RefreshableScrollView,
} from "@/components";
import {
  deleteInspectionDraft,
  listInspectionDrafts,
} from "@/services/draft-inspections";
import { feedback } from "@/services/feedback";
import { formatDateTime } from "@/utils";
import { colors } from "@/theme";

export default function InspectionDraftsScreen() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const drafts = useMemo(() => {
    void refreshKey;
    return listInspectionDrafts();
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    const confirmed = await feedback.confirm(
      "Excluir rascunho",
      "Deseja remover este rascunho?",
      "Excluir"
    );
    if (!confirmed) return;
    deleteInspectionDraft(id);
    setRefreshKey((value) => value + 1);
    feedback.toast.success("Rascunho removido.");
  };

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-2"
        onRefresh={async () => setRefreshKey((value) => value + 1)}
      >
        <PageContainer>
          <BackHeader fallback="/(tabs)" />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Rascunhos</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            Inspeções salvas localmente para continuar depois
          </Text>

          {drafts.length === 0 ? (
            <EmptyState
              title="Nenhum rascunho"
              description="Salve uma inspeção como rascunho para retomá-la depois."
            />
          ) : (
            drafts.map((draft) => (
              <Card key={draft.id} className="mb-3">
                <View className="mb-3 flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-semibold text-dhe-text">
                      {draft.equipmentName}
                    </Text>
                    <Text className="mt-1 text-xs text-dhe-textMuted">
                      Salvo em {formatDateTime(draft.savedAt)}
                    </Text>
                  </View>
                  <FileText size={20} color={colors.primary} />
                </View>

                <View className="flex-row gap-3">
                  <Button
                    title="Continuar"
                    className="flex-1"
                    size="sm"
                    onPress={() =>
                      router.push({
                        pathname: "/inspection/new",
                        params: { equipmentId: draft.equipmentId, draftId: draft.id },
                      })
                    }
                  />
                  <Button
                    title="Excluir"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onPress={() => void handleDelete(draft.id)}
                    icon={<Trash2 size={14} color={colors.danger} />}
                  />
                </View>
              </Card>
            ))
          )}
        </PageContainer>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
