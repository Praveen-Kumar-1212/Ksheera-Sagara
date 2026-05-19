import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/context/AppContext';
import { Radius, FontSize, Spacing, Shadow } from '@/constants/theme';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  gradient?: [string, string];
  positive?: boolean;
  negative?: boolean;
  small?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  positive,
  negative,
  small,
}: StatCardProps) {
  const { theme } = useApp();

  const valueColor = positive
    ? theme.success
    : negative
    ? theme.error
    : gradient
    ? '#FFFFFF'
    : theme.text;

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, Shadow.md, small && styles.small]}
      >
        <View style={styles.iconRow}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            {icon}
          </View>
        </View>
        <Text style={[styles.value, { color: '#FFFFFF', fontSize: small ? FontSize.xl : FontSize.xxl }]}>
          {value}
        </Text>
        <Text style={[styles.title, { color: 'rgba(255,255,255,0.85)' }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.7)' }]}>{subtitle}</Text>
        )}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, Shadow.sm, small && styles.small]}>
      <View style={styles.iconRow}>
        <View style={[styles.iconBg, { backgroundColor: theme.background }]}>
          {icon}
        </View>
      </View>
      <Text style={[styles.value, { color: valueColor, fontSize: small ? FontSize.xl : FontSize.xxl }]}>
        {value}
      </Text>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    flex: 1,
  },
  small: {
    padding: Spacing.sm + 4,
  },
  iconRow: {
    marginBottom: Spacing.sm,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  title: {
    fontSize: FontSize.xs,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: FontSize.xs,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
});
