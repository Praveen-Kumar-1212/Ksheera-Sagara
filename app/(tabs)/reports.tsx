import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartBar as BarChart3, Download, Share2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ExpensePieChart } from '@/components/charts/ExpensePieChart';
import { MilkBarChart } from '@/components/charts/MilkBarChart';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthlyData {
  totalIncome: number;
  totalExpense: number;
  totalMilk: number;
  avgFat: number;
  expenseBreakdown: { category: string; amount: number }[];
  dailyMilk: { day: string; liters: number }[];
  daysRecorded: number;
}

export default function ReportsScreen() {
  const { theme, t, session } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = session?.user?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const start = `${monthStr}-01`;
    const end = `${monthStr}-${new Date(year, month + 1, 0).getDate()}`;

    const [milkRes, expRes] = await Promise.all([
      supabase.from('milk_entries').select('liters, income, fat_percent, entry_date').eq('user_id', userId).gte('entry_date', start).lte('entry_date', end),
      supabase.from('expenses').select('amount, category').eq('user_id', userId).gte('expense_date', start).lte('expense_date', end),
    ]);

    const milkData = milkRes.data || [];
    const expData = expRes.data || [];

    const totalIncome = milkData.reduce((s, r) => s + (r.income || 0), 0);
    const totalMilk = milkData.reduce((s, r) => s + (r.liters || 0), 0);
    const avgFat = milkData.length > 0 ? milkData.reduce((s, r) => s + (r.fat_percent || 0), 0) / milkData.length : 0;
    const totalExpense = expData.reduce((s, r) => s + (r.amount || 0), 0);

    const catMap: Record<string, number> = {};
    expData.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });

    const dailyMap: Record<string, number> = {};
    milkData.forEach((m) => { dailyMap[m.entry_date] = (dailyMap[m.entry_date] || 0) + m.liters; });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyMilk = Array.from({ length: Math.min(daysInMonth, 30) }, (_, i) => {
      const day = `${monthStr}-${String(i + 1).padStart(2, '0')}`;
      return { day: String(i + 1), liters: dailyMap[day] || 0 };
    });

    setData({
      totalIncome,
      totalExpense,
      totalMilk,
      avgFat,
      expenseBreakdown: Object.entries(catMap).map(([category, amount]) => ({ category, amount })),
      dailyMilk,
      daysRecorded: new Set(milkData.map((m) => m.entry_date)).size,
    });
  }, [userId, year, month]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth()) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const handleShare = async () => {
    if (!data) return;
    const profit = data.totalIncome - data.totalExpense;
    const msg = `📊 *Ksheera-Sagara Farm Report*\n📅 ${MONTHS[month]} ${year}\n\n🥛 Milk: ${data.totalMilk.toFixed(1)}L\n💰 Income: ₹${data.totalIncome.toFixed(0)}\n💸 Expense: ₹${data.totalExpense.toFixed(0)}\n${profit >= 0 ? '✅ Profit' : '❌ Loss'}: ₹${Math.abs(profit).toFixed(0)}\n🐄 Avg Fat: ${data.avgFat.toFixed(1)}%\n\nPowered by Ksheera-Sagara`;
    await Share.share({ message: msg });
  };

  const netProfit = data ? data.totalIncome - data.totalExpense : 0;
  const profitMargin = data && data.totalIncome > 0 ? (netProfit / data.totalIncome) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.header}>
        <Text style={styles.headerTitle}>{t('monthlyReport')}</Text>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <ChevronRight size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {data && (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              <SummaryCard title={t('totalIncome')} value={`₹${data.totalIncome.toFixed(0)}`} sub="From milk sales" color={theme.success} positive />
              <SummaryCard title={t('totalExpense')} value={`₹${data.totalExpense.toFixed(0)}`} sub="All categories" color={theme.error} negative />
              <SummaryCard title={t('netProfitLoss')} value={`₹${Math.abs(netProfit).toFixed(0)}`} sub={`${netProfit >= 0 ? 'Profit' : 'Loss'} | ${profitMargin.toFixed(1)}%`} color={netProfit >= 0 ? theme.success : theme.error} positive={netProfit >= 0} negative={netProfit < 0} />
              <SummaryCard title={t('totalMilk')} value={`${data.totalMilk.toFixed(0)}L`} sub={`${data.daysRecorded} days | Fat ${data.avgFat.toFixed(1)}%`} color={theme.primary} />
            </View>

            {/* Daily Milk Chart */}
            <View style={{ marginTop: Spacing.lg }}>
              <SectionHeader title="Daily Milk Production" />
              <Card elevated>
                <MilkBarChart data={data.dailyMilk.filter((_, i) => i % 2 === 0)} />
              </Card>
            </View>

            {/* Expense breakdown */}
            {data.expenseBreakdown.length > 0 && (
              <View style={{ marginTop: Spacing.lg }}>
                <SectionHeader title={t('expenseBreakdown')} />
                <Card elevated>
                  <ExpensePieChart data={data.expenseBreakdown} />
                </Card>
              </View>
            )}

            {/* Share */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.success, flex: 1 }, Shadow.sm]}
                onPress={handleShare}
              >
                <Share2 size={18} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { fontFamily: 'Inter-SemiBold' }]}>Share Report</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryCard({ title, value, sub, color, positive, negative }: {
  title: string; value: string; sub?: string; color: string; positive?: boolean; negative?: boolean;
}) {
  const { theme } = useApp();
  return (
    <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: `${color}30` }, Shadow.sm]}>
      <View style={[styles.summaryIcon, { backgroundColor: `${color}15` }]}>
        {positive ? <TrendingUp size={16} color={color} /> : negative ? <TrendingDown size={16} color={color} /> : <Minus size={16} color={color} />}
      </View>
      <Text style={[styles.summaryValue, { color, fontFamily: 'Inter-Bold' }]}>{value}</Text>
      <Text style={[styles.summaryTitle, { color: theme.text, fontFamily: 'Inter-Medium' }]}>{title}</Text>
      {sub && <Text style={[styles.summarySub, { color: theme.textMuted, fontFamily: 'Inter-Regular' }]}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  headerTitle: { fontSize: FontSize.xxl, fontFamily: 'Inter-Bold', color: '#FFF', marginBottom: Spacing.md },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: FontSize.xl, fontFamily: 'Inter-SemiBold', color: '#FFF', flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 120 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  summaryCard: { width: '47%', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1 },
  summaryIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  summaryValue: { fontSize: FontSize.xl },
  summaryTitle: { fontSize: FontSize.xs, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  summarySub: { fontSize: FontSize.xs, marginTop: 2 },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md },
  actionBtnText: { color: '#FFFFFF', fontSize: FontSize.md },
});
