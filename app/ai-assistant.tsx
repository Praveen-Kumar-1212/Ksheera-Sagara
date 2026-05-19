import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Bot, User, ArrowLeft, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  'How to increase milk production?',
  'How to reduce feed costs?',
  'Signs of mastitis in cows?',
  'Best breed for Karnataka?',
  'Government schemes for dairy?',
  'ಹಾಲಿನ ಉತ್ಪಾದನೆ ಹೇಗೆ ಹೆಚ್ಚಿಸಬಹುದು?',
];

export default function AIAssistantScreen() {
  const { theme, t, session, profile } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: t('aiWelcome'),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const token = s?.access_token;
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/dairy-ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: msg,
          farmContext: {
            activeCows: profile?.total_cows || 0,
            farmName: profile?.farm_name,
          },
        }),
      });

      const data = await response.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Sorry, I could not process your request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please check your connection and try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={[styles.aiAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Bot size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t('aiChat')}</Text>
            <Text style={styles.headerSub}>Dairy Expert AI</Text>
          </View>
        </View>
        <View style={[styles.statusDot, { backgroundColor: '#4ADE80' }]} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick questions */}
          {messages.length === 1 && (
            <View style={styles.quickSection}>
              <Text style={[styles.quickTitle, { color: theme.textMuted, fontFamily: 'Inter-Medium' }]}>
                Quick Questions
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
                {QUICK_QUESTIONS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.quickChip, { backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}25` }]}
                    onPress={() => sendMessage(q)}
                  >
                    <Sparkles size={12} color={theme.primary} />
                    <Text style={[styles.quickText, { color: theme.primary, fontFamily: 'Inter-Regular' }]}>
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {loading && (
            <View style={styles.typingRow}>
              <View style={[styles.typingBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.typingText, { color: theme.textMuted, fontFamily: 'Inter-Regular' }]}>
                  {t('thinking')}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, fontFamily: 'Inter-Regular' }]}
            placeholder={t('askAI')}
            placeholderTextColor={theme.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: input.trim() ? theme.primary : theme.border }]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const { theme } = useApp();
  const isUser = message.role === 'user';

  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {!isUser && (
        <View style={[styles.msgAvatar, { backgroundColor: `${theme.primary}15` }]}>
          <Bot size={16} color={theme.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: theme.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderBottomLeftRadius: 4 },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            {
              color: isUser ? '#FFFFFF' : theme.text,
              fontFamily: 'Inter-Regular',
            },
          ]}
        >
          {message.content}
        </Text>
        <Text style={[styles.timeText, { color: isUser ? 'rgba(255,255,255,0.6)' : theme.textMuted, fontFamily: 'Inter-Regular' }]}>
          {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {isUser && (
        <View style={[styles.msgAvatar, { backgroundColor: `${theme.secondary}15` }]}>
          <User size={16} color={theme.secondary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontFamily: 'Inter-Bold', color: '#FFF' },
  headerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter-Regular' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  messages: { flex: 1 },
  messagesContent: { padding: Spacing.md, paddingBottom: Spacing.lg },
  quickSection: { marginBottom: Spacing.lg },
  quickTitle: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  quickScroll: { marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  quickText: { fontSize: FontSize.sm },
  msgRow: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'flex-end', gap: Spacing.sm },
  msgRowUser: { justifyContent: 'flex-end' },
  msgAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '75%', borderRadius: Radius.lg, padding: Spacing.md },
  bubbleText: { fontSize: FontSize.md, lineHeight: 22 },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  typingRow: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'center', gap: Spacing.sm },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  typingText: { fontSize: FontSize.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    maxHeight: 100,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
