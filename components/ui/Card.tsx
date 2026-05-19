import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useApp } from '@/context/AppContext';
import { Radius, Shadow, Spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  padding?: number;
}

export function Card({ children, style, elevated = false, padding = Spacing.md }: CardProps) {
  const { theme } = useApp();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          padding,
          ...(elevated ? Shadow.md : Shadow.sm),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
