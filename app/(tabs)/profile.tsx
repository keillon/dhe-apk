import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Briefcase,
  Building2,
  Lock,
  LogOut,
  Mail,
  QrCode,
  Camera,
  Save,
  History,
  Shield,
} from "lucide-react-native";
import { Card, Button, Input, DisplayImage, PageContainer, InfoRowList } from "@/components";
import { useResponsive } from "@/hooks";
import { useAuthStore } from "@/store";
import { api } from "@/services/api";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage, isAdmin, getRoleLabel, resolveMediaUrl, pickProfileImage } from "@/utils";
import { colors } from "@/theme";

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const admin = isAdmin(user);
  const { horizontalPadding, screenTopPadding, tabScrollBottomPadding } = useResponsive();

  const [nome, setNome] = useState(user?.nome ?? "");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setNome(user?.nome ?? "");
  }, [user?.nome]);

  const handlePickPhoto = async () => {
    const source = await feedback.choose("Foto de perfil", "Como deseja adicionar sua foto?", [
      { text: "Galeria", value: "gallery", style: "default" },
      { text: "Câmera", value: "camera", style: "primary" },
    ]);

    if (source !== "gallery" && source !== "camera") return;

    const photo = await pickProfileImage(source);
    if (!photo?.dataUrl.startsWith("data:")) {
      feedback.toast.error("Não foi possível processar a imagem. Tente outra foto.");
      return;
    }

    setSaving(true);
    try {
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
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: screenTopPadding,
          paddingBottom: tabScrollBottomPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        <PageContainer>
          <Text className="mb-1 text-2xl font-bold text-dhe-text">Perfil</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">Gerencie sua conta</Text>

          <Card className="mb-6 items-center px-5 py-6">
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
                <Input
                  label="Nome"
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Seu nome"
                  className="mb-4"
                />
                <View className="flex-row gap-3">
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
              <View className="w-full items-center">
                <Text className="text-center text-xl font-bold text-dhe-text">{user?.nome}</Text>
                <Text className="mt-2 text-center text-sm text-dhe-textSecondary">
                  {user ? getRoleLabel(user.role) : ""} • {user?.cargo}
                </Text>
                <Button
                  title="Editar nome"
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onPress={() => setEditing(true)}
                />
              </View>
            )}
          </Card>

          <Card className="mb-6">
            <InfoRowList
              items={[
                { icon: Mail, label: "E-mail", value: user?.email },
                { icon: Briefcase, label: "Cargo", value: user?.cargo },
                { icon: Building2, label: "Empresa", value: user?.empresa },
              ]}
            />
          </Card>

          {admin && (
            <Card className="mb-6">
              <Text className="mb-4 text-sm font-bold text-dhe-text">Administração</Text>
              <Button
                title="Gerar QR Codes para impressão"
                variant="secondary"
                fullWidth
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
            title="Sincronização"
            variant="outline"
            fullWidth
            className="mb-3"
            icon={<History size={18} color={colors.primary} />}
            onPress={() => router.push("/profile/sync-logs")}
          />

          <Button
            title="Bloqueio do app"
            variant="outline"
            fullWidth
            className="mb-3"
            icon={<Shield size={18} color={colors.primary} />}
            onPress={() => router.push("/profile/app-lock")}
          />

          <Button
            title="Sair da conta"
            variant="danger"
            fullWidth
            icon={<LogOut size={18} color="#fff" />}
            onPress={handleLogout}
          />

          <View className="mt-8 items-center">
            <Text className="text-xs text-dhe-textMuted">DHE Componentes Hidráulicos</Text>
            <Text className="mt-1 text-xs text-dhe-textMuted">(41) 99947-0057</Text>
          </View>
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
