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
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Milk, Sun, Sunset, Trash2, CreditCard as Edit3, X, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';

interface MilkEntry {
  id: string;
  entry_date: string;
  session: 'morning' | 'evening';
  cow_id: string | null;
  liters: number;
  fat_percent: number;
  snf_percent: number;
  rate_per_liter: number;
  income: number;
  notes: string;
}

interface Cow {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  entry_date: new Date().toISOString().split('T')[0],
  session: 'morning' as const,
  cow_id: null as string | null,
  liters: '',
  fat_percent: '',
  snf_percent: '',
  rate_per_liter: '35',
  notes: '',
};

export default function MilkScreen() {
  const { theme, t, session } = useApp();
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<MilkEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showCowPicker, setShowCowPicker] = useState(false);

  const userId = session?.user?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    const [milkRes, cowRes] = await Promise.all([
      supabase.from('milk_entries').select('*').eq('user_id', userId).order('entry_date', { ascending: false }).order('created_at', { ascending: false }).limit(50),
      supabase.from('cows').select('id, name').eq('user_id', userId).eq('is_active', true),
    ]);
    setEntries(milkRes.data || []);
    setCows(cowRes.data || []);
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
    setEditEntry(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (e: MilkEntry) => {
    setEditEntry(e);
    setForm({
      entry_date: e.entry_date,
      session: e.session,
      cow_id: e.cow_id,
      liters: e.liters.toString(),
      fat_percent: e.fat_percent.toString(),
      snf_percent: e.snf_percent.toString(),
      rate_per_liter: e.rate_per_liter.toString(),
      notes: e.notes,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.liters || !form.rate_per_liter) return;
    setSaving(true);
    const payload = {
      user_id: userId,
      entry_date: form.entry_date,
      session: form.session,
      cow_id: form.cow_id || null,
      liters: parseFloat(form.liters) || 0,
      fat_percent: parseFloat(form.fat_percent) || 0,
      snf_percent: parseFloat(form.snf_percent) || 0,
      rate_per_liter: parseFloat(form.rate_per_liter) || 0,
      notes: form.notes,
    };
    if (editEntry) {
      await supabase.from('milk_entries').update(payload).eq('id', editEntry.id);
    } else {
      await supabase.from('milk_entries').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('milk_entries').delete().eq('id', id);
          load();
        },
      },
    ]);
  };

  const income = (parseFloat(form.liters) || 0) * (parseFloat(form.rate_per_liter) || 0);
  const selectedCow = cows.find((c) => c.id === form.cow_id);

  const groupedEntries = entries.reduce<Record<string, MilkEntry[]>>((acc, e) => {
    if (!acc[e.entry_date]) acc[e.entry_date] = [];
    acc[e.entry_date].push(e);
    return acc;
  }, {});

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.header}>
        <Text style={styles.headerTitle}>{t('milkEntries')}</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
          onPress={openAdd}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {loading ? null : Object.keys(groupedEntries).length === 0 ? (
          <EmptyState
            icon={<Milk size={36} color={theme.textMuted} />}
            title={t('noMilkEntries')}
            subtitle={t('addFirstEntry')}
            actionLabel={t('addMilkEntry')}
            onAction={openAdd}
          />
        ) : (
          Object.entries(groupedEntries).map(([date, dayEntries]) => (
            <View key={date} style={{ marginBottom: Spacing.lg }}>
              <View style={styles.dateHeader}>
                <Text style={[styles.dateText, { color: theme.textSecondary, fontFamily: 'Inter-SemiBold' }]}>
                  {formatDate(date)}
                </Text>
                <Text style={[styles.dateTotalText, { color: theme.primary, fontFamily: 'Inter-Medium' }]}>
                  ₹{dayEntries.reduce((s, e) => s + e.income, 0).toFixed(0)} •{' '}
                  {dayEntries.reduce((s, e) => s + e.liters, 0).toFixed(1)}L
                </Text>
              </View>
              {dayEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  cow={cows.find((c) => c.id === entry.cow_id)}
                  onEdit={() => openEdit(entry)}
                  onDelete={() => handleDelete(entry.id)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }, Shadow.lg]} onPress={openAdd}>
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKAV}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text, fontFamily: 'Inter-Bold' }]}>
                  {editEntry ? t('editMilkEntry') : t('addMilkEntry')}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Session Toggle */}
                <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: 'Inter-Medium' }]}>
                  {t('session')}
                </Text>
                <View style={[styles.sessionRow, { borderColor: theme.border }]}>
                  {(['morning', 'evening'] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.sessionBtn,
                        form.session === s && { backgroundColor: theme.primary },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, session: s }))}
                    >
                      {s === 'morning' ? (
                        <Sun size={16} color={form.session === s ? '#FFF' : theme.textMuted} />
                      ) : (
                        <Sunset size={16} color={form.session === s ? '#FFF' : theme.textMuted} />
                      )}
                      <Text style={[styles.sessionLabel, { color: form.session === s ? '#FFF' : theme.textSecondary, fontFamily: 'Inter-Medium' }]}>
                        {s === 'morning' ? t('morning') : t('evening')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Cow Picker */}
                {cows.length > 0 && (
                  <View style={{ marginBottom: Spacing.md }}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: 'Inter-Medium' }]}>
                      {t('cow')}
                    </Text>
                    <TouchableOpacity
                      style={[styles.picker, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
                      onPress={() => setShowCowPicker(true)}
                    >
                      <Text style={[{ color: form.cow_id ? theme.text : theme.textMuted, fontFamily: 'Inter-Regular', fontSize: FontSize.md }]}>
                        {selectedCow?.name || t('allCows')}
                      </Text>
                      <ChevronDown size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}

                <Input label={`${t('litersProduced')} *`} placeholder="0.0" value={form.liters} onChangeText={(v) => setForm((f) => ({ ...f, liters: v }))} keyboardType="decimal-pad" />
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Input label={t('fatPercent')} placeholder="3.5" value={form.fat_percent} onChangeText={(v) => setForm((f) => ({ ...f, fat_percent: v }))} keyboardType="decimal-pad" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label={t('snfPercent')} placeholder="8.5" value={form.snf_percent} onChangeText={(v) => setForm((f) => ({ ...f, snf_percent: v }))} keyboardType="decimal-pad" />
                  </View>
                </View>
                <Input label={`${t('ratePerLiter')} *`} placeholder="35" value={form.rate_per_liter} onChangeText={(v) => setForm((f) => ({ ...f, rate_per_liter: v }))} keyboardType="decimal-pad" />

                {/* Income Preview */}
                <View style={[styles.incomePreview, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}30` }]}>
                  <Text style={[styles.incomeLabel, { color: theme.textSecondary, fontFamily: 'Inter-Regular' }]}>
                    {t('calculatedIncome')}
                  </Text>
                  <Text style={[styles.incomeValue, { color: theme.primary, fontFamily: 'Inter-Bold' }]}>
                    ₹{income.toFixed(2)}
                  </Text>
                </View>

                <Input label={t('notes')} placeholder="Optional notes..." value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} multiline numberOfLines={3} />

                <Button title={t('save')} onPress={handleSave} loading={saving} fullWidth size="lg" style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Cow Picker Modal */}
      <Modal visible={showCowPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.pickerModal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text, fontFamily: 'Inter-Bold', marginBottom: Spacing.md }]}>
              Select Cow
            </Text>
            <TouchableOpacity
              style={[styles.cowItem, { borderBottomColor: theme.border }]}
              onPress={() => { setForm((f) => ({ ...f, cow_id: null })); setShowCowPicker(false); }}
            >
              <Text style={[{ color: theme.text, fontFamily: 'Inter-Regular', fontSize: FontSize.md }]}>{t('allCows')}</Text>
            </TouchableOpacity>
            {cows.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.cowItem, { borderBottomColor: theme.border }]}
                onPress={() => { setForm((f) => ({ ...f, cow_id: c.id })); setShowCowPicker(false); }}
              >
                <Text style={[{ color: theme.text, fontFamily: 'Inter-Regular', fontSize: FontSize.md }]}>{c.name}</Text>
                {form.cow_id === c.id && <View style={[styles.checkDot, { backgroundColor: theme.primary }]} />}
              </TouchableOpacity>
            ))}
            <Button title={t('cancel')} onPress={() => setShowCowPicker(false)} variant="ghost" fullWidth style={{ marginTop: Spacing.md }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function EntryCard({ entry, cow, onEdit, onDelete }: { entry: MilkEntry; cow?: Cow; onEdit: () => void; onDelete: () => void }) {
  const { theme, t } = useApp();
  return (
    <Card style={{ marginBottom: Spacing.sm }}>
      <View style={styles.entryRow}>
        <View style={[styles.entryIconWrap, { backgroundColor: entry.session === 'morning' ? '#FFF3E0' : '#E3F2FD' }]}>
          {entry.session === 'morning' ? <Sun size={18} color="#F5A623" /> : <Sunset size={18} color="#2196F3" />}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.entryTop}>
            <Text style={[styles.entrySession, { color: theme.text, fontFamily: 'Inter-SemiBold' }]}>
              {entry.session === 'morning' ? t('morning') : t('evening')}
              {cow ? ` • ${cow.name}` : ''}
            </Text>
            <Text style={[styles.entryIncome, { color: theme.primary, fontFamily: 'Inter-Bold' }]}>
              ₹{entry.income.toFixed(2)}
            </Text>
          </View>
          <View style={styles.entryMeta}>
            <Badge label={`${entry.liters}L`} size="sm" />
            {entry.fat_percent > 0 && <Badge label={`Fat ${entry.fat_percent}%`} size="sm" color={theme.secondary} bg={`${theme.secondary}15`} />}
            {entry.snf_percent > 0 && <Badge label={`SNF ${entry.snf_percent}%`} size="sm" color={theme.info} bg={`${theme.info}15`} />}
            <Badge label={`₹${entry.rate_per_liter}/L`} size="sm" color={theme.textMuted} bg={theme.border} />
          </View>
        </View>
        <View style={styles.entryActions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
            <Edit3 size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
            <Trash2 size={16} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
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
  headerTitle: {
    fontSize: FontSize.xxl,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 120 },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  dateText: { fontSize: FontSize.sm },
  dateTotalText: { fontSize: FontSize.sm },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  entryIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  entrySession: { fontSize: FontSize.md },
  entryIncome: { fontSize: FontSize.md },
  entryMeta: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  entryActions: { gap: 8 },
  actionBtn: { padding: 6 },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalKAV: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { fontSize: FontSize.xl },
  fieldLabel: { fontSize: FontSize.sm, marginBottom: 6 },
  sessionRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  sessionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm + 4,
    gap: 6,
  },
  sessionLabel: { fontSize: FontSize.sm },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  incomePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  incomeLabel: { fontSize: FontSize.sm },
  incomeValue: { fontSize: FontSize.xl },
  pickerModal: {
    margin: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: '60%',
  },
  cowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  checkDot: { width: 8, height: 8, borderRadius: 4 },
});
