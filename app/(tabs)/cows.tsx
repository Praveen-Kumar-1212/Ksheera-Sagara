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
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Beef, Trash2, CreditCard as Edit3, X, Tag, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';

interface Cow {
  id: string;
  name: string;
  tag_number: string;
  breed: string;
  age_months: number;
  weight_kg: number;
  is_lactating: boolean;
  lactation_number: number;
  purchase_price: number;
  is_active: boolean;
  notes: string;
}

const BREEDS = ['HF (Holstein Friesian)', 'Jersey', 'Sahiwal', 'Gir', 'Murrah Buffalo', 'Surti Buffalo', 'Local', 'Crossbreed'];

const EMPTY_FORM = {
  name: '',
  tag_number: '',
  breed: 'Local',
  age_months: '',
  weight_kg: '',
  is_lactating: true,
  lactation_number: '1',
  purchase_price: '',
  notes: '',
};

export default function CowsScreen() {
  const { theme, t, session } = useApp();
  const [cows, setCows] = useState<Cow[]>([]);
  const [cowStats, setCowStats] = useState<Record<string, { total_liters: number; total_income: number }>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editCow, setEditCow] = useState<Cow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const userId = session?.user?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    const [cowRes, milkRes] = await Promise.all([
      supabase.from('cows').select('*').eq('user_id', userId).order('is_active', { ascending: false }).order('created_at'),
      supabase.from('milk_entries').select('cow_id, liters, income').eq('user_id', userId).not('cow_id', 'is', null),
    ]);
    setCows(cowRes.data || []);

    const stats: Record<string, { total_liters: number; total_income: number }> = {};
    (milkRes.data || []).forEach((m) => {
      if (!m.cow_id) return;
      if (!stats[m.cow_id]) stats[m.cow_id] = { total_liters: 0, total_income: 0 };
      stats[m.cow_id].total_liters += m.liters;
      stats[m.cow_id].total_income += m.income;
    });
    setCowStats(stats);
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
    setEditCow(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (c: Cow) => {
    setEditCow(c);
    setForm({
      name: c.name,
      tag_number: c.tag_number,
      breed: c.breed,
      age_months: c.age_months.toString(),
      weight_kg: c.weight_kg.toString(),
      is_lactating: c.is_lactating,
      lactation_number: c.lactation_number.toString(),
      purchase_price: c.purchase_price.toString(),
      notes: c.notes,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = {
      user_id: userId,
      name: form.name,
      tag_number: form.tag_number,
      breed: form.breed,
      age_months: parseInt(form.age_months) || 0,
      weight_kg: parseFloat(form.weight_kg) || 0,
      is_lactating: form.is_lactating,
      lactation_number: parseInt(form.lactation_number) || 1,
      purchase_price: parseFloat(form.purchase_price) || 0,
      notes: form.notes,
    };
    if (editCow) {
      await supabase.from('cows').update(payload).eq('id', editCow.id);
    } else {
      await supabase.from('cows').insert({ ...payload, is_active: true });
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove Cow', 'Mark this cow as inactive?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate', style: 'destructive', onPress: async () => {
          await supabase.from('cows').update({ is_active: false }).eq('id', id);
          load();
        },
      },
    ]);
  };

  const activeCows = cows.filter((c) => c.is_active);
  const inactiveCows = cows.filter((c) => !c.is_active);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('cows')}</Text>
          <Text style={styles.headerSub}>{activeCows.length} active • {cows.filter((c) => c.is_lactating && c.is_active).length} lactating</Text>
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
        {loading ? null : cows.length === 0 ? (
          <EmptyState
            icon={<Beef size={36} color={theme.textMuted} />}
            title={t('noCows')}
            subtitle={t('addFirstCow')}
            actionLabel={t('addCow')}
            onAction={openAdd}
          />
        ) : (
          <>
            {activeCows.map((cow) => (
              <CowCard
                key={cow.id}
                cow={cow}
                stats={cowStats[cow.id]}
                onEdit={() => openEdit(cow)}
                onDelete={() => handleDelete(cow.id)}
              />
            ))}
            {inactiveCows.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: theme.textMuted, fontFamily: 'Inter-Medium' }]}>Inactive</Text>
                {inactiveCows.map((cow) => (
                  <CowCard
                    key={cow.id}
                    cow={cow}
                    stats={cowStats[cow.id]}
                    onEdit={() => openEdit(cow)}
                    onDelete={() => handleDelete(cow.id)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }, Shadow.lg]} onPress={openAdd}>
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text, fontFamily: 'Inter-Bold' }]}>
                  {editCow ? t('editCow') : t('addCow')}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Input label={`${t('cowName')} *`} placeholder="Lakshmi" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Input label={t('tagNumber')} placeholder="TAG-001" value={form.tag_number} onChangeText={(v) => setForm((f) => ({ ...f, tag_number: v }))} leftIcon={<Tag size={16} color={theme.textMuted} />} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label={t('age')} placeholder="24" value={form.age_months} onChangeText={(v) => setForm((f) => ({ ...f, age_months: v }))} keyboardType="number-pad" />
                  </View>
                </View>
                <Input label={t('breed')} placeholder="HF, Jersey, Sahiwal..." value={form.breed} onChangeText={(v) => setForm((f) => ({ ...f, breed: v }))} />
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Input label={t('weight')} placeholder="450" value={form.weight_kg} onChangeText={(v) => setForm((f) => ({ ...f, weight_kg: v }))} keyboardType="decimal-pad" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label={t('lactationNumber')} placeholder="1" value={form.lactation_number} onChangeText={(v) => setForm((f) => ({ ...f, lactation_number: v }))} keyboardType="number-pad" />
                  </View>
                </View>
                <Input label={t('purchasePrice')} placeholder="50000" value={form.purchase_price} onChangeText={(v) => setForm((f) => ({ ...f, purchase_price: v }))} keyboardType="decimal-pad" leftIcon={<Text style={{ color: theme.textMuted }}>₹</Text>} />

                {/* Lactating toggle */}
                <View style={[styles.toggleRow, { borderColor: theme.border }]}>
                  <Text style={[styles.toggleLabel, { color: theme.text, fontFamily: 'Inter-Medium' }]}>
                    {t('lactating')}
                  </Text>
                  <Switch
                    value={form.is_lactating}
                    onValueChange={(v) => setForm((f) => ({ ...f, is_lactating: v }))}
                    trackColor={{ false: theme.border, true: `${theme.primary}50` }}
                    thumbColor={form.is_lactating ? theme.primary : theme.textMuted}
                  />
                </View>

                <Input label={t('notes')} placeholder="Health notes, special care..." value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} multiline numberOfLines={3} />
                <Button title={t('save')} onPress={handleSave} loading={saving} fullWidth size="lg" style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function CowCard({ cow, stats, onEdit, onDelete }: { cow: Cow; stats?: { total_liters: number; total_income: number }; onEdit: () => void; onDelete: () => void }) {
  const { theme, t } = useApp();
  const profitability = stats && cow.purchase_price > 0
    ? ((stats.total_income - cow.purchase_price) / cow.purchase_price * 100).toFixed(0)
    : null;

  return (
    <Card style={{ marginBottom: Spacing.sm }}>
      <View style={styles.cowRow}>
        <View style={[styles.cowAvatar, { backgroundColor: cow.is_active ? `${theme.primary}15` : theme.border }]}>
          <Text style={{ fontSize: 28 }}>🐄</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.cowTop}>
            <Text style={[styles.cowName, { color: theme.text, fontFamily: 'Inter-Bold' }]}>{cow.name}</Text>
            <View style={styles.cowActions}>
              <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
                <Edit3 size={16} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
                <Trash2 size={16} color={theme.error} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.cowBadges}>
            <Badge label={cow.breed} size="sm" />
            {cow.tag_number ? <Badge label={`#${cow.tag_number}`} size="sm" color={theme.textMuted} bg={theme.border} /> : null}
            {cow.is_lactating
              ? <Badge label={t('lactating')} size="sm" color={theme.success} bg={`${theme.success}15`} />
              : <Badge label="Dry" size="sm" color={theme.warning} bg={`${theme.warning}15`} />
            }
            {!cow.is_active && <Badge label={t('inactive')} size="sm" color={theme.textMuted} bg={theme.border} />}
          </View>
          {stats && (
            <View style={styles.cowStats}>
              <Text style={[styles.cowStat, { color: theme.primary, fontFamily: 'Inter-SemiBold' }]}>
                {stats.total_liters.toFixed(0)}L total
              </Text>
              <Text style={[styles.cowStat, { color: theme.textMuted, fontFamily: 'Inter-Regular' }]}>•</Text>
              <Text style={[styles.cowStat, { color: theme.success, fontFamily: 'Inter-SemiBold' }]}>
                ₹{stats.total_income.toFixed(0)} earned
              </Text>
              {profitability && (
                <>
                  <Text style={[styles.cowStat, { color: theme.textMuted, fontFamily: 'Inter-Regular' }]}>•</Text>
                  <Text style={[styles.cowStat, { color: parseFloat(profitability) >= 0 ? theme.success : theme.error, fontFamily: 'Inter-SemiBold' }]}>
                    {profitability}% ROI
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle: { fontSize: FontSize.xxl, fontFamily: 'Inter-Bold', color: '#FFF' },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter-Regular' },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 120 },
  sectionLabel: { fontSize: FontSize.sm, marginVertical: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  cowRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  cowAvatar: { width: 56, height: 56, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  cowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cowName: { fontSize: FontSize.lg },
  cowActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  cowBadges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginBottom: 6 },
  cowStats: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  cowStat: { fontSize: FontSize.xs },
  fab: { position: 'absolute', bottom: 90, right: Spacing.lg, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  kav: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, marginBottom: Spacing.md },
  toggleLabel: { fontSize: FontSize.md },
});
