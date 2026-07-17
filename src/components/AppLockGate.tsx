import { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { useResponsive } from "@/hooks/useResponsive";
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
  const sessionUnlockedRef = useRef(false);

  const settings = getAppLockSettings();
  const showLock = locked && settings.enabled;
  const {
    horizontalPadding,
    keyboardBehavior,
    keyboardVerticalOffset,
    contentMaxWidth,
    isCompactHeight,
  } = useResponsive();

  const markSessionUnlocked = useCallback(() => {
    sessionUnlockedRef.current = true;
    setLocked(false);
    setPin("");
    setError("");
  }, []);

  const tryBiometricUnlock = useCallback(async () => {
    const current = getAppLockSettings();
    if (!current.enabled || !current.useBiometric) return false;
    setUnlocking(true);
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        markSessionUnlocked();
      }
      return success;
    } finally {
      setUnlocking(false);
    }
  }, [markSessionUnlocked]);

  useEffect(() => {
    if (!isAuthenticated) {
      sessionUnlockedRef.current = false;
      setLocked(false);
      return;
    }

    const current = getAppLockSettings();
    if (!current.enabled || sessionUnlockedRef.current) {
      setLocked(false);
      return;
    }

    setLocked(true);
    void tryBiometricUnlock();
  }, [isAuthenticated, tryBiometricUnlock]);

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
      markSessionUnlocked();
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.content} pointerEvents={showLock ? "none" : "auto"}>
        {children}
      </View>

      {showLock ? (
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <KeyboardAvoidingView
              behavior={keyboardBehavior}
              keyboardVerticalOffset={keyboardVerticalOffset}
              style={styles.safeArea}
            >
              <ScrollView
                contentContainerStyle={[
                  styles.scrollContent,
                  {
                    paddingHorizontal: horizontalPadding,
                    paddingVertical: isCompactHeight ? 16 : 32,
                  },
                ]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                showsVerticalScrollIndicator={false}
              >
                <DheLogo variant="white" size="sm" />

                <View style={styles.iconWrap}>
                  <Lock size={28} color={colors.primary} />
                </View>

                <Text style={styles.title}>App bloqueado</Text>
                <Text style={styles.subtitle}>
                  Confirme sua identidade para entrar nesta sessão.
                </Text>

                <View style={[styles.form, { maxWidth: Math.min(400, contentMaxWidth) }]}>
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
  content: {
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
