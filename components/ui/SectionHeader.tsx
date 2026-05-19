import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '@/context/AppContext';
import { FontSize, Spacing } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const { theme } = useApp();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: theme.text, fontFamily: 'Inter-SemiBold' }]}>
        {title}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[styles.action, { color: theme.primary, fontFamily: 'Inter-Medium' }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
  },
  action: {
    fontSize: FontSize.sm,
  },
});
