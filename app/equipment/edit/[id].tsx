import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2 } from "lucide-react-native";
import {
  BackHeader,
  Button,
  DateInput,
  ErrorState,
  EquipmentPhotoPicker,
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
  useResponsive,
} from "@/hooks";
import { feedback } from "@/services/feedback";
import { dateBRToISO, confirmAndDeleteEquipment, formatDate, getApiErrorMessage, resolveMediaUrl } from "@/utils";
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
  const {
    horizontalPadding,
    screenTopPadding,
    scrollBottomPadding,
    keyboardBehavior,
    keyboardVerticalOffset,
  } = useResponsive();

  const [clienteId, setClienteId] = useState("");
  const [nome, setNome] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [setor, setSetor] = useState("");
  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [ano, setAno] = useState("");
  const [status, setStatus] = useState<EquipmentStatus>("operando");
  const [proximaManutencao, setProximaManutencao] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!equipment) return;
    setClienteId(equipment.cliente_id);
    setNome(equipment.nome);
    setQrCode(equipment.qr_code);
    setPatrimonio(equipment.patrimonio);
    setMarca(equipment.marca);
    setModelo(equipment.modelo);
    setNumeroSerie(equipment.numero_serie);
    setAno(String(equipment.ano));
    setSetor(equipment.localizacao);
    setTipo(equipment.tipo ?? "");
    setStatus(equipment.status);
    setProximaManutencao(
      equipment.proxima_manutencao ? formatDate(equipment.proxima_manutencao) : ""
    );
    setFotoUrl(equipment.foto_url ? resolveMediaUrl(equipment.foto_url) : null);
  }, [equipment]);

  const clientOptions =
    clients?.map((c) => ({ id: c.id, label: c.empresa })) ?? [];

  const handleSave = async () => {
    if (!equipment || !clienteId || !nome.trim() || !qrCode.trim()) {
      feedback.toast.error("Preencha os campos obrigatórios, incluindo o QR Code.");
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
          localizacao: setor.trim(),
          tipo: tipo.trim() || undefined,
          status,
          proxima_manutencao: proximaManutencao ? dateBRToISO(proximaManutencao) : undefined,
          foto_url: fotoUrl,
          qr_code: qrCode.trim().toUpperCase(),
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

    const result = await confirmAndDeleteEquipment({
      id: equipment.id,
      name: equipment.nome,
      deleteFn: (args) => deleteEquipment.mutateAsync(args),
    });

    if (result === "deleted") {
      router.replace("/qrcodes");
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error || !equipment) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={keyboardBehavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingTop: screenTopPadding + 8,
            paddingBottom: scrollBottomPadding + 24,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
        >
          <PageContainer>
            <BackHeader fallback={`/equipment/${id}`} />

            <Text className="mb-1 text-2xl font-bold text-dhe-text">Editar equipamento</Text>
            <Text className="mb-6 text-sm text-dhe-textSecondary">
              Altere os dados e o QR Code impresso na máquina.
            </Text>

            <SelectField
              label="Cliente"
              value={clienteId}
              options={clientOptions}
              onChange={setClienteId}
            />
            <Input
              label="QR Code"
              value={qrCode}
              onChangeText={(text) => setQrCode(text.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Input label="Nome" value={nome} onChangeText={setNome} />
            <EquipmentPhotoPicker value={fotoUrl} onChange={setFotoUrl} />
            <Input label="Patrimônio" value={patrimonio} onChangeText={setPatrimonio} />
            <Input label="Setor" value={setor} onChangeText={setSetor} />
            <Input label="Tipo" value={tipo} onChangeText={setTipo} />
            <Input label="Marca" value={marca} onChangeText={setMarca} />
            <Input label="Modelo" value={modelo} onChangeText={setModelo} />
            <Input label="Nº Série" value={numeroSerie} onChangeText={setNumeroSerie} />
            <Input label="Ano" value={ano} onChangeText={setAno} keyboardType="number-pad" />
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
