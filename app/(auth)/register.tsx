import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Phone, Hop as Home, Droplets } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius } from '@/constants/theme';

export default function RegisterScreen() {
  const { theme, t } = useApp();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    farmName: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.fullName || !form.email || !form.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.fullName,
        phone: form.phone,
        farm_name: form.farmName || 'My Farm',
        language: 'en',
        dark_mode: false,
      });
    }
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.hero}
      >
        <View style={[styles.logoCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Droplets size={40} color="#FFFFFF" strokeWidth={1.5} />
        </View>
        <Text style={styles.appName}>{t('appName')}</Text>
        <Text style={styles.tagline}>Start managing your dairy farm smartly</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.form, { backgroundColor: theme.background }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.formTitle, { color: theme.text, fontFamily: 'Inter-Bold' }]}>
              Create Account
            </Text>
            <Text style={[styles.formSub, { color: theme.textSecondary, fontFamily: 'Inter-Regular' }]}>
              Join thousands of dairy farmers
            </Text>

            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: `${theme.error}15`, borderColor: `${theme.error}40` }]}>
                <Text style={[{ color: theme.error, fontFamily: 'Inter-Regular', fontSize: FontSize.sm }]}>{error}</Text>
              </View>
            ) : null}

            <Input label={t('fullName')} placeholder="Raju Gowda" value={form.fullName} onChangeText={update('fullName')}
              leftIcon={<User size={18} color={theme.textMuted} />} />
            <Input label={t('email')} placeholder="farmer@gmail.com" value={form.email} onChangeText={update('email')}
              keyboardType="email-address" autoCapitalize="none"
              leftIcon={<Mail size={18} color={theme.textMuted} />} />
            <Input label={t('phone')} placeholder="+91 9876543210" value={form.phone} onChangeText={update('phone')}
              keyboardType="phone-pad" leftIcon={<Phone size={18} color={theme.textMuted} />} />
            <Input label={t('farmName')} placeholder="Gowda Dairy Farm" value={form.farmName} onChangeText={update('farmName')}
              leftIcon={<Home size={18} color={theme.textMuted} />} />
            <Input label={t('password')} placeholder="••••••••" value={form.password} onChangeText={update('password')}
              isPassword leftIcon={<Lock size={18} color={theme.textMuted} />} />
            <Input label={t('confirmPassword')} placeholder="••••••••" value={form.confirmPassword} onChangeText={update('confirmPassword')}
              isPassword leftIcon={<Lock size={18} color={theme.textMuted} />} />

            <Button title={t('signUp')} onPress={handleRegister} loading={loading} fullWidth size="lg" style={{ marginTop: Spacing.sm }} />
          </View>

          <View style={styles.bottomRow}>
            <Text style={[styles.bottomText, { color: theme.textSecondary, fontFamily: 'Inter-Regular' }]}>
              {t('hasAccount')}{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.bottomLink, { color: theme.primary, fontFamily: 'Inter-SemiBold' }]}>
                  {t('signIn')}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: FontSize.xxl,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter-Regular',
  },
  form: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  formTitle: {
    fontSize: FontSize.xxl,
    marginBottom: 4,
  },
  formSub: {
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  errorBanner: {
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  bottomText: { fontSize: FontSize.md },
  bottomLink: { fontSize: FontSize.md },
});
