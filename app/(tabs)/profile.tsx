import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Briefcase,
  Building2,
  Lock,
  LogOut,
  Mail,
  QrCode,
} from "lucide-react-native";
import { Card, Button } from "@/components";
import { useAuthStore } from "@/store";
import { api } from "@/services/api";
import { colors } from "@/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair do aplicativo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await api.logout();
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const infoItems = [
    { icon: User, label: "Nome", value: user?.nome },
    { icon: Briefcase, label: "Cargo", value: user?.cargo },
    { icon: Building2, label: "Empresa", value: user?.empresa },
    { icon: Mail, label: "Email", value: user?.email },
  ];

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="mb-1 text-2xl font-bold text-dhe-text">Perfil</Text>
        <Text className="mb-6 text-sm text-dhe-textSecondary">Suas informações</Text>

        <Card className="mb-6 items-center py-6">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-dhe-primary">
            <Text className="text-3xl font-bold text-dhe-bg">
              {user?.nome?.charAt(0) ?? "T"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-dhe-text">{user?.nome}</Text>
          <Text className="mt-1 text-sm text-dhe-textSecondary">{user?.cargo}</Text>
        </Card>

        {infoItems.map((item) => (
          <Card key={item.label} className="mb-3 flex-row items-center">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-dhe-elevated">
              <item.icon size={18} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-dhe-textMuted">{item.label}</Text>
              <Text className="text-base font-medium text-dhe-text">{item.value}</Text>
            </View>
          </Card>
        ))}

        <Button
          title="Gerar QR Codes para impressão"
          variant="secondary"
          fullWidth
          className="mb-3"
          icon={<QrCode size={18} color={colors.text} />}
          onPress={() => router.push("/qrcodes" as Href)}
        />

        <Button
          title="Alterar senha"
          variant="outline"
          fullWidth
          className="mb-3"
          icon={<Lock size={18} color={colors.primary} />}
          onPress={() => router.push("/(auth)/forgot-password")}
        />

        <Button
          title="Sair"
          variant="danger"
          fullWidth
          icon={<LogOut size={18} color="#fff" />}
          onPress={handleLogout}
        />

        <View className="mt-8 items-center pb-4">
          <Text className="text-xs text-dhe-textMuted">DHE Componentes Hidráulicos</Text>
          <Text className="mt-1 text-xs text-dhe-textMuted">(41) 99947-0057 • dhe@dhepr.com.br</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
