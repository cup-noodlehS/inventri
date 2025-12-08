import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceAlt = useThemeColor({}, 'surfaceAlt');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'textMuted');
  const dangerColor = useThemeColor({}, 'danger');
  const [barcodeType, setBarcodeType] = useState('Code128');

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login' as any);
          },
        },
      ]
    );
  };

  // Get user metadata
  const username = user?.user_metadata?.username || 'N/A';
  const fullName = user?.user_metadata?.full_name || 'N/A';
  const userEmail = user?.email || 'N/A';

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Settings</ThemedText>
        </View>

        {/* User Profile Section */}
        <ThemedView style={[styles.profileCard, styles.card, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { backgroundColor: `${tintColor}20` }]}>
              <Ionicons name="person" size={32} color={tintColor} />
            </View>
            <View style={styles.profileInfo}>
              <ThemedText type="subtitle" style={styles.profileName}>
                {fullName}
              </ThemedText>
              <ThemedText style={[styles.profileUsername, { color: mutedColor }]}>@{username}</ThemedText>
              <ThemedText style={[styles.profileEmail, { color: mutedColor }]}>{userEmail}</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Settings Section */}
        <ThemedView style={[styles.settingsSection, styles.card, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={24} color={tintColor} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Preferences
            </ThemedText>
          </View>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Minimum Stock Threshold</ThemedText>
            <TextInput 
              style={[
                styles.input,
                {
                  borderColor,
                  color: textColor,
                  backgroundColor: surfaceAlt,
                },
              ]} 
              keyboardType="numeric" 
              defaultValue="5" 
              placeholderTextColor={mutedColor}
            />
          </View>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Barcode Type</ThemedText>
            <View style={styles.switchContainer}>
              <ThemedText>Code128</ThemedText>
              <Switch
                value={barcodeType === 'QR'}
                onValueChange={() => setBarcodeType(barcodeType === 'QR' ? 'Code128' : 'QR')}
                trackColor={{ false: borderColor, true: tintColor }}
                thumbColor="#fff"
              />
              <ThemedText>QR</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: dangerColor }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color={dangerColor} />
          <ThemedText style={[styles.logoutButtonText, { color: dangerColor }]}>
            Sign Out
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  profileCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs / 2,
  },
  profileUsername: {
    fontSize: 14,
  },
  profileEmail: {
    fontSize: 12,
  },
  settingsSection: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
  },
  settingItem: {
    marginBottom: Spacing.lg,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
