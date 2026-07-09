import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  User,
  Briefcase,
  Building2,
  Lock,
  LogOut,
  Mail,
  QrCode,
  Camera,
  Save,
} from "lucide-react-native";
import { Card, Button, Input, DisplayImage, PageContainer } from "@/components";
import { useAuthStore } from "@/store";
import { api } from "@/services/api";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage, isAdmin, getRoleLabel, resolveMediaUrl } from "@/utils";
import { assetToLocalPhoto } from "@/utils/images";
import { colors } from "@/theme";

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const admin = isAdmin(user);

  const [nome, setNome] = useState(user?.nome ?? "");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setNome(user?.nome ?? "");
  }, [user?.nome]);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      await feedback.alert("Permissão necessária", "Permita o acesso à galeria para escolher uma foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    setSaving(true);
    try {
      const photo = await assetToLocalPhoto(result.assets[0]);
      const updated = await api.updateProfile({ foto_url: photo.dataUrl });
      setUser(updated);
      feedback.toast.success("Foto atualizada!");
    } catch (error) {
      feedback.toast.error(getApiErrorMessage(error, "Não foi possível atualizar a foto."));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!nome.trim()) {
      feedback.toast.warning("Informe seu nome.");
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateProfile({ nome: nome.trim() });
      setUser(updated);
      setEditing(false);
      feedback.toast.success("Perfil atualizado!");
    } catch (error) {
      feedback.toast.error(getApiErrorMessage(error, "Não foi possível salvar o perfil."));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await feedback.confirm(
      "Sair da conta",
      "Você precisará entrar novamente para usar o aplicativo.",
      "Sair"
    );
    if (!confirmed) return;

    await api.logout();
    logout();
    router.replace("/(auth)/login");
  };

  const avatarUri = user?.foto_url ? resolveMediaUrl(user.foto_url) : null;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <PageContainer className="px-5 pb-8 pt-4">
          <Text className="mb-1 text-2xl font-bold text-dhe-text">Perfil</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">Gerencie sua conta</Text>

          <Card className="mb-6 items-center py-6">
            <Pressable onPress={handlePickPhoto} disabled={saving} className="relative mb-4">
              {avatarUri ? (
                <DisplayImage
                  uri={avatarUri}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                  resizeMode="cover"
                />
              ) : (
                <View className="h-24 w-24 items-center justify-center rounded-full bg-dhe-primary">
                  <Text className="text-3xl font-bold text-dhe-bg">
                    {user?.nome?.charAt(0) ?? "T"}
                  </Text>
                </View>
              )}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 8,
                  borderWidth: 2,
                  borderColor: colors.border,
                }}
              >
                <Camera size={16} color={colors.primary} />
              </View>
            </Pressable>

            {editing ? (
              <View className="w-full">
                <Input label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome" />
                <View className="mt-2 flex-row gap-2">
                  <Button
                    title="Cancelar"
                    variant="secondary"
                    className="flex-1"
                    onPress={() => {
                      setNome(user?.nome ?? "");
                      setEditing(false);
                    }}
                  />
                  <Button
                    title="Salvar"
                    className="flex-1"
                    loading={saving}
                    icon={<Save size={16} color={colors.bg} />}
                    onPress={handleSaveProfile}
                  />
                </View>
              </View>
            ) : (
              <>
                <Text className="text-xl font-bold text-dhe-text">{user?.nome}</Text>
                <Text className="mt-1 text-sm text-dhe-textSecondary">
                  {user ? getRoleLabel(user.role) : ""} • {user?.cargo}
                </Text>
                <Button
                  title="Editar nome"
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onPress={() => setEditing(true)}
                />
              </>
            )}
          </Card>

          <Card className="mb-6">
            {[
              { icon: Mail, label: "Email", value: user?.email },
              { icon: Briefcase, label: "Cargo", value: user?.cargo },
              { icon: Building2, label: "Empresa", value: user?.empresa },
            ].map((item) => (
              <View
                key={item.label}
                className="mb-3 flex-row items-center border-b border-dhe-border pb-3 last:mb-0 last:border-b-0 last:pb-0"
              >
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-dhe-elevated">
                  <item.icon size={18} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-dhe-textMuted">{item.label}</Text>
                  <Text className="text-base font-medium text-dhe-text">{item.value}</Text>
                </View>
              </View>
            ))}
          </Card>

          {admin && (
            <Card className="mb-6">
              <Text className="mb-3 text-sm font-bold text-dhe-text">Administração</Text>
              <Button
                title="Gerar QR Codes para impressão"
                variant="secondary"
                fullWidth
                className="mb-0"
                icon={<QrCode size={18} color={colors.text} />}
                onPress={() => router.push("/qrcodes" as Href)}
              />
            </Card>
          )}

          <Button
            title="Alterar senha"
            variant="outline"
            fullWidth
            className="mb-3"
            icon={<Lock size={18} color={colors.primary} />}
            onPress={() => router.push("/profile/change-password")}
          />

          <Button
            title="Sair da conta"
            variant="danger"
            fullWidth
            icon={<LogOut size={18} color="#fff" />}
            onPress={handleLogout}
          />

          <View className="mt-8 items-center pb-4">
            <Text className="text-xs text-dhe-textMuted">DHE Componentes Hidráulicos</Text>
            <Text className="mt-1 text-xs text-dhe-textMuted">(41) 99947-0057</Text>
          </View>
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
