import { StyleSheet, Text, View, Pressable, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenAnimationWrapper } from '@/components/ScreenAnimationWrapper';

export default function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScreenAnimationWrapper>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
      {/* Back Button */}
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          {
            opacity: pressed ? 0.6 : 1,
            marginTop: insets.top + 4,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={theme.colors.primary}
        />
      </Pressable>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Login Coming Soon
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          The login functionality will be implemented in the next step.
        </Text>
      </View>
    </SafeAreaView>
    </ScreenAnimationWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 12,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
