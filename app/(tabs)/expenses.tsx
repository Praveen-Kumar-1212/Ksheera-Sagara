import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Receipt, Trash2, CreditCard as Edit3, X, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';

interface Expense {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  description: string;
  vendor: string;
}

const CATEGORIES = [
  { key: 'feed', label: 'Feed', color: '#FF9800', icon: '🌾' },
  { key: 'medicine', label: 'Medicine', color: '#E74C3C', icon: '💊' },
  { key: 'labor', label: 'Labor', color: '#2196F3', icon: '👷' },
  { key: 'electricity', label: 'Electricity', color: '#FFC107', icon: '⚡' },
  { key: 'transport', label: 'Transport', color: '#9C27B0', icon: '🚛' },
  { key: 'other', label: 'Other', color: '#607D8B', icon: '📦' },
];

const EMPTY_FORM = {
  expense_date: new Date().toISOString().split('T')[0],
  category: 'feed',
  amount: '',
  description: '',
  vendor: '',
};

export default function ExpensesScreen() {
  const { theme, t, session } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);

  const userId = session?.user?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('expenses').select('*').eq('user_id', userId).order('expense_date', { ascending: false }).order('created_at', { ascending: false }).limit(100);
    setExpenses(data || []);
  }, [userId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openAdd = () => {
    setEditExpense(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    setEditExpense(e);
    setForm({
      expense_date: e.expense_date,
      category: e.category,
      amount: e.amount.toString(),
      description: e.description,
      vendor: e.vendor,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.amount) return;
    setSaving(true);
    const payload = {
      user_id: userId,
      expense_date: form.expense_date,
      category: form.category,
      amount: parseFloat(form.amount) || 0,
      description: form.description,
      vendor: form.vendor,
    };
    if (editExpense) {
      await supabase.from('expenses').update(payload).eq('id', editExpense.id);
    } else {
      await supabase.from('expenses').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('expenses').delete().eq('id', id);
          load();
        },
      },
    ]);
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const catBreakdown = CATEGORIES.map((c) => ({
    ...c,
    total: expenses.filter((e) => e.category === c.key).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0);

  const selectedCat = CATEGORIES.find((c) => c.key === form.category) || CATEGORIES[0];

  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    if (!acc[e.expense_date]) acc[e.expense_date] = [];
    acc[e.expense_date].push(e);
    return acc;
  }, {});

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('expenses')}</Text>
          <Text style={styles.headerSub}>Total: ₹{totalExpenses.toFixed(0)}</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]} onPress={openAdd}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Category Summary */}
        {catBreakdown.length > 0 && (
          <View style={styles.catRow}>
            {catBreakdown.map((c) => (
              <View key={c.key} style={[styles.catChip, { backgroundColor: `${c.color}15`, borderColor: `${c.color}30` }]}>
                <Text style={styles.catIcon}>{c.icon}</Text>
                <Text style={[styles.catLabel, { color: c.color, fontFamily: 'Inter-Medium' }]}>{c.label}</Text>
                <Text style={[styles.catAmount, { color: theme.text, fontFamily: 'Inter-SemiBold' }]}>₹{c.total.toFixed(0)}</Text>
              </View>
            ))}
          </View>
        )}

        {loading ? null : Object.keys(grouped).length === 0 ? (
          <EmptyState
            icon={<Receipt size={36} color={theme.textMuted} />}
            title={t('noExpenses')}
            subtitle="Track your farm expenses here"
            actionLabel={t('addExpense')}
            onAction={openAdd}
          />
        ) : (
          Object.entries(grouped).map(([date, dayExp]) => (
            <View key={date} style={{ marginBottom: Spacing.lg }}>
              <View style={styles.dateHeader}>
                <Text style={[styles.dateText, { color: theme.textSecondary, fontFamily: 'Inter-SemiBold' }]}>
                  {formatDate(date)}
                </Text>
                <Text style={[{ color: theme.error, fontFamily: 'Inter-Medium', fontSize: FontSize.sm }]}>
                  ₹{dayExp.reduce((s, e) => s + e.amount, 0).toFixed(0)}
                </Text>
              </View>
              {dayExp.map((e) => {
                const cat = CATEGORIES.find((c) => c.key === e.category) || CATEGORIES[5];
                return (
                  <Card key={e.id} style={{ marginBottom: Spacing.sm }}>
                    <View style={styles.expRow}>
                      <View style={[styles.expIcon, { backgroundColor: `${cat.color}15` }]}>
                        <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.expTop}>
                          <Text style={[styles.expCat, { color: theme.text, fontFamily: 'Inter-SemiBold' }]}>
                            {cat.label}
                          </Text>
                          <Text style={[styles.expAmount, { color: theme.error, fontFamily: 'Inter-Bold' }]}>
                            ₹{e.amount.toFixed(2)}
                          </Text>
                        </View>
                        {e.description ? (
                          <Text style={[styles.expDesc, { color: theme.textSecondary, fontFamily: 'Inter-Regular' }]}>
                            {e.description}
                          </Text>
                        ) : null}
                        {e.vendor ? (
                          <Badge label={e.vendor} size="sm" color={theme.textMuted} bg={theme.border} />
                        ) : null}
                      </View>
                      <View style={styles.actions}>
                        <TouchableOpacity onPress={() => openEdit(e)} style={styles.actionBtn}>
                          <Edit3 size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(e.id)} style={styles.actionBtn}>
                          <Trash2 size={16} color={theme.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.error }, Shadow.lg]} onPress={openAdd}>
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text, fontFamily: 'Inter-Bold' }]}>
                  {editExpense ? t('editExpense') : t('addExpense')}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: 'Inter-Medium' }]}>
                  {t('expenseCategory')} *
                </Text>
                <TouchableOpacity
                  style={[styles.picker, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
                  onPress={() => setShowCatPicker(true)}
                >
                  <View style={styles.selectedCat}>
                    <Text style={{ fontSize: 20 }}>{selectedCat.icon}</Text>
                    <Text style={[{ color: theme.text, fontFamily: 'Inter-Regular', fontSize: FontSize.md }]}>
                      {selectedCat.label}
                    </Text>
                  </View>
                  <ChevronDown size={18} color={theme.textMuted} />
                </TouchableOpacity>

                <Input label={`${t('amount')} *`} placeholder="0.00" value={form.amount} onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))} keyboardType="decimal-pad" />
                <Input label={t('description')} placeholder="Details about this expense" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline />
                <Input label={t('vendor')} placeholder="Supplier / Vendor name" value={form.vendor} onChangeText={(v) => setForm((f) => ({ ...f, vendor: v }))} />

                <Button title={t('save')} onPress={handleSave} loading={saving} fullWidth size="lg" style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Category Picker */}
      <Modal visible={showCatPicker} animationType="slide" transparent>
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.pickerModal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text, fontFamily: 'Inter-Bold', marginBottom: Spacing.md }]}>
              Select Category
            </Text>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.catOption, { borderBottomColor: theme.border }]}
                onPress={() => { setForm((f) => ({ ...f, category: c.key })); setShowCatPicker(false); }}
              >
                <Text style={{ fontSize: 22 }}>{c.icon}</Text>
                <Text style={[{ color: theme.text, fontFamily: 'Inter-Regular', fontSize: FontSize.md, flex: 1 }]}>
                  {c.label}
                </Text>
                {form.category === c.key && <View style={[styles.checkDot, { backgroundColor: theme.primary }]} />}
              </TouchableOpacity>
            ))}
            <Button title={t('cancel')} onPress={() => setShowCatPicker(false)} variant="ghost" fullWidth style={{ marginTop: Spacing.md }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatDate(d: string) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (d === today) return 'Today';
  if (d === yesterday) return 'Yesterday';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: FontSize.xxl, fontFamily: 'Inter-Bold', color: '#FFF' },
  headerSub: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter-Regular' },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 120 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  catChip: { borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', borderWidth: 1, minWidth: 80 },
  catIcon: { fontSize: 20, marginBottom: 2 },
  catLabel: { fontSize: FontSize.xs },
  catAmount: { fontSize: FontSize.sm, marginTop: 2 },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm, paddingHorizontal: 4 },
  dateText: { fontSize: FontSize.sm },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  expIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  expTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  expCat: { fontSize: FontSize.md },
  expAmount: { fontSize: FontSize.md },
  expDesc: { fontSize: FontSize.sm, marginBottom: 4 },
  actions: { gap: 8 },
  actionBtn: { padding: 6 },
  fab: { position: 'absolute', bottom: 90, right: Spacing.lg, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  kav: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl },
  fieldLabel: { fontSize: FontSize.sm, marginBottom: 6 },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, marginBottom: Spacing.md },
  selectedCat: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pickerModal: { margin: Spacing.lg, borderRadius: Radius.xl, padding: Spacing.lg },
  catOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  checkDot: { width: 8, height: 8, borderRadius: 4 },
});
