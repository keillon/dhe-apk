import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Briefcase,
  Building2,
  Lock,
  LogOut,
  Moon,
  Sun,
  Mail,
} from "lucide-react-native";
import { Card, Button } from "@/components";
import { useAuthStore, useThemeStore } from "@/store";
import { api } from "@/services/api";
import { colors } from "@/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
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
    <SafeAreaView className="flex-1 bg-dhe-surface" edges={["top"]}>
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="mb-1 text-2xl font-bold text-dhe-dark">Perfil</Text>
        <Text className="mb-6 text-sm text-dhe-muted">Suas informações</Text>

        <Card className="mb-6 items-center py-6">
          <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-dhe-primary">
            <Text className="text-3xl font-bold text-white">
              {user?.nome?.charAt(0) ?? "T"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-dhe-dark">{user?.nome}</Text>
          <Text className="text-sm text-dhe-muted">{user?.cargo}</Text>
        </Card>

        {infoItems.map((item) => (
          <Card key={item.label} className="mb-3 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-dhe-surface">
              <item.icon size={18} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-dhe-muted">{item.label}</Text>
              <Text className="text-base font-medium text-dhe-dark">{item.value}</Text>
            </View>
          </Card>
        ))}

        <Pressable onPress={toggleTheme}>
          <Card className="mb-3 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-dhe-surface">
              {isDark ? (
                <Sun size={18} color={colors.warning} />
              ) : (
                <Moon size={18} color={colors.dark} />
              )}
            </View>
            <Text className="flex-1 text-base font-medium text-dhe-dark">
              {isDark ? "Modo claro" : "Modo escuro"}
            </Text>
          </Card>
        </Pressable>

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

        <View className="mt-8 items-center pb-8">
          <Text className="text-xs text-dhe-muted">DHE Componentes Hidráulicos</Text>
          <Text className="text-xs text-dhe-muted">(41) 99947-0057 • dhe@dhepr.com.br</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
