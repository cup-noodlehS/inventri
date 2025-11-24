import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
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
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Settings</ThemedText>
        </View>

        {/* User Profile Section */}
        <ThemedView style={[styles.profileCard, styles.card]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { backgroundColor: tintColor + '20' }]}>
              <Ionicons name="person" size={32} color={tintColor} />
            </View>
            <View style={styles.profileInfo}>
              <ThemedText type="subtitle" style={styles.profileName}>
                {fullName}
              </ThemedText>
              <ThemedText style={styles.profileUsername}>@{username}</ThemedText>
              <ThemedText style={styles.profileEmail}>{userEmail}</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Settings Section */}
        <ThemedView style={[styles.settingsSection, styles.card]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={24} color={tintColor} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Preferences
            </ThemedText>
          </View>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Minimum Stock Threshold</ThemedText>
            <TextInput 
              style={[styles.input, { borderColor: tintColor + '40', color: textColor }]} 
              keyboardType="numeric" 
              defaultValue="5" 
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Business Name</ThemedText>
            <TextInput 
              style={[styles.input, { borderColor: tintColor + '40', color: textColor }]} 
              defaultValue="My Perfume Shop" 
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Contact Info</ThemedText>
            <TextInput 
              style={[styles.input, { borderColor: tintColor + '40', color: textColor }]} 
              defaultValue="contact@perfumeshop.com" 
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Barcode Type</ThemedText>
            <View style={styles.switchContainer}>
              <ThemedText>Code128</ThemedText>
              <Switch
                value={barcodeType === 'QR'}
                onValueChange={() => setBarcodeType(barcodeType === 'QR' ? 'Code128' : 'QR')}
                trackColor={{ false: '#D1D5DB', true: tintColor }}
                thumbColor="#fff"
              />
              <ThemedText>QR</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: '#EF4444' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <ThemedText style={[styles.logoutButtonText, { color: '#EF4444' }]}>
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  profileCard: {
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    opacity: 0.5,
  },
  settingsSection: {
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    height: 48,
    borderWidth: 2,
    borderRadius: 12,
    marginTop: 4,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
