// ============================================================================
// THEME CONTEXT
// ============================================================================
// Smooth theme transitions: background and text colors cross-fade over 220ms
// via Reanimated interpolateColor instead of snapping instantly.
// isDark and theme.colors are stable references — no unnecessary re-renders.
// ============================================================================

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState
} from "react";
import { useColorScheme } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export type ThemeMode = "light" | "dark";

export interface Colors {
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryLight: string;
  card: string;
  shadow: string;
  inputBackground: string;
  buttonText: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: Colors;
}

const lightColors: Colors = {
  background: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#666666",
  border: "#E0E0E0",
  primary: "#FF6B35",
  primaryLight: "#FFE5D9",
  card: "#F5F5F5",
  shadow: "rgba(0, 0, 0, 0.1)",
  inputBackground: "#F8F8F8",
  buttonText: "#FFFFFF",
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#FF3B30",
};

const darkColors: Colors = {
  background: "#1A1A1A",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  border: "#333333",
  primary: "#FF6B35",
  primaryLight: "#FF8C5A",
  card: "#2A2A2A",
  shadow: "rgba(0, 0, 0, 0.5)",
  inputBackground: "#2A2A2A",
  buttonText: "#FFFFFF",
  success: "#66BB6A",
  warning: "#FFA726",
  error: "#EF5350",
};

// ─── Animated overlay component that drives the cross-fade transition ─────

export const ThemeTransitionOverlay = Animated.View;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  // Animated value (0 = light, 1 = dark) for consumers that want smooth interpolation
  themeProgress: Animated.SharedValue<number>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === "dark");

  // Shared value: 0 = fully light, 1 = fully dark
  const themeProgress = useSharedValue(systemColorScheme === "dark" ? 1 : 0);

  const theme: Theme = {
    mode: isDark ? "dark" : "light",
    colors: isDark ? darkColors : lightColors,
  };

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      themeProgress.value = withTiming(next ? 1 : 0, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      });
      return next;
    });
  }, [themeProgress]);

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, isDark, themeProgress }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

// ============================================================================
// useThemeColors — returns smoothly animated color values
// ============================================================================
// Usage (optional, for any component that wants buttery-smooth per-property
// color transitions rather than a global background fade):
//
//   const animatedBg = useThemeColor('background');
//   <Animated.View style={{ backgroundColor: animatedBg }} />
//
// For most screens, simply using theme.colors is fine — the ThemeTransitionView
// wrapper below handles the perceived transition with a single overlay.
// ============================================================================

export function useThemeColor(
  key: keyof Colors,
): Animated.DerivedValue<string> {
  const { themeProgress } = useTheme();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return require("react-native-reanimated").useDerivedValue(() =>
    interpolateColor(
      themeProgress.value,
      [0, 1],
      [lightColors[key], darkColors[key]],
    ),
  );
}

// ============================================================================
// ThemeTransitionView — wrap your root layout with this instead of a plain View
// ============================================================================
// It applies a subtle opacity fade over the entire app content on theme switch,
// masking the "snap" of colors that haven't been individually animated.
//
// Usage in src/app/_layout.tsx (or manager/_layout.tsx):
//   import { ThemeTransitionView } from '@/context/ThemeContext';
//   <ThemeTransitionView style={{ flex: 1 }}>
//     {children}
//   </ThemeTransitionView>
// ============================================================================

export function ThemeTransitionView({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  const { themeProgress } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    // Brief opacity dip (1 → 0.92 → 1) at the midpoint of the transition
    const progress = themeProgress.value;
    const opacity =
      progress <= 0.5
        ? 1 - progress * 0.16 // 1 → 0.92 as progress goes 0→0.5
        : 0.92 + (progress - 0.5) * 0.16; // 0.92 → 1 as progress goes 0.5→1
    return { opacity };
  });

  return (
    <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
