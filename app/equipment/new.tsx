import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { QrCode } from "lucide-react-native";
import {
  BackHeader,
  Button,
  Card,
  DateInput,
  ErrorState,
  EquipmentPhotoPicker,
  Input,
  Loading,
  PageContainer,
  SelectField,
} from "@/components";
import { useClients, useCreateEquipment, useNextQrCode, useRequireAdmin } from "@/hooks";
import { feedback } from "@/services/feedback";
import { dateBRToISO, getApiErrorMessage } from "@/utils";
import { colors } from "@/theme";
import type { EquipmentStatus } from "@/types";

const STATUS_OPTIONS = [
  { id: "operando" as const, label: "Operando" },
  { id: "parado" as const, label: "Parado" },
  { id: "manutencao" as const, label: "Manutenção" },
];

export default function NewEquipmentScreen() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: clients, isLoading: clientsLoading, error: clientsError, refetch } = useClients();
  const { data: nextQr } = useNextQrCode();
  const createEquipment = useCreateEquipment();

  const [clienteId, setClienteId] = useState(clientId ?? "");
  const [nome, setNome] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [localizacao, setLocalizacao] = useState("");
  const [status, setStatus] = useState<EquipmentStatus>("operando");
  const [proximaManutencao, setProximaManutencao] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | undefined>();

  const clientOptions =
    clients?.map((c) => ({ id: c.id, label: c.empresa })) ?? [];

  const handleSubmit = async () => {
    if (!clienteId || !nome.trim() || !patrimonio.trim() || !marca.trim() || !modelo.trim()) {
      feedback.toast.error("Preencha cliente, nome, patrimônio, marca e modelo.");
      return;
    }

    const anoNum = parseInt(ano, 10);
    if (Number.isNaN(anoNum) || anoNum < 1900) {
      feedback.toast.error("Ano inválido.");
      return;
    }

    try {
      const equipment = await createEquipment.mutateAsync({
        cliente_id: clienteId,
        nome: nome.trim(),
        patrimonio: patrimonio.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        numero_serie: numeroSerie.trim() || "N/A",
        ano: anoNum,
        localizacao: localizacao.trim() || "Não informado",
        status,
        proxima_manutencao: proximaManutencao ? dateBRToISO(proximaManutencao) : undefined,
        foto_url: fotoUrl,
      });

      feedback.toast.success(`Equipamento criado com QR ${equipment.qr_code}.`);

      const goPrint = await feedback.confirm(
        "Imprimir QR Code",
        `O equipamento foi cadastrado com o código ${equipment.qr_code}. Deseja imprimir agora?`,
        "Imprimir"
      );

      if (goPrint) {
        router.replace(`/qrcodes/print/${equipment.id}`);
      } else {
        router.replace(`/equipment/${equipment.id}`);
      }
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao cadastrar equipamento."));
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (clientsLoading) return <Loading fullScreen />;
  if (clientsError) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <PageContainer>
          <BackHeader fallback="/(tabs)/manage" />

          <Text className="mb-6 text-2xl font-bold text-dhe-text">Novo equipamento</Text>

          {nextQr && (
            <Card className="mb-6 flex-row items-center border-dhe-primary/40">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-dhe-primary/20">
                <QrCode size={24} color={colors.primary} />
              </View>
              <View>
                <Text className="text-xs text-dhe-textMuted">Próximo QR Code</Text>
                <Text className="text-lg font-bold text-dhe-primary">{nextQr}</Text>
              </View>
            </Card>
          )}

          <SelectField
            label="Cliente"
            value={clienteId}
            options={clientOptions}
            onChange={setClienteId}
            placeholder="Selecione o cliente"
          />
          <Input label="Nome do equipamento" value={nome} onChangeText={setNome} />
          <EquipmentPhotoPicker value={fotoUrl} onChange={setFotoUrl} />
          <Input label="Patrimônio" value={patrimonio} onChangeText={setPatrimonio} />
          <Input label="Marca" value={marca} onChangeText={setMarca} />
          <Input label="Modelo" value={modelo} onChangeText={setModelo} />
          <Input label="Nº Série" value={numeroSerie} onChangeText={setNumeroSerie} />
          <Input
            label="Ano"
            value={ano}
            onChangeText={setAno}
            keyboardType="number-pad"
            maxLength={4}
          />
          <Input label="Localização" value={localizacao} onChangeText={setLocalizacao} />
          <SelectField label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          <DateInput
            label="Próxima manutenção (opcional)"
            value={proximaManutencao}
            onChangeText={setProximaManutencao}
          />

          <Button
            title="Cadastrar e gerar QR"
            onPress={handleSubmit}
            loading={createEquipment.isPending}
            fullWidth
            size="lg"
          />
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
