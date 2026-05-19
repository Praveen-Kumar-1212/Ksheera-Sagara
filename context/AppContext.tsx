import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { strings, Language } from '@/constants/i18n';
import type { Session } from '@supabase/supabase-js';

type Theme = typeof Colors.light;

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  farm_name: string;
  location: string;
  language: Language;
  dark_mode: boolean;
  total_cows: number;
}

interface AppContextType {
  session: Session | null;
  profile: Profile | null;
  theme: Theme;
  isDark: boolean;
  language: Language;
  t: (key: keyof typeof strings.en) => string;
  toggleDarkMode: () => void;
  setLanguage: (lang: Language) => void;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguageState] = useState<Language>('en');
  const [loading, setLoading] = useState(true);

  const theme = isDark ? Colors.dark : Colors.light;

  const t = useCallback(
    (key: keyof typeof strings.en): string => {
      return (strings[language] as typeof strings.en)[key] || strings.en[key] || key;
    },
    [language]
  );

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (data) {
      setProfile(data);
      setIsDark(data.dark_mode ?? false);
      setLanguageState((data.language as Language) ?? 'en');
    }
  };

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await loadProfile(session.user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user?.id) loadProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user?.id) {
        loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleDarkMode = async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    if (session?.user?.id) {
      await supabase.from('profiles').update({ dark_mode: newVal }).eq('id', session.user.id);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    if (session?.user?.id) {
      await supabase.from('profiles').update({ language: lang }).eq('id', session.user.id);
    }
  };

  return (
    <AppContext.Provider
      value={{ session, profile, theme, isDark, language, t, toggleDarkMode, setLanguage, refreshProfile, loading }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
