import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '@/context/AppContext';
import { Radius, FontSize, Spacing } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color, bg, size = 'md' }: BadgeProps) {
  const { theme } = useApp();
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg || `${theme.primary}20`,
          paddingHorizontal: size === 'sm' ? 6 : 10,
          paddingVertical: size === 'sm' ? 2 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: color || theme.primary,
            fontSize: size === 'sm' ? FontSize.xs : FontSize.sm,
            fontFamily: 'Inter-Medium',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    letterSpacing: 0.2,
  },
});
