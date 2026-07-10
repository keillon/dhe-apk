import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Users,
  UserPlus,
  Building2,
  Wrench,
  QrCode,
  ClipboardList,
  BellRing,
  ListChecks,
  ChevronRight,
} from "lucide-react-native";
import { Card, Loading, PageContainer } from "@/components";
import { useRequireAdmin } from "@/hooks";
import { colors } from "@/theme";

const ACTIONS = [
  {
    title: "Inspeções",
    description: "Ver todas as inspeções por funcionário",
    icon: ClipboardList,
    href: "/admin/inspections",
  },
  {
    title: "Usuários",
    description: "Criar, editar e remover técnicos e admins",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Novo usuário",
    description: "Cadastrar técnico ou administrador",
    icon: UserPlus,
    href: "/admin/users/new",
  },
  {
    title: "Novo cliente",
    description: "Cadastrar empresa atendida pela DHE",
    icon: Building2,
    href: "/client/new",
  },
  {
    title: "Novo equipamento",
    description: "Cadastrar máquina e gerar QR Code",
    icon: Wrench,
    href: "/equipment/new",
  },
  {
    title: "QR Codes",
    description: "Imprimir QR Codes para colar nas máquinas",
    icon: QrCode,
    href: "/qrcodes",
  },
  {
    title: "Checklists",
    description: "Editar templates de checklist por tipo de equipamento",
    icon: ListChecks,
    href: "/admin/checklists",
  },
  {
    title: "Teste de notificações",
    description: "Validar alertas locais e push no dispositivo",
    icon: BellRing,
    href: "/admin/notification-test",
  },
] as const;

export default function ManageScreen() {
  const router = useRouter();
  const { allowed, isLoading } = useRequireAdmin();

  if (isLoading || !allowed) return <Loading fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <PageContainer>
          <Text className="mb-1 text-2xl font-bold text-dhe-text">Gestão</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            Cadastros e administração do sistema
          </Text>

          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Pressable key={action.href} onPress={() => router.push(action.href as Href)}>
                <Card className="mb-3 flex-row items-center gap-4">
                  <View className="h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-dhe-primary/20">
                    <Icon size={22} color={colors.primary} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-semibold text-dhe-text">{action.title}</Text>
                    <Text className="mt-1 text-xs leading-4 text-dhe-textSecondary">
                      {action.description}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </Card>
              </Pressable>
            );
          })}
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
