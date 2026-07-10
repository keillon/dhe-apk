import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fingerprint, Lock } from "lucide-react-native";
import { BackHeader, Button, Card, Input, PageContainer } from "@/components";
import {
  authenticateWithBiometric,
  getAppLockSettings,
  isBiometricAvailable,
  saveAppLockSettings,
  setAppLockPin,
} from "@/services/app-lock";
import { feedback } from "@/services/feedback";
import { colors } from "@/theme";

export default function AppLockScreen() {
  const [enabled, setEnabled] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const settings = getAppLockSettings();
    setEnabled(settings.enabled);
    setUseBiometric(settings.useBiometric);
    void isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const handleSave = async () => {
    if (enabled && pin.length < 4) {
      feedback.toast.warning("Informe um PIN com pelo menos 4 dígitos.");
      return;
    }

    if (enabled && pin !== confirmPin) {
      feedback.toast.warning("Os PINs não coincidem.");
      return;
    }

    setSaving(true);
    try {
      if (enabled && pin) {
        await setAppLockPin(pin);
      }

      const current = getAppLockSettings();
      await saveAppLockSettings({
        ...current,
        enabled,
        useBiometric: biometricAvailable ? useBiometric : false,
      });

      feedback.toast.success("Configurações de bloqueio salvas.");
      setPin("");
      setConfirmPin("");
    } finally {
      setSaving(false);
    }
  };

  const handleTestBiometric = async () => {
    const success = await authenticateWithBiometric();
    feedback.toast[success ? "success" : "warning"](
      success ? "Biometria confirmada." : "Biometria não confirmada."
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8 pt-2"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PageContainer>
            <BackHeader fallback="/(tabs)/profile" />

            <Text className="mb-1 text-2xl font-bold text-dhe-text">Bloqueio do app</Text>
            <Text className="mb-6 text-sm text-dhe-textSecondary">
              Proteja o aplicativo com PIN ou biometria
            </Text>

            <Card className="mb-4">
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center">
                  <Lock size={18} color={colors.primary} />
                  <Text className="ml-3 text-base text-dhe-text">Ativar bloqueio</Text>
                </View>
                <Switch value={enabled} onValueChange={setEnabled} />
              </View>
            </Card>

            {enabled ? (
              <>
                <Input
                  label="Novo PIN"
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={8}
                  placeholder="••••"
                />
                <Input
                  label="Confirmar PIN"
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={8}
                  placeholder="••••"
                />

                {biometricAvailable ? (
                  <Card className="mb-4">
                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Fingerprint size={18} color={colors.primary} />
                        <Text className="ml-3 text-base text-dhe-text">Usar biometria</Text>
                      </View>
                      <Switch value={useBiometric} onValueChange={setUseBiometric} />
                    </View>
                    <Button
                      title="Testar biometria"
                      variant="secondary"
                      size="sm"
                      onPress={() => void handleTestBiometric()}
                      className="mt-3"
                    />
                  </Card>
                ) : null}
              </>
            ) : null}

            <Button title="Salvar" onPress={() => void handleSave()} loading={saving} fullWidth />
          </PageContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
