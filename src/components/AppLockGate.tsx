import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import {
  authenticateWithBiometric,
  getAppLockSettings,
  verifyAppLockPin,
} from "@/services/app-lock";
import { useAuthStore } from "@/store";
import { Input } from "./Input";
import { Button } from "./Button";
import { colors } from "@/theme";

interface AppLockGateProps {
  children: React.ReactNode;
}

export function AppLockGate({ children }: AppLockGateProps) {
  const { isAuthenticated } = useAuthStore();
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const appState = useRef(AppState.currentState);

  const settings = getAppLockSettings();

  const tryBiometricUnlock = useCallback(async () => {
    if (!settings.enabled || !settings.useBiometric) return false;
    setUnlocking(true);
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        setLocked(false);
        setPin("");
        setError("");
      }
      return success;
    } finally {
      setUnlocking(false);
    }
  }, [settings.enabled, settings.useBiometric]);

  const lockIfNeeded = useCallback(() => {
    if (!isAuthenticated) {
      setLocked(false);
      return;
    }
    const current = getAppLockSettings();
    if (current.enabled) {
      setLocked(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocked(false);
      return;
    }
    lockIfNeeded();
    void tryBiometricUnlock();
  }, [isAuthenticated, lockIfNeeded, tryBiometricUnlock]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/active/) &&
        nextState.match(/inactive|background/)
      ) {
        lockIfNeeded();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [lockIfNeeded]);

  const handlePinUnlock = async () => {
    if (pin.length < 4) {
      setError("Informe um PIN válido.");
      return;
    }

    setUnlocking(true);
    setError("");
    try {
      const valid = await verifyAppLockPin(pin);
      if (!valid) {
        setError("PIN incorreto.");
        return;
      }
      setLocked(false);
      setPin("");
    } finally {
      setUnlocking(false);
    }
  };

  if (!locked || !settings.enabled) {
    return <>{children}</>;
  }

  return (
    <View className="absolute inset-0 z-50 flex-1 items-center justify-center bg-dhe-bg px-6">
      <Text className="mb-2 text-2xl font-bold text-dhe-text">App bloqueado</Text>
      <Text className="mb-6 text-center text-sm text-dhe-textSecondary">
        Confirme sua identidade para continuar usando o DHE.
      </Text>

      <Input
        label="PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={8}
        placeholder="••••"
        className="mb-4 w-full"
      />

      {error ? <Text className="mb-4 text-sm text-dhe-danger">{error}</Text> : null}

      <Button
        title="Desbloquear"
        onPress={handlePinUnlock}
        loading={unlocking}
        fullWidth
        className="mb-3"
      />

      {settings.useBiometric ? (
        <Pressable onPress={() => void tryBiometricUnlock()} className="py-3">
          <Text className="text-center text-sm font-semibold text-dhe-primary">
            Usar biometria
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
