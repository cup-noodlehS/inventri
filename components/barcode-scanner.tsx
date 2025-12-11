import { Ionicons } from '@expo/vector-icons';
import { BarcodeType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  title?: string;
  subtitle?: string;
}

// Map old barcode types
const BARCODE_TYPES: BarcodeType[] = ['qr', 'code128', 'ean13', 'ean8'];

export function BarcodeScanner({
  visible,
  onClose,
  onScan,
  title = 'Scan Barcode',
  subtitle = 'Position the barcode within the frame',
}: BarcodeScannerProps) {
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    if (visible) {
      setScanned(false);
      // Request permission if not already granted
      if (permission && !permission.granted) {
        requestPermission();
      }
    }
  }, [visible, permission, requestPermission]);

  const handleBarCodeScanned = ({ data }: { data: string; type: string }) => {
    if (scanned) return;

    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Handle the scanned data
    onScan(data);
    
    // Auto-close after a short delay
    setTimeout(() => {
      onClose();
      setScanned(false);
    }, 500);
  };

  if (!visible) return null;

  // Handle case where permission is still loading
  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={tintColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.centerContent}>
            <ThemedText>Requesting camera permission...</ThemedText>
          </View>
        </ThemedView>
      </Modal>
    );
  }

  // Handle case where permission is denied
  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={tintColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.centerContent}>
            <Ionicons name="camera-outline" size={64} color="#EF4444" />
            <ThemedText style={styles.errorTitle}>Camera Permission Required</ThemedText>
            <ThemedText style={styles.errorText}>
              Please grant camera permission to scan barcodes.
            </ThemedText>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor }]}
              onPress={async () => {
                try {
                  await requestPermission();
                } catch (error) {
                  console.error('Error requesting permission:', error);
                  Alert.alert('Error', 'Failed to request camera permission');
                }
              }}
            >
              <ThemedText style={styles.buttonText}>Grant Permission</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        </View>

        {/* Scanner */}
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.scanner}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: BARCODE_TYPES,
            }}
          />
          
          {/* Overlay with scanning frame */}
          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={[styles.scanFrame, { borderColor: tintColor }]}>
                <View style={[styles.corner, styles.topLeft, { borderColor: tintColor }]} />
                <View style={[styles.corner, styles.topRight, { borderColor: tintColor }]} />
                <View style={[styles.corner, styles.bottomLeft, { borderColor: tintColor }]} />
                <View style={[styles.corner, styles.bottomRight, { borderColor: tintColor }]} />
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Ionicons name="information-circle-outline" size={20} color={tintColor} />
          <ThemedText style={styles.instructionText}>
            {scanned ? 'Barcode scanned! Processing...' : 'Point your camera at a barcode'}
          </ThemedText>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 250,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
  },
  topLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    gap: 8,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
