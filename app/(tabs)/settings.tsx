import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Globe, Moon, Bell, Info, Shield, LogOut, ChevronRight, Droplets, X, CreditCard as Edit3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { Language } from '@/constants/i18n';

export default function SettingsScreen() {
  const { theme, t, isDark, toggleDarkMode, language, setLanguage, profile, refreshProfile, session } = useApp();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    farm_name: profile?.farm_name || '',
    location: profile?.location || '',
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name,
        phone: profile.phone,
        farm_name: profile.farm_name,
        location: profile.location,
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    await supabase.from('profiles').update(profileForm).eq('id', session.user.id);
    await refreshProfile();
    setSaving(false);
    setShowProfileModal(false);
  };

  const handleSignOut = () => {
    Alert.alert(t('signOut'), 'Are you sure you want to sign out?', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('signOut'),
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Droplets size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Farmer'}</Text>
        <Text style={styles.farm}>{profile?.farm_name || 'Your Farm'}</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <Card style={styles.section}>
          <SettingsItem
            icon={<User size={20} color={theme.primary} />}
            label={t('editProfile')}
            onPress={() => setShowProfileModal(true)}
            rightEl={<ChevronRight size={18} color={theme.textMuted} />}
          />
        </Card>

        {/* Appearance */}
        <Text style={[styles.groupLabel, { color: theme.textMuted, fontFamily: 'Inter-Medium' }]}>Appearance</Text>
        <Card style={styles.section}>
          <SettingsItem
            icon={<Moon size={20} color={theme.primary} />}
            label={t('darkMode')}
            rightEl={
              <Switch
                value={isDark}
                onValueChange={toggleDarkMode}
                trackColor={{ false: theme.border, true: `${theme.primary}60` }}
                thumbColor={isDark ? theme.primary : theme.textMuted}
              />
            }
          />
        </Card>

        {/* Language */}
        <Text style={[styles.groupLabel, { color: theme.textMuted, fontFamily: 'Inter-Medium' }]}>{t('language')}</Text>
        <Card style={styles.section}>
          <LanguageOption label="English" value="en" current={language} onSelect={setLanguage} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <LanguageOption label="ಕನ್ನಡ (Kannada)" value="kn" current={language} onSelect={setLanguage} />
        </Card>

        {/* About */}
        <Text style={[styles.groupLabel, { color: theme.textMuted, fontFamily: 'Inter-Medium' }]}>About</Text>
        <Card style={styles.section}>
          <SettingsItem icon={<Info size={20} color={theme.primary} />} label="Version 1.0.0" />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem icon={<Shield size={20} color={theme.primary} />} label={t('privacyPolicy')} onPress={() => {}} rightEl={<ChevronRight size={18} color={theme.textMuted} />} />
        </Card>

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: `${theme.error}10`, borderColor: `${theme.error}30` }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <LogOut size={20} color={theme.error} />
          <Text style={[styles.signOutText, { color: theme.error, fontFamily: 'Inter-SemiBold' }]}>
            {t('signOut')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: theme.textMuted, fontFamily: 'Inter-Regular' }]}>
          Ksheera-Sagara • Smart Dairy Management{'\n'}Made with ❤️ for Indian dairy farmers
        </Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showProfileModal} animationType="slide" transparent onRequestClose={() => setShowProfileModal(false)}>
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text, fontFamily: 'Inter-Bold' }]}>
                {t('editProfile')}
              </Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Input label={t('fullName')} value={profileForm.full_name} onChangeText={(v) => setProfileForm((f) => ({ ...f, full_name: v }))} leftIcon={<User size={18} color={theme.textMuted} />} />
              <Input label={t('phone')} value={profileForm.phone} onChangeText={(v) => setProfileForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" />
              <Input label={t('farmName')} value={profileForm.farm_name} onChangeText={(v) => setProfileForm((f) => ({ ...f, farm_name: v }))} />
              <Input label="Location" value={profileForm.location} onChangeText={(v) => setProfileForm((f) => ({ ...f, location: v }))} placeholder="Village / District" />
              <Button title={t('save')} onPress={handleSaveProfile} loading={saving} fullWidth size="lg" style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SettingsItem({ icon, label, onPress, rightEl }: { icon: React.ReactNode; label: string; onPress?: () => void; rightEl?: React.ReactNode }) {
  const { theme } = useApp();
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.itemIcon, { backgroundColor: `${theme.primary}12` }]}>{icon}</View>
      <Text style={[styles.itemLabel, { color: theme.text, fontFamily: 'Inter-Regular' }]}>{label}</Text>
      {rightEl && <View style={styles.itemRight}>{rightEl}</View>}
    </Wrapper>
  );
}

function LanguageOption({ label, value, current, onSelect }: { label: string; value: Language; current: Language; onSelect: (l: Language) => void }) {
  const { theme } = useApp();
  return (
    <TouchableOpacity style={styles.item} onPress={() => onSelect(value)} activeOpacity={0.7}>
      <View style={[styles.itemIcon, { backgroundColor: `${theme.primary}12` }]}>
        <Globe size={20} color={theme.primary} />
      </View>
      <Text style={[styles.itemLabel, { color: theme.text, fontFamily: 'Inter-Regular' }]}>{label}</Text>
      <View style={styles.itemRight}>
        <View style={[styles.radio, { borderColor: current === value ? theme.primary : theme.border }]}>
          {current === value && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: Spacing.xl, alignItems: 'center', gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: FontSize.xxl, fontFamily: 'Inter-Bold', color: '#FFF' },
  farm: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter-Regular' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 100 },
  groupLabel: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, marginLeft: 4, marginTop: Spacing.lg },
  section: { padding: 0, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  itemIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { flex: 1, fontSize: FontSize.md },
  itemRight: { alignItems: 'flex-end' },
  divider: { height: 1, marginHorizontal: Spacing.md },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, marginTop: Spacing.xl },
  signOutText: { fontSize: FontSize.md },
  footer: { fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.xl, lineHeight: 22 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});
