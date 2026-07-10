import { useCallback, useEffect, useState } from "react";
import { Platform, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { Bell, BellRing, Send, Smartphone } from "lucide-react-native";
import {
  BackHeader,
  Button,
  Card,
  Loading,
  PageContainer,
} from "@/components";
import { useRequireAdmin } from "@/hooks";
import { api } from "@/services/api";
import { feedback } from "@/services/feedback";
import {
  getExpoPushToken,
  getPushPermissionStatus,
  requestPushPermissions,
  scheduleImmediateTestNotification,
  scheduleLocalTestNotification,
  type PushPermissionStatus,
} from "@/services/push-notifications";
import { getApiErrorMessage } from "@/utils";
import { colors } from "@/theme";

const PERMISSION_LABELS: Record<PushPermissionStatus, string> = {
  granted: "Concedida",
  denied: "Negada",
  undetermined: "Não solicitada",
};

export default function NotificationTestScreen() {
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const [permission, setPermission] = useState<PushPermissionStatus>("undetermined");
  const [pushToken, setPushToken] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [lastNotification, setLastNotification] = useState("");
  const [title, setTitle] = useState("Teste DHE");
  const [body, setBody] = useState("Notificação push de teste do painel admin.");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    const status = await getPushPermissionStatus();
    setPermission(status);

    if (status === "granted") {
      const result = await getExpoPushToken();
      setPushToken(result.token ?? "");
      setTokenError(result.error ?? "");
    } else {
      setPushToken("");
      setTokenError("");
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;

    void refreshStatus();

    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      setLastNotification(`${content.title ?? "Sem título"} — ${content.body ?? "Sem mensagem"}`);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const content = response.notification.request.content;
      setLastNotification(`Toque: ${content.title ?? "Sem título"}`);
    });

    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }, [allowed, refreshStatus]);

  const runAction = async (actionId: string, action: () => Promise<void>) => {
    setLoadingAction(actionId);
    try {
      await action();
    } catch (error) {
      await feedback.alert("Erro", getApiErrorMessage(error));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRequestPermission = async () => {
    await runAction("permission", async () => {
      const status = await requestPushPermissions();
      setPermission(status);

      if (status !== "granted") {
        await feedback.alert(
          "Permissão necessária",
          "Ative as notificações nas configurações do aparelho para testar push."
        );
        return;
      }

      await refreshStatus();
      feedback.toast.success("Permissão concedida.");
    });
  };

  const handleLocalTest = async () => {
    await runAction("local", async () => {
      await scheduleLocalTestNotification(title, body);
      feedback.toast.success("Notificação local agendada para 2 segundos.");
    });
  };

  const handleImmediateTest = async () => {
    await runAction("immediate", async () => {
      await scheduleImmediateTestNotification(title, body);
      feedback.toast.success("Notificação local enviada.");
    });
  };

  const handleRegisterToken = async () => {
    await runAction("register", async () => {
      if (permission !== "granted") {
        await feedback.alert("Permissão necessária", "Conceda permissão antes de registrar o token.");
        return;
      }

      const result = await getExpoPushToken();
      if (!result.token) {
        setTokenError(result.error ?? "Token indisponível.");
        await feedback.alert("Token indisponível", result.error ?? "Não foi possível obter o token push.");
        return;
      }

      await api.registerPushToken(result.token, Platform.OS);
      setPushToken(result.token);
      setTokenError("");
      feedback.toast.success("Token registrado no servidor.");
    });
  };

  const handleRemoteTest = async () => {
    await runAction("remote", async () => {
      const result = await api.sendTestPushNotification(title, body);

      if (!result.success) {
        const message =
          result.errors.join("\n") || "Falha ao enviar push. Registre o token deste aparelho primeiro.";
        await feedback.alert("Push não enviado", message);
        return;
      }

      feedback.toast.success(`Push enviado para ${result.sent} dispositivo(s).`);
    });
  };

  if (authLoading || !allowed) return <Loading fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <PageContainer>
          <BackHeader fallback="/(tabs)/manage" />
          <Text className="mb-1 text-2xl font-bold text-dhe-text">Teste de notificações</Text>
          <Text className="mb-5 text-sm text-dhe-textSecondary">
            Ferramenta admin para validar notificações locais e push no dispositivo.
          </Text>

          <Card className="mb-4">
            <View className="mb-3 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-dhe-primary/20">
                <Smartphone size={18} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-dhe-text">Status do aparelho</Text>
                <Text className="mt-1 text-sm text-dhe-textSecondary">
                  Plataforma: {Platform.OS}
                </Text>
              </View>
            </View>

            <Text className="text-sm text-dhe-text">
              Permissão: <Text className="font-semibold">{PERMISSION_LABELS[permission]}</Text>
            </Text>

            {pushToken ? (
              <Text className="mt-3 text-xs leading-5 text-dhe-textMuted" selectable>
                Token: {pushToken}
              </Text>
            ) : null}

            {tokenError ? (
              <Text className="mt-3 text-xs leading-5 text-dhe-warning">{tokenError}</Text>
            ) : null}

            {lastNotification ? (
              <Text className="mt-3 text-xs leading-5 text-dhe-textSecondary">
                Última recebida: {lastNotification}
              </Text>
            ) : null}
          </Card>

          <Card className="mb-4">
            <Text className="mb-3 font-semibold text-dhe-text">Mensagem de teste</Text>
            <Text className="mb-1 text-xs text-dhe-textMuted">Título</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              className="mb-3 rounded-xl border border-dhe-border bg-dhe-elevated px-4 py-3 text-dhe-text"
              placeholderTextColor={colors.textMuted}
            />
            <Text className="mb-1 text-xs text-dhe-textMuted">Mensagem</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              multiline
              className="min-h-[88px] rounded-xl border border-dhe-border bg-dhe-elevated px-4 py-3 text-dhe-text"
              placeholderTextColor={colors.textMuted}
            />
          </Card>

          <Button
            title="Solicitar permissão"
            variant="outline"
            className="mb-3"
            loading={loadingAction === "permission"}
            icon={<Bell size={18} color={colors.primary} />}
            onPress={() => void handleRequestPermission()}
          />

          <Button
            title="Notificação local imediata"
            className="mb-3"
            loading={loadingAction === "immediate"}
            icon={<BellRing size={18} color={colors.bg} />}
            onPress={() => void handleImmediateTest()}
          />

          <Button
            title="Notificação local em 2 segundos"
            variant="secondary"
            className="mb-3"
            loading={loadingAction === "local"}
            onPress={() => void handleLocalTest()}
          />

          <Button
            title="Registrar token no servidor"
            variant="secondary"
            className="mb-3"
            loading={loadingAction === "register"}
            onPress={() => void handleRegisterToken()}
          />

          <Button
            title="Enviar push remota (servidor)"
            className="mb-3"
            loading={loadingAction === "remote"}
            icon={<Send size={18} color={colors.bg} />}
            onPress={() => void handleRemoteTest()}
          />

          <Card>
            <Text className="text-sm leading-6 text-dhe-textSecondary">
              1. Conceda permissão no aparelho físico.{"\n"}
              2. Teste local para validar canal e som.{"\n"}
              3. Registre o token e envie push remota.{"\n"}
              4. Push remota exige APK com EAS projectId válido em app.json.
            </Text>
          </Card>
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
