import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { LayoutDashboard, Milk, Receipt, Beef, ChartBar as BarChart3, Settings } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Shadow, Spacing, FontSize, Radius } from '@/constants/theme';

export default function TabsLayout() {
  const { theme, t } = useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          ...Shadow.md,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: FontSize.xs,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard'),
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="milk"
        options={{
          title: t('milkEntry'),
          tabBarIcon: ({ color, size }) => <Milk size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: t('expenses'),
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cows"
        options={{
          title: t('cows'),
          tabBarIcon: ({ color, size }) => <Beef size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('reports'),
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
