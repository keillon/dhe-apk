import { forwardRef } from "react";
import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { DheLogo } from "./DheLogo";

interface QrPrintCardProps {
  qrCode: string;
  equipmentName: string;
  clientName?: string;
  patrimonio?: string;
  localizacao?: string;
}

export const QrPrintCard = forwardRef<View, QrPrintCardProps>(function QrPrintCard(
  { qrCode, equipmentName, clientName, patrimonio, localizacao },
  ref
) {
  return (
    <View
      ref={ref}
      className="items-center rounded-3xl border-2 border-[#1E4A73] bg-white p-8"
      style={{ width: 320 }}
    >
      <DheLogo variant="color" size="sm" />
      <Text className="mt-4 text-center text-xs font-semibold text-[#001423]">
        DHE Componentes Hidráulicos
      </Text>

      <View className="my-6 rounded-2xl bg-white p-4">
        <QRCode value={qrCode} size={200} color="#001423" backgroundColor="#FFFFFF" />
      </View>

      <Text className="text-2xl font-bold text-[#001423]">{qrCode}</Text>
      <Text className="mt-2 text-center text-lg font-semibold text-[#001423]">
        {equipmentName}
      </Text>

      {clientName && (
        <Text className="mt-2 text-center text-sm text-[#1E4A73]">{clientName}</Text>
      )}
      {patrimonio && (
        <Text className="mt-1 text-center text-sm text-[#1E4A73]">
          Patrimônio: {patrimonio}
        </Text>
      )}
      {localizacao && (
        <Text className="mt-1 text-center text-sm text-[#1E4A73]">{localizacao}</Text>
      )}

      <Text className="mt-6 text-center text-xs text-[#5396B7]">
        Escaneie para abrir a ficha do equipamento
      </Text>
    </View>
  );
});
