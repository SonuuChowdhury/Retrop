import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/context/ThemeContext';

interface CustomSplashScreenProps {
  colors: Colors;
  isDark: boolean;
}

export default function CustomSplashScreen({ colors, isDark }: CustomSplashScreenProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View 
        entering={FadeIn.duration(600)}
        style={styles.logoContainer}
      >
        <Image
          source={require('../../assets/images/logo-rounded.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(200).duration(600)}
        style={styles.textContainer}
      >
        <Text style={[styles.title, { color: colors.text }]}>Retrop RMS</Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>RESTAURANT MANAGEMENT</Text>
      </Animated.View>

      <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />

      <View style={styles.footerContainer}>
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
        <Text style={[styles.poweredText, { color: colors.textSecondary + '80' }]}>Powered by Retrop</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  loader: {
    marginTop: 40,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  poweredText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
