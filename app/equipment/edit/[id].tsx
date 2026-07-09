import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2 } from "lucide-react-native";
import {
  BackHeader,
  Button,
  DateInput,
  ErrorState,
  Input,
  Loading,
  PageContainer,
  SelectField,
} from "@/components";
import {
  useClients,
  useEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
  useRequireAdmin,
} from "@/hooks";
import { feedback } from "@/services/feedback";
import { dateBRToISO, formatDate, getApiErrorMessage } from "@/utils";
import { colors } from "@/theme";
import type { EquipmentStatus } from "@/types";

const STATUS_OPTIONS = [
  { id: "operando" as const, label: "Operando" },
  { id: "parado" as const, label: "Parado" },
  { id: "manutencao" as const, label: "Manutenção" },
];

export default function EditEquipmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: equipment, isLoading, error, refetch } = useEquipment(id);
  const { data: clients } = useClients();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();

  const [clienteId, setClienteId] = useState("");
  const [nome, setNome] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [ano, setAno] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [status, setStatus] = useState<EquipmentStatus>("operando");
  const [proximaManutencao, setProximaManutencao] = useState("");

  useEffect(() => {
    if (!equipment) return;
    setClienteId(equipment.cliente_id);
    setNome(equipment.nome);
    setPatrimonio(equipment.patrimonio);
    setMarca(equipment.marca);
    setModelo(equipment.modelo);
    setNumeroSerie(equipment.numero_serie);
    setAno(String(equipment.ano));
    setLocalizacao(equipment.localizacao);
    setStatus(equipment.status);
    setProximaManutencao(
      equipment.proxima_manutencao ? formatDate(equipment.proxima_manutencao) : ""
    );
  }, [equipment]);

  const clientOptions =
    clients?.map((c) => ({ id: c.id, label: c.empresa })) ?? [];

  const handleSave = async () => {
    if (!equipment || !clienteId || !nome.trim()) {
      feedback.toast.error("Preencha os campos obrigatórios.");
      return;
    }

    const anoNum = parseInt(ano, 10);
    if (Number.isNaN(anoNum)) {
      feedback.toast.error("Ano inválido.");
      return;
    }

    try {
      await updateEquipment.mutateAsync({
        id: equipment.id,
        data: {
          cliente_id: clienteId,
          nome: nome.trim(),
          patrimonio: patrimonio.trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          numero_serie: numeroSerie.trim(),
          ano: anoNum,
          localizacao: localizacao.trim(),
          status,
          proxima_manutencao: proximaManutencao ? dateBRToISO(proximaManutencao) : undefined,
        },
      });
      feedback.toast.success("Equipamento atualizado.");
      router.back();
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao atualizar equipamento."));
    }
  };

  const handleDelete = async () => {
    if (!equipment) return;

    const confirmed = await feedback.choose(
      "Excluir equipamento",
      `Deseja remover ${equipment.nome}? Remova as inspeções antes, se houver.`,
      [
        { text: "Cancelar", value: "cancel", style: "cancel" },
        { text: "Excluir", value: "delete", style: "destructive" },
      ]
    );

    if (confirmed !== "delete") return;

    try {
      await deleteEquipment.mutateAsync(equipment.id);
      feedback.toast.success("Equipamento removido.");
      router.replace("/(tabs)");
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao remover equipamento."));
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error || !equipment) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <PageContainer>
          <BackHeader fallback={`/equipment/${id}`} />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Editar equipamento</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">QR: {equipment.qr_code}</Text>

          <SelectField
            label="Cliente"
            value={clienteId}
            options={clientOptions}
            onChange={setClienteId}
          />
          <Input label="Nome" value={nome} onChangeText={setNome} />
          <Input label="Patrimônio" value={patrimonio} onChangeText={setPatrimonio} />
          <Input label="Marca" value={marca} onChangeText={setMarca} />
          <Input label="Modelo" value={modelo} onChangeText={setModelo} />
          <Input label="Nº Série" value={numeroSerie} onChangeText={setNumeroSerie} />
          <Input label="Ano" value={ano} onChangeText={setAno} keyboardType="number-pad" />
          <Input label="Localização" value={localizacao} onChangeText={setLocalizacao} />
          <SelectField label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          <DateInput
            label="Próxima manutenção"
            value={proximaManutencao}
            onChangeText={setProximaManutencao}
          />

          <Button
            title="Salvar alterações"
            onPress={handleSave}
            loading={updateEquipment.isPending}
            fullWidth
            size="lg"
            className="mb-3"
          />

          <Button
            title="Excluir equipamento"
            variant="outline"
            onPress={handleDelete}
            loading={deleteEquipment.isPending}
            fullWidth
            icon={<Trash2 size={18} color={colors.danger} />}
          />
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
