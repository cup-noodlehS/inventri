import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getUserPreferences, upsertUserPreferences } from '@/lib/api/preferences';
import { TransactionType } from '@/lib/types';

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
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [defaultTransactionType, setDefaultTransactionType] = useState<TransactionType>('Stock In');
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyShipmentDelay, setNotifyShipmentDelay] = useState(true);
  const [themePreference, setThemePreference] = useState<'system' | 'light' | 'dark'>('system');
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

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
  const transactionTypes: TransactionType[] = ['Stock In', 'Stock Out', 'Adjustment', 'Sale', 'Transfer'];
  const themeOptions: ('system' | 'light' | 'dark')[] = ['system', 'light', 'dark'];

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let isMounted = true;
    const load = async () => {
      try {
        setLoadingPrefs(true);
        const { data, error } = await getUserPreferences(user.id);
        if (!isMounted || error || !data) {
          if (error) {
            console.error('Preferences load error:', error);
          }
          return;
        }
        setBarcodeType(data.default_barcode_type || 'Code128');
        setLowStockThreshold(String(data.low_stock_threshold ?? 5));
        setDefaultTransactionType(data.default_transaction_type as TransactionType);
        setNotifyLowStock(Boolean(data.notify_low_stock));
        setNotifyShipmentDelay(Boolean(data.notify_shipment_delay));
        setThemePreference(data.theme_preference);
      } finally {
        if (isMounted) {
          setLoadingPrefs(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleSavePreferences = async () => {
    if (!user?.id) {
      return;
    }

    const parsedThreshold = Number(lowStockThreshold) || 0;

    try {
      setSavingPrefs(true);
      const { error } = await upsertUserPreferences(user.id, {
        default_barcode_type: barcodeType,
        default_transaction_type: defaultTransactionType,
        low_stock_threshold: parsedThreshold,
        notify_low_stock: notifyLowStock,
        notify_shipment_delay: notifyShipmentDelay,
        theme_preference: themePreference,
      });

      if (error) {
        console.error('Save prefs error:', error);
        Alert.alert('Error', error.message || 'Unable to save preferences.');
        return;
      }

      Alert.alert('Saved', 'Preferences updated successfully.');
    } finally {
      setSavingPrefs(false);
    }
  };

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

          {loadingPrefs && (
            <View style={styles.preferenceLoading}>
              <ActivityIndicator size="small" color={tintColor} />
              <ThemedText style={{ color: mutedColor }}>Loading preferences…</ThemedText>
            </View>
          )}

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
              value={lowStockThreshold}
              onChangeText={setLowStockThreshold}
              placeholderTextColor={mutedColor}
            />
          </View>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Default Transaction Type</ThemedText>
            <View style={styles.chipGroup}>
              {transactionTypes.map((type) => {
                const isActive = defaultTransactionType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.preferenceChip,
                      {
                        backgroundColor: isActive ? tintColor : surfaceAlt,
                        borderColor,
                      },
                    ]}
                    onPress={() => setDefaultTransactionType(type)}>
                    <ThemedText
                      style={[
                        styles.preferenceChipText,
                        { color: isActive ? '#fff' : textColor },
                      ]}>
                      {type}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
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

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
            <View style={styles.switchRow}>
              <ThemedText>Low Stock Alerts</ThemedText>
              <Switch
                value={notifyLowStock}
                onValueChange={setNotifyLowStock}
                trackColor={{ false: borderColor, true: tintColor }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.switchRow}>
              <ThemedText>Shipment Delays</ThemedText>
              <Switch
                value={notifyShipmentDelay}
                onValueChange={setNotifyShipmentDelay}
                trackColor={{ false: borderColor, true: tintColor }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Theme Preference</ThemedText>
            <View style={styles.chipGroup}>
              {themeOptions.map((option) => {
                const isActive = themePreference === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.preferenceChip,
                      {
                        backgroundColor: isActive ? tintColor : surfaceAlt,
                        borderColor,
                      },
                    ]}
                    onPress={() => setThemePreference(option)}>
                    <ThemedText
                      style={[
                        styles.preferenceChipText,
                        { color: isActive ? '#fff' : textColor },
                      ]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: tintColor },
              (savingPrefs || loadingPrefs) && { opacity: 0.7 },
            ]}
            onPress={handleSavePreferences}
            disabled={savingPrefs || loadingPrefs}
          >
            {savingPrefs ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="save-outline" size={20} color="#fff" />
            )}
            <ThemedText style={styles.saveButtonText}>
              {savingPrefs ? 'Saving…' : 'Save Preferences'}
            </ThemedText>
          </TouchableOpacity>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
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
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  preferenceChip: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  preferenceChipText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  preferenceLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
