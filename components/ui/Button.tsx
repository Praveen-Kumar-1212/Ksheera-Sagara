import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { useApp } from '@/context/AppContext';
import { Radius, FontSize, Spacing } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const { theme } = useApp();

  const getBg = () => {
    if (disabled) return theme.border;
    switch (variant) {
      case 'primary': return theme.primary;
      case 'secondary': return theme.secondary;
      case 'danger': return theme.error;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textMuted;
    switch (variant) {
      case 'outline': return theme.primary;
      case 'ghost': return theme.primary;
      default: return '#FFFFFF';
    }
  };

  const getBorder = () => {
    switch (variant) {
      case 'outline': return theme.primary;
      default: return 'transparent';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingHorizontal: Spacing.md, paddingVertical: 8 };
      case 'lg': return { paddingHorizontal: Spacing.xl, paddingVertical: 16 };
      default: return { paddingHorizontal: Spacing.lg, paddingVertical: 13 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm': return FontSize.sm;
      case 'lg': return FontSize.lg;
      default: return FontSize.md;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        getPadding(),
        {
          backgroundColor: getBg(),
          borderColor: getBorder(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          width: fullWidth ? '100%' : undefined,
          borderRadius: Radius.md,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
});
