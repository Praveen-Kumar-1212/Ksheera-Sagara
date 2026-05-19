import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Radius, FontSize, Spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  isPassword,
  style,
  ...props
}: InputProps) {
  const { theme } = useApp();
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.error : focused ? theme.primary : theme.border;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: 'Inter-Medium' }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon && <View style={styles.sideIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              fontFamily: 'Inter-Regular',
              flex: 1,
            },
            style,
          ]}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={isPassword && !showPass}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.sideIcon}>
            {showPass ? (
              <EyeOff size={18} color={theme.textMuted} />
            ) : (
              <Eye size={18} color={theme.textMuted} />
            )}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.sideIcon}>{rightIcon}</View>
        ) : null}
      </View>
      {error && (
        <Text style={[styles.error, { color: theme.error, fontFamily: 'Inter-Regular' }]}>
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text style={[styles.hint, { color: theme.textMuted, fontFamily: 'Inter-Regular' }]}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  input: {
    fontSize: FontSize.md,
    paddingVertical: Spacing.sm,
  },
  sideIcon: {
    paddingHorizontal: 4,
  },
  error: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  hint: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});
