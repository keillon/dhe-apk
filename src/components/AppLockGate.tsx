import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fingerprint, Lock } from "lucide-react-native";
import {
  authenticateWithBiometric,
  getAppLockSettings,
  verifyAppLockPin,
} from "@/services/app-lock";
import { useAuthStore } from "@/store";
import { DheLogo } from "./DheLogo";
import { Input } from "./Input";
import { Button } from "./Button";
import { Card } from "./Card";
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
  const showLock = locked && settings.enabled;

  const tryBiometricUnlock = useCallback(async () => {
    const current = getAppLockSettings();
    if (!current.enabled || !current.useBiometric) return false;
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
  }, []);

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

  return (
    <View style={styles.root}>
      {!showLock ? children : null}

      {showLock ? (
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.safeArea}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <DheLogo variant="white" size="sm" />

                <View style={styles.iconWrap}>
                  <Lock size={28} color={colors.primary} />
                </View>

                <Text style={styles.title}>App bloqueado</Text>
                <Text style={styles.subtitle}>
                  Confirme sua identidade para continuar usando o DHE.
                </Text>

                <View style={styles.form}>
                  <Card>
                    <Input
                    label="PIN"
                    value={pin}
                    onChangeText={(value) => {
                      setPin(value);
                      if (error) setError("");
                    }}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={8}
                    placeholder="••••"
                    className="mb-0"
                    />

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <Button
                    title="Desbloquear"
                    onPress={() => void handlePinUnlock()}
                    loading={unlocking}
                    fullWidth
                      className="mt-4"
                    />

                    {settings.useBiometric ? (
                      <Pressable
                        onPress={() => void tryBiometricUnlock()}
                        style={styles.biometricButton}
                        disabled={unlocking}
                      >
                        <Fingerprint size={18} color={colors.primary} />
                        <Text style={styles.biometricText}>Usar biometria</Text>
                      </Pressable>
                    ) : null}
                  </Card>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bg,
    zIndex: 999,
    elevation: 999,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: "100%",
  },
  iconWrap: {
    marginTop: 24,
    marginBottom: 12,
    height: 56,
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    marginBottom: 8,
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 24,
    maxWidth: 320,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },
  form: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "stretch",
  },
  error: {
    marginTop: 12,
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
  },
  biometricButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  biometricText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
});
