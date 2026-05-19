import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useApp } from '@/context/AppContext';
import { FontSize, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface BarData {
  day: string;
  liters: number;
}

export function MilkBarChart({ data }: { data: BarData[] }) {
  const { theme } = useApp();
  const maxVal = Math.max(...data.map((d) => d.liters), 1);
  const chartHeight = 120;

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {data.map((d, i) => {
          const barH = maxVal > 0 ? (d.liters / maxVal) * chartHeight : 4;
          return (
            <View key={i} style={styles.barCol}>
              <Text style={[styles.val, { color: theme.primary, fontFamily: 'Inter-SemiBold' }]}>
                {d.liters > 0 ? d.liters.toFixed(0) : ''}
              </Text>
              <View style={[styles.barBg, { height: chartHeight, backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barH, 4),
                      backgroundColor: d.liters > 0 ? theme.primary : theme.border,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.label, { color: theme.textMuted, fontFamily: 'Inter-Regular' }]}>
                {d.day}
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  val: {
    fontSize: FontSize.xs,
    minHeight: 16,
  },
  barBg: {
    width: '100%',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    maxWidth: 32,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  label: {
    fontSize: FontSize.xs,
  },
});
