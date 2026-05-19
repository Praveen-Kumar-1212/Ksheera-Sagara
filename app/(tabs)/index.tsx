import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  TrendingDown,
  Milk,
  DollarSign,
  Activity,
  Beef,
  Bell,
  Bot,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { MilkBarChart } from '@/components/charts/MilkBarChart';
import { ExpensePieChart } from '@/components/charts/ExpensePieChart';

const { width } = Dimensions.get('window');

interface DashStats {
  todayIncome: number;
  todayExpense: number;
  todayMilk: number;
  monthIncome: number;
  monthExpense: number;
  activeCows: number;
  avgFat: number;
  weeklyMilk: { day: string; liters: number }[];
  expenseBreakdown: { category: string; amount: number }[];
  topCows: { name: string; liters: number }[];
}

const EMPTY_STATS: DashStats = {
  todayIncome: 0,
  todayExpense: 0,
  todayMilk: 0,
  monthIncome: 0,
  monthExpense: 0,
  activeCows: 0,
  avgFat: 0,
  weeklyMilk: [],
  expenseBreakdown: [],
  topCows: [],
};

export default function DashboardScreen() {
  const { theme, t, profile, session } = useApp();
  const [stats, setStats] = useState<DashStats>(EMPTY_STATS);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : t('goodEvening');
  const farmerName = profile?.full_name?.split(' ')[0] || 'Farmer';

  const loadStats = useCallback(async () => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const today = new Date().toISOString().split('T')[0];
    const monthStart = `${today.slice(0, 7)}-01`;

    const [todayMilk, todayExp, monthMilk, monthExp, cows, weekMilk] = await Promise.all([
      supabase.from('milk_entries').select('liters, income, fat_percent').eq('user_id', userId).eq('entry_date', today),
      supabase.from('expenses').select('amount').eq('user_id', userId).eq('expense_date', today),
      supabase.from('milk_entries').select('income').eq('user_id', userId).gte('entry_date', monthStart),
      supabase.from('expenses').select('amount, category').eq('user_id', userId).gte('expense_date', monthStart),
      supabase.from('cows').select('name').eq('user_id', userId).eq('is_active', true).eq('is_lactating', true),
      supabase.from('milk_entries').select('entry_date, liters').eq('user_id', userId).gte('entry_date', getWeekStart()).order('entry_date'),
    ]);

    const todayIncomeVal = (todayMilk.data || []).reduce((s, r) => s + (r.income || 0), 0);
    const todayExpVal = (todayExp.data || []).reduce((s, r) => s + (r.amount || 0), 0);
    const todayLiters = (todayMilk.data || []).reduce((s, r) => s + (r.liters || 0), 0);
    const avgFatVal = todayMilk.data?.length
      ? (todayMilk.data || []).reduce((s, r) => s + (r.fat_percent || 0), 0) / todayMilk.data.length
      : 0;
    const mIncome = (monthMilk.data || []).reduce((s, r) => s + (r.income || 0), 0);
    const mExpense = (monthExp.data || []).reduce((s, r) => s + (r.amount || 0), 0);

    // Weekly chart data
    const weekMap: Record<string, number> = {};
    (weekMilk.data || []).forEach((r) => {
      weekMap[r.entry_date] = (weekMap[r.entry_date] || 0) + r.liters;
    });
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyMilkData = getLast7Days().map((d, i) => ({
      day: days[new Date(d).getDay() === 0 ? 6 : new Date(d).getDay() - 1],
      liters: weekMap[d] || 0,
    }));

    // Expense breakdown
    const catMap: Record<string, number> = {};
    (monthExp.data || []).forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    const expBreakdown = Object.entries(catMap).map(([category, amount]) => ({ category, amount }));

    setStats({
      todayIncome: todayIncomeVal,
      todayExpense: todayExpVal,
      todayMilk: todayLiters,
      monthIncome: mIncome,
      monthExpense: mExpense,
      activeCows: cows.data?.length || 0,
      avgFat: avgFatVal,
      weeklyMilk: weeklyMilkData,
      expenseBreakdown: expBreakdown,
      topCows: [],
    });
  }, [session?.user?.id]);

  useEffect(() => {
    loadStats().finally(() => setLoading(false));
  }, [loadStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const netProfit = stats.monthIncome - stats.monthExpense;
  const profitMargin = stats.monthIncome > 0 ? (netProfit / stats.monthIncome) * 100 : 0;
  const healthLabel =
    profitMargin >= 30
      ? t('excellent')
      : profitMargin >= 15
      ? t('good')
      : profitMargin >= 0
      ? t('average')
      : t('poor');
  const healthColor =
    profitMargin >= 30 ? theme.success : profitMargin >= 15 ? theme.secondary : profitMargin >= 0 ? theme.warning : theme.error;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.farmerName}>{farmerName} 👋</Text>
            <Text style={styles.farmName}>{profile?.farm_name || 'Your Farm'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push('/(tabs)/reports')}
            >
              <Bell size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
              onPress={() => router.push('/ai-assistant')}
            >
              <Bot size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>₹{stats.monthIncome.toFixed(0)}</Text>
            <Text style={styles.heroStatLabel}>Month Income</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>₹{stats.monthExpense.toFixed(0)}</Text>
            <Text style={styles.heroStatLabel}>Month Expense</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatValue, { color: netProfit >= 0 ? '#A8FFC0' : '#FFB3B3' }]}>
              ₹{Math.abs(netProfit).toFixed(0)}
            </Text>
            <Text style={styles.heroStatLabel}>{netProfit >= 0 ? 'Profit' : 'Loss'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Today's Stats */}
        <SectionHeader title="Today's Overview" />
        <View style={styles.statsRow}>
          <StatCard
            title={t('todaysIncome')}
            value={`₹${stats.todayIncome.toFixed(0)}`}
            icon={<DollarSign size={20} color="#FFFFFF" />}
            gradient={[theme.primary, theme.primaryLight]}
          />
          <StatCard
            title={t('todaysExpense')}
            value={`₹${stats.todayExpense.toFixed(0)}`}
            icon={<TrendingDown size={20} color={theme.error} />}
            negative={stats.todayExpense > 0}
          />
        </View>
        <View style={[styles.statsRow, { marginTop: Spacing.sm }]}>
          <StatCard
            title={t('totalMilk')}
            value={`${stats.todayMilk.toFixed(1)} L`}
            icon={<Milk size={20} color={theme.primary} />}
          />
          <StatCard
            title={t('activeCows')}
            value={`${stats.activeCows}`}
            icon={<Beef size={20} color={theme.secondary} />}
          />
        </View>

        {/* Financial Health */}
        <View style={{ marginTop: Spacing.lg }}>
          <SectionHeader title={t('financialHealth')} />
          <Card elevated style={{ padding: Spacing.md }}>
            <View style={styles.healthRow}>
              <View style={styles.healthLeft}>
                <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
                <View>
                  <Text style={[styles.healthStatus, { color: healthColor, fontFamily: 'Inter-Bold' }]}>
                    {healthLabel}
                  </Text>
                  <Text style={[styles.healthSub, { color: theme.textSecondary, fontFamily: 'Inter-Regular' }]}>
                    Profit Margin: {profitMargin.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={[styles.profitBadge, { backgroundColor: `${healthColor}15` }]}>
                <Text style={[styles.profitVal, { color: healthColor, fontFamily: 'Inter-Bold' }]}>
                  {netProfit >= 0 ? '+' : ''}₹{netProfit.toFixed(0)}
                </Text>
                <Text style={[styles.profitLabel, { color: theme.textMuted, fontFamily: 'Inter-Regular' }]}>
                  This Month
                </Text>
              </View>
            </View>
            <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(Math.max(profitMargin + 50, 5), 100)}%`,
                    backgroundColor: healthColor,
                  },
                ]}
              />
            </View>
          </Card>
        </View>

        {/* Milk Chart */}
        {stats.weeklyMilk.length > 0 && (
          <View style={{ marginTop: Spacing.lg }}>
            <SectionHeader title={t('milkProduction')} actionLabel="7 Days" />
            <Card elevated>
              <MilkBarChart data={stats.weeklyMilk} />
            </Card>
          </View>
        )}

        {/* Expense breakdown */}
        {stats.expenseBreakdown.length > 0 && (
          <View style={{ marginTop: Spacing.lg }}>
            <SectionHeader title={t('expenseBreakdown')} />
            <Card elevated>
              <ExpensePieChart data={stats.expenseBreakdown} />
            </Card>
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ marginTop: Spacing.lg, marginBottom: Spacing.xl }}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.quickActions}>
            <QuickAction
              label="Add Milk"
              icon={<Milk size={22} color="#FFFFFF" />}
              color={theme.primary}
              onPress={() => router.push('/(tabs)/milk')}
            />
            <QuickAction
              label="Add Expense"
              icon={<Receipt size={22} color="#FFFFFF" />}
              color={theme.secondary}
              onPress={() => router.push('/(tabs)/expenses')}
            />
            <QuickAction
              label="AI Tips"
              icon={<Bot size={22} color="#FFFFFF" />}
              color={theme.info}
              onPress={() => router.push('/ai-assistant')}
            />
            <QuickAction
              label="Reports"
              icon={<BarChart3 size={22} color="#FFFFFF" />}
              color={theme.success}
              onPress={() => router.push('/(tabs)/reports')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function QuickAction({ label, icon, color, onPress }: { label: string; icon: React.ReactNode; color: string; onPress: () => void }) {
  const { theme } = useApp();
  return (
    <TouchableOpacity onPress={onPress} style={styles.qaItem} activeOpacity={0.8}>
      <View style={[styles.qaIcon, { backgroundColor: color }]}>{icon}</View>
      <Text style={[styles.qaLabel, { color: theme.text, fontFamily: 'Inter-Medium' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split('T')[0];
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

import { Receipt, ChartBar as BarChart3 } from 'lucide-react-native';

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter-Regular',
  },
  farmerName: {
    fontSize: FontSize.xxl,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  farmName: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: FontSize.lg,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  heroStatLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: Spacing.sm,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  healthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  healthDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  healthStatus: {
    fontSize: FontSize.lg,
  },
  healthSub: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  profitBadge: {
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  profitVal: {
    fontSize: FontSize.lg,
  },
  profitLabel: {
    fontSize: FontSize.xs,
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qaItem: {
    alignItems: 'center',
    flex: 1,
  },
  qaIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    ...Shadow.md,
  },
  qaLabel: {
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
});
