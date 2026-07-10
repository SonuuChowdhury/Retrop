// ============================================================================
// APP DIALOG COMPONENT
// ============================================================================
// Centralized, theme-aware custom dialog that replaces all Alert.alert calls.
// Rendered at the root level via DialogContext — fully animated and on-brand.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface DialogConfig {
  type?: DialogType;
  title: string;
  message?: string;
  buttons?: DialogButton[];
}

interface AppDialogProps {
  visible: boolean;
  config: DialogConfig | null;
  onDismiss: () => void;
}

// ─── Icon per type ─────────────────────────────────────────────────────────

const TYPE_ICON: Record<DialogType, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✕',
  confirm: '?',
};

// ─── Component ─────────────────────────────────────────────────────────────

export function AppDialog({ visible, config, onDismiss }: AppDialogProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const AnimatedView = Animated.View as any;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 18,
          stiffness: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.88,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!config) return null;

  const type: DialogType = config.type ?? 'info';
  const buttons: DialogButton[] = config.buttons ?? [{ text: 'OK', style: 'default' }];

  // ─── Accent color per type ─────────────────────────────────────────────
  const accentMap: Record<DialogType, string> = {
    info: c.primary,
    success: c.success,
    warning: c.warning,
    error: c.error,
    confirm: c.primary,
  };
  const accent = accentMap[type];

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      {/* Backdrop */}
      <AnimatedView style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </AnimatedView>

      {/* Dialog Card */}
      <View style={styles.centeredContainer} pointerEvents="box-none">
        <AnimatedView
          style={[
            styles.card,
            {
              backgroundColor: c.card,
              shadowColor: c.shadow,
              borderColor: c.border,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Icon badge */}
          <View style={[styles.iconBadge, { backgroundColor: accent + '20' }]}>
            <Text style={[styles.iconText, { color: accent }]}>{TYPE_ICON[type]}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: c.text }]}>{config.title}</Text>

          {/* Message */}
          {!!config.message && (
            <Text style={[styles.message, { color: c.textSecondary }]}>{config.message}</Text>
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: c.border }]} />

          {/* Buttons */}
          <View style={[styles.buttonsRow, buttons.length === 1 && styles.buttonsSingle]}>
            {buttons.map((btn, idx) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const isLast = idx === buttons.length - 1;

              const btnColor = isDestructive ? c.error : isCancel ? c.textSecondary : accent;
              const isFilled = !isCancel && isLast;

              return (
                <Pressable
                  key={idx}
                  style={({ pressed }) => [
                    styles.button,
                    buttons.length === 2 && styles.buttonHalf,
                    isFilled
                      ? [styles.buttonFilled, { backgroundColor: btnColor }]
                      : [styles.buttonOutline, { borderColor: btnColor + '40' }],
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => {
                    onDismiss();
                    btn.onPress?.();
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isFilled
                        ? { color: '#FFFFFF', fontWeight: '700' }
                        : { color: btnColor, fontWeight: '600' },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </AnimatedView>
      </View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 4,
  },
  divider: {
    width: '100%',
    height: 1,
    marginTop: 20,
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  buttonsSingle: {
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHalf: {
    flex: 1,
  },
  buttonFilled: {
    // backgroundColor set dynamically
  },
  buttonOutline: {
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
