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
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { DheLogo, Button, Input } from "@/components";
import { api } from "@/services/api";
import { useAuthStore } from "@/store";
import { colors } from "@/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("tecnico@dhepr.com.br");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setUser } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Preencha email e senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await api.login(email, password);
      setUser(user);
      router.replace("/(tabs)");
    } catch {
      setError("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-5 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10 items-center">
            <DheLogo variant="white" size="lg" />
            <Text className="mt-4 text-center text-sm text-dhe-textSecondary">
              Manutenção Hidráulica Preditiva
            </Text>
            <Text className="mt-1 text-center text-xs text-dhe-textMuted">
              Há 19 anos entregando excelência industrial
            </Text>
          </View>

          <View className="rounded-3xl border border-dhe-border bg-dhe-card p-6">
            <Text className="mb-1 text-2xl font-bold text-dhe-text">Entrar</Text>
            <Text className="mb-6 text-sm text-dhe-textSecondary">
              Acesse com suas credenciais DHE
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

          <View className="mt-8 items-center">
            <Text className="text-xs text-dhe-textMuted">
              DHE Componentes Hidráulicos Ltda.
            </Text>
            <Text className="mt-1 text-xs text-dhe-textMuted">CNPJ: 08.776.928/0001-74</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
