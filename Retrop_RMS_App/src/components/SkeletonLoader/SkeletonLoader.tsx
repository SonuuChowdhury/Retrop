import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 6,
  style,
}: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  const AnimatedView = Animated.View as any;
  return (
    <AnimatedView
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ colors }: { colors: any }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={styles.col}>
          <SkeletonLoader width={80} height={14} />
          <SkeletonLoader width={50} height={10} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={12} style={{ marginTop: 12 }} />
      <SkeletonLoader width="60%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.rowItem}>
      <SkeletonLoader width={36} height={36} borderRadius={8} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonLoader width="70%" height={14} />
        <SkeletonLoader width="40%" height={10} />
      </View>
      <SkeletonLoader width={50} height={14} />
    </View>
  );
}

export function SkeletonKPI({ colors }: { colors: any }) {
  return (
    <View style={[styles.kpi, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonLoader width={46} height={46} borderRadius={23} style={{ marginBottom: 10 }} />
      <SkeletonLoader width="50%" height={18} style={{ marginBottom: 6 }} />
      <SkeletonLoader width="70%" height={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#88888825',
  },
  card: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  kpi: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    minWidth: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  col: {
    flex: 1,
  },
});
