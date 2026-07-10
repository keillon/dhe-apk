import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Save, Trash2 } from "lucide-react-native";
import {
  BackHeader,
  Button,
  Card,
  Input,
  Loading,
  PageContainer,
} from "@/components";
import { useChecklistTemplates, useRequireAdmin } from "@/hooks";
import { api } from "@/services/api";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage } from "@/utils";
import type { ChecklistTemplateItem } from "@/types";
import { colors } from "@/theme";

export default function AdminChecklistsScreen() {
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: templates, isLoading, refetch } = useChecklistTemplates();
  const [selectedTipo, setSelectedTipo] = useState("geral");
  const [nome, setNome] = useState("");
  const [itens, setItens] = useState<ChecklistTemplateItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const template = templates?.find((item) => item.tipo === selectedTipo) ?? templates?.[0];
    if (!template) return;
    setSelectedTipo(template.tipo);
    setNome(template.nome);
    setItens(template.itens);
  }, [templates, selectedTipo]);

  const updateItem = (index: number, patch: Partial<ChecklistTemplateItem>) => {
    setItens((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  };

  const addItem = () => {
    setItens((current) => [
      ...current,
      { key: `item_${current.length + 1}`, label: "Novo item", obrigatorio: false },
    ]);
  };

  const removeItem = (index: number) => {
    setItens((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSave = async () => {
    if (!nome.trim() || itens.length === 0) {
      feedback.toast.warning("Informe nome e ao menos um item.");
      return;
    }

    setSaving(true);
    try {
      await api.updateChecklistTemplate(selectedTipo, { nome: nome.trim(), itens });
      feedback.toast.success("Checklist atualizado.");
      await refetch();
    } catch (error) {
      feedback.toast.error(getApiErrorMessage(error, "Erro ao salvar checklist."));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !allowed || isLoading) return <Loading fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-10 pt-2" showsVerticalScrollIndicator={false}>
        <PageContainer>
          <BackHeader fallback="/(tabs)/manage" />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Checklists</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            Edite os templates usados nas inspeções
          </Text>

          <Text className="mb-3 text-sm font-bold text-dhe-text">Tipo</Text>
          <View className="mb-6 flex-row flex-wrap gap-2">
            {(templates ?? []).map((template) => (
              <Pressable
                key={template.tipo}
                onPress={() => setSelectedTipo(template.tipo)}
                className={`rounded-full px-4 py-2 ${
                  selectedTipo === template.tipo ? "bg-dhe-primary" : "bg-dhe-elevated"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedTipo === template.tipo ? "text-dhe-bg" : "text-dhe-text"
                  }`}
                >
                  {template.tipo}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input label="Nome do template" value={nome} onChangeText={setNome} />

          {itens.map((item, index) => (
            <Card key={`${item.key}-${index}`} className="mb-3">
              <Input
                label="Chave"
                value={item.key}
                onChangeText={(text) => updateItem(index, { key: text })}
              />
              <Input
                label="Rótulo"
                value={item.label}
                onChangeText={(text) => updateItem(index, { label: text })}
              />
              <Button
                title="Remover item"
                variant="outline"
                size="sm"
                onPress={() => removeItem(index)}
                icon={<Trash2 size={14} color={colors.danger} />}
              />
            </Card>
          ))}

          <Button
            title="Adicionar item"
            variant="secondary"
            onPress={addItem}
            fullWidth
            className="mb-4"
            icon={<Plus size={18} color={colors.text} />}
          />

          <Button
            title="Salvar template"
            onPress={() => void handleSave()}
            loading={saving}
            fullWidth
            icon={<Save size={18} color={colors.bg} />}
          />
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
