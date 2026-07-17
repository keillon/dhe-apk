import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, Eye, EyeOff } from "lucide-react-native";
import { DheLogo, Button, Input, PageContainer } from "@/components";
import { useResponsive } from "@/hooks";
import { api } from "@/services/api";
import { prefetchEquipmentCache } from "@/services/equipment-cache";
import { hydrateStorage } from "@/services/storage";
import { registerPushForCurrentUser } from "@/services/push-notifications";
import { useAuthStore } from "@/store";
import { getApiErrorMessage } from "@/utils";
import { colors } from "@/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setUser } = useAuthStore();
  const router = useRouter();
  const {
    horizontalPadding,
    keyboardBehavior,
    keyboardVerticalOffset,
    isCompactHeight,
    isSmallPhone,
  } = useResponsive();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Preencha email e senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      void hydrateStorage().catch(() => {});
      const user = await api.login(email, password);
      setUser(user);
      void registerPushForCurrentUser((token, platform) => api.registerPushToken(token, platform));
      void prefetchEquipmentCache(() => api.getEquipments());
      router.replace("/(tabs)");
    } catch (err) {
      setError(getApiErrorMessage(err, "Email ou senha inválidos."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg">
      <KeyboardAvoidingView
        behavior={keyboardBehavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: horizontalPadding,
            paddingVertical: isCompactHeight ? 16 : 32,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
        >
          <PageContainer>
            <View className={isCompactHeight ? "mb-6 items-center" : "mb-10 items-center"}>
              <DheLogo variant="mark" size={isSmallPhone || isCompactHeight ? "md" : "lg"} />
              <View className="mt-4">
                <DheLogo variant="white" size={isSmallPhone ? "sm" : "md"} />
              </View>
              <Text className="mt-3 text-center text-sm text-dhe-textSecondary">
                Manutenção Hidráulica Preditiva
              </Text>
            </View>

            <View
              className={`rounded-3xl border border-dhe-border bg-dhe-card ${isCompactHeight ? "p-4" : "p-6"}`}
            >
              <Text
                className={`mb-1 font-bold text-dhe-text ${isCompactHeight ? "text-xl" : "text-2xl"}`}
              >
                Entrar
              </Text>
              <Text className="mb-5 text-sm text-dhe-textSecondary">
                Acesse com suas credenciais
              </Text>

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="seu@email.com"
              />

              <View className="relative">
                <Input
                  label="Senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                />
                <Pressable
                  className="absolute right-4 top-10"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textMuted} />
                  ) : (
                    <Eye size={20} color={colors.textMuted} />
                  )}
                </Pressable>
              </View>

              {error ? (
                <Text className="mb-4 text-center text-sm text-dhe-danger">{error}</Text>
              ) : null}

              <Button
                title="Entrar"
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="lg"
                icon={<Lock size={18} color={colors.bg} />}
              />

              <Link href="/(auth)/forgot-password" asChild>
                <Pressable className="mt-4 py-2">
                  <Text className="text-center text-sm font-medium text-dhe-primary">
                    Esqueci minha senha
                  </Text>
                </Pressable>
              </Link>
            </View>
          </PageContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
