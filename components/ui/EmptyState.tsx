import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '@/context/AppContext';
import { FontSize, Spacing } from '@/constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { theme } = useApp();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.background }]}>{icon}</View>
      <Text style={[styles.title, { color: theme.text, fontFamily: 'Inter-SemiBold' }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.textMuted, fontFamily: 'Inter-Regular' }]}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={styles.btn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  btn: {
    minWidth: 160,
  },
});
