import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, Users, BarChart3, User, ClipboardList, Settings2, Route, CalendarDays } from "lucide-react-native";
import { useAuthStore } from "@/store";
import { useResponsive } from "@/hooks";
import { isAdmin } from "@/utils/roles";
import { colors } from "@/theme";

export default function TabsLayout() {
  const { user } = useAuthStore();
  const admin = isAdmin(user);
  const insets = useSafeAreaInsets();
  const { isSmallPhone } = useResponsive();
  const tabBarHeight = (isSmallPhone ? 52 : 56) + Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: isSmallPhone ? 10 : 11,
          fontWeight: "600",
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="route"
        options={{
          title: "Rota",
          href: admin ? null : undefined,
          tabBarIcon: ({ color, size }) => <Route size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendário",
          href: admin ? undefined : undefined,
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Atividade",
          href: admin ? null : undefined,
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          href: admin ? undefined : null,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Clientes",
          href: admin ? undefined : null,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: "Gestão",
          href: admin ? undefined : null,
          tabBarIcon: ({ color, size }) => <Settings2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
