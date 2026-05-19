import { Redirect } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { View, ActivityIndicator } from 'react-native';
import { useApp as useAppInner } from '@/context/AppContext';

export default function Index() {
  const { session, loading, theme } = useApp();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return session ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}
