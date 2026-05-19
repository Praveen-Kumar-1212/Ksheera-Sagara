import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Droplets } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius } from '@/constants/theme';

export default function LoginScreen() {
  const { theme, t } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.heroSection}
      >
        <View style={styles.logoWrap}>
          <View style={[styles.logoCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Droplets size={48} color="#FFFFFF" strokeWidth={1.5} />
          </View>
        </View>
        <Text style={styles.appName}>{t('appName')}</Text>
        <Text style={styles.tagline}>{t('appTagline')}</Text>
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
              {t('signIn')}
            </Text>
            <Text style={[styles.formSubtitle, { color: theme.textSecondary, fontFamily: 'Inter-Regular' }]}>
              Welcome back to your farm dashboard
            </Text>

            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: `${theme.error}15`, borderColor: `${theme.error}40` }]}>
                <Text style={[styles.errorText, { color: theme.error, fontFamily: 'Inter-Regular' }]}>{error}</Text>
              </View>
            ) : null}

            <Input
              label={t('email')}
              placeholder="farmer@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={18} color={theme.textMuted} />}
            />
            <Input
              label={t('password')}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon={<Lock size={18} color={theme.textMuted} />}
            />

            <TouchableOpacity style={styles.forgotRow}>
              <Text style={[styles.forgot, { color: theme.primary, fontFamily: 'Inter-Medium' }]}>
                {t('forgotPassword')}
              </Text>
            </TouchableOpacity>

            <Button
              title={t('signIn')}
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />
          </View>

          <View style={styles.bottomRow}>
            <Text style={[styles.bottomText, { color: theme.textSecondary, fontFamily: 'Inter-Regular' }]}>
              {t('noAccount')}{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.bottomLink, { color: theme.primary, fontFamily: 'Inter-SemiBold' }]}>
                  {t('signUp')}
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
  heroSection: {
    paddingTop: 72,
    paddingBottom: 48,
    alignItems: 'center',
  },
  logoWrap: {
    marginBottom: Spacing.md,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: FontSize.xxxl,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
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
  formSubtitle: {
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  errorBanner: {
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  errorText: {
    fontSize: FontSize.sm,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.sm,
    marginTop: -Spacing.sm,
  },
  forgot: {
    fontSize: FontSize.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  bottomText: {
    fontSize: FontSize.md,
  },
  bottomLink: {
    fontSize: FontSize.md,
  },
});
