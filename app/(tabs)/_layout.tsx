import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, Users, BarChart3, User, ClipboardList, Settings2, Route, CalendarDays } from "lucide-react-native";
import { useAuthStore } from "@/store";
import { useResponsive } from "@/hooks";
import { isAdmin } from "@/utils/roles";
import { colors } from "@/theme";

function DarkTabBarBackground() {
  return <View style={styles.tabBarBg} />;
}

export default function TabsLayout() {
  const { user } = useAuthStore();
  const admin = isAdmin(user);
  const insets = useSafeAreaInsets();
  const { isSmallPhone, tabBarHeight } = useResponsive();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: colors.bg,
        tabBarInactiveBackgroundColor: colors.bg,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          elevation: 0,
          shadowColor: "transparent",
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 0,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarBackground: DarkTabBarBackground,
        tabBarItemStyle: {
          backgroundColor: colors.bg,
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
          title: "Painel",
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

const styles = StyleSheet.create({
  tabBarBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
  },
});
