import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '@/context/AppContext';
import { FontSize, Spacing, Radius } from '@/constants/theme';

interface PieData {
  category: string;
  amount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  feed: 'Feed',
  medicine: 'Medicine',
  labor: 'Labor',
  electricity: 'Electricity',
  transport: 'Transport',
  other: 'Other',
};

export function ExpensePieChart({ data }: { data: PieData[] }) {
  const { theme } = useApp();
  const total = data.reduce((s, d) => s + d.amount, 0);
  const colors = theme.chartColors;

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        {data.map((d, i) => {
          const pct = total > 0 ? (d.amount / total) * 100 : 0;
          return (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: colors[i % colors.length] }]} />
              <View style={styles.legendInfo}>
                <Text style={[styles.catLabel, { color: theme.text, fontFamily: 'Inter-Medium' }]}>
                  {CATEGORY_LABELS[d.category] || d.category}
                </Text>
                <View style={[styles.barBg, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${pct}%`, backgroundColor: colors[i % colors.length] },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.amount, { color: theme.text, fontFamily: 'Inter-SemiBold' }]}>
                ₹{d.amount.toFixed(0)}
              </Text>
              <Text style={[styles.pct, { color: theme.textMuted, fontFamily: 'Inter-Regular' }]}>
                {pct.toFixed(0)}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  legend: {
    gap: Spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendInfo: {
    flex: 1,
    gap: 4,
  },
  catLabel: {
    fontSize: FontSize.sm,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  amount: {
    fontSize: FontSize.sm,
    minWidth: 60,
    textAlign: 'right',
  },
  pct: {
    fontSize: FontSize.xs,
    minWidth: 32,
    textAlign: 'right',
  },
});
