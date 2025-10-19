import { useState } from 'react';
import { StyleSheet, View, TextInput, Switch } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SettingsScreen() {
  const [barcodeType, setBarcodeType] = useState('Code128');

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Settings</ThemedText>

      <View style={styles.settingItem}>
        <ThemedText>Minimum Stock Threshold</ThemedText>
        <TextInput style={styles.input} keyboardType="numeric" defaultValue="5" />
      </View>

      <View style={styles.settingItem}>
        <ThemedText>Business Name</ThemedText>
        <TextInput style={styles.input} defaultValue="My Perfume Shop" />
      </View>

      <View style={styles.settingItem}>
        <ThemedText>Contact Info</ThemedText>
        <TextInput style={styles.input} defaultValue="contact@perfumeshop.com" />
      </View>

      <View style={styles.settingItem}>
        <ThemedText>Barcode Type</ThemedText>
        <View style={styles.switchContainer}>
          <ThemedText>Code128</ThemedText>
          <Switch
            value={barcodeType === 'QR'}
            onValueChange={() => setBarcodeType(barcodeType === 'QR' ? 'Code128' : 'QR')}
          />
          <ThemedText>QR</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  settingItem: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 5,
    paddingHorizontal: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
});
