import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mail } from "lucide-react-native";
import { Pressable } from "react-native";
import { Button, Input } from "@/components";
import { api } from "@/services/api";
import { colors } from "@/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await api.resetPassword(email);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg">
      <View className="px-5 pt-4">
        <Pressable onPress={() => router.back()} className="mb-6 flex-row items-center">
          <ArrowLeft size={20} color={colors.text} />
          <Text className="ml-2 text-base text-dhe-text">Voltar</Text>
        </Pressable>

        <Text className="mb-2 text-2xl font-bold text-dhe-text">Esqueci minha senha</Text>
        <Text className="mb-8 text-base text-dhe-textSecondary">
          Informe seu email e enviaremos instruções para redefinir sua senha.
        </Text>

        {sent ? (
          <View className="rounded-2xl border border-dhe-success/40 bg-dhe-success/10 p-6">
            <Text className="text-center text-base text-dhe-success">
              Se o email estiver cadastrado, você receberá as instruções em breve.
            </Text>
          </View>
        ) : (
          <>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="seu@email.com"
            />
            <Button
              title="Enviar instruções"
              onPress={handleReset}
              loading={loading}
              fullWidth
              size="lg"
              icon={<Mail size={18} color={colors.bg} />}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
