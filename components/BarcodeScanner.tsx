import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

// Try to import barcode scanner, but handle if native module isn't available
let BarCodeScanner: any = null;
let BarCodeScannerResult: any = null;
let isBarcodeScannerAvailable = false;

try {
  const barcodeScannerModule = require('expo-barcode-scanner');
  BarCodeScanner = barcodeScannerModule.BarCodeScanner;
  BarCodeScannerResult = barcodeScannerModule.BarCodeScannerResult;
  isBarcodeScannerAvailable = true;
} catch (error) {
  console.warn('expo-barcode-scanner native module not available. Barcode scanning will be disabled.');
  isBarcodeScannerAvailable = false;
}

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({
  visible,
  onClose,
  onScan,
}: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      if (!visible || !isBarcodeScannerAvailable || !BarCodeScanner) return;

      try {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');

        if (status !== 'granted') {
          Alert.alert(
            'Camera Permission Required',
            'Please grant camera permission to scan barcodes.',
            [
              {
                text: 'OK',
                onPress: onClose,
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error requesting barcode scanner permissions:', error);
        setHasPermission(false);
      }
    };

    getBarCodeScannerPermissions();
  }, [visible, onClose]);

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (scanned) return;

    setScanned(true);
    onScan(data);

    // Reset scanned state after a delay to allow scanning again
    setTimeout(() => {
      setScanned(false);
    }, 2000);
  };

  if (!visible) {
    return null;
  }

  // Show error if barcode scanner is not available
  if (!isBarcodeScannerAvailable || !BarCodeScanner) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Scan Barcode
            </ThemedText>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: tintColor }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.centerContent}>
            <Ionicons name="barcode-outline" size={64} color="#9CA3AF" />
            <ThemedText style={styles.errorText}>
              Barcode Scanner Not Available
            </ThemedText>
            <ThemedText style={styles.errorSubtext}>
              The barcode scanner requires a development build.{'\n'}
              Please create a development build to use this feature.
            </ThemedText>
          </View>
        </ThemedView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Scan Barcode
          </ThemedText>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: tintColor }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Camera View */}
        {hasPermission === null ? (
          <View style={styles.centerContent}>
            <ThemedText>Requesting camera permission...</ThemedText>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.centerContent}>
            <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
            <ThemedText style={styles.errorText}>
              Camera permission denied
            </ThemedText>
            <ThemedText style={styles.errorSubtext}>
              Please enable camera access in settings
            </ThemedText>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            {BarCodeScanner && (
              <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={styles.camera}
                barCodeTypes={['code128', 'qr']}
              />
            )}

            {/* Overlay */}
            <View style={styles.overlay}>
              {/* Top overlay */}
              <View style={styles.overlayTop} />

              {/* Middle section with scanner box */}
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={[styles.scannerBox, { borderColor: tintColor }]}>
                  <View style={[styles.corner, styles.topLeft, { borderColor: tintColor }]} />
                  <View style={[styles.corner, styles.topRight, { borderColor: tintColor }]} />
                  <View style={[styles.corner, styles.bottomLeft, { borderColor: tintColor }]} />
                  <View style={[styles.corner, styles.bottomRight, { borderColor: tintColor }]} />
                </View>
                <View style={styles.overlaySide} />
              </View>

              {/* Bottom overlay */}
              <View style={styles.overlayBottom}>
                <ThemedText style={styles.instructionText}>
                  Position the barcode within the frame
                </ThemedText>
                {scanned && (
                  <ThemedText style={styles.scannedText}>
                    Barcode scanned!
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        )}
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
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 250,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scannerBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    position: 'relative',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  scannedText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
});

