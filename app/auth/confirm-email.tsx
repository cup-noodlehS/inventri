import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { supabase } from '@/lib/supabase';

export default function ConfirmEmailScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check if we have a session (user confirmed email)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setStatus('error');
          setMessage('Failed to verify email. Please try again.');
          return;
        }

        if (session?.user) {
          // Email confirmed successfully
          setStatus('success');
          setMessage('Email confirmed successfully! Welcome to Stockly!');
          
          // Auto-redirect to app after 2 seconds
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 2000);
        } else {
          // No session yet, might still be processing
          setStatus('error');
          setMessage('Email confirmation link may have expired. Please try signing in.');
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('An error occurred. Please try signing in.');
      }
    };

    verifyEmail();
  }, []);

  const handleGoToLogin = () => {
    router.replace('/auth/login');
  };

  const handleGoToApp = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ThemedView style={styles.content}>
        <View style={styles.iconContainer}>
          {status === 'checking' && (
            <ActivityIndicator size="large" color={tintColor} />
          )}
          {status === 'success' && (
            <View style={[styles.successIcon, { backgroundColor: tintColor + '20' }]}>
              <Ionicons name="checkmark-circle" size={64} color={tintColor} />
            </View>
          )}
          {status === 'error' && (
            <View style={[styles.errorIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="close-circle" size={64} color="#EF4444" />
            </View>
          )}
        </View>

        <ThemedText type="title" style={styles.title}>
          {status === 'checking' && 'Verifying Email'}
          {status === 'success' && 'Email Confirmed!'}
          {status === 'error' && 'Verification Failed'}
        </ThemedText>

        <ThemedText style={styles.message}>{message}</ThemedText>

        {status === 'success' && (
          <View style={styles.successDetails}>
            <ThemedText style={styles.detailText}>
              You'll be redirected to the app shortly...
            </ThemedText>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor }]}
              onPress={handleGoToLogin}
            >
              <ThemedText style={styles.buttonText}>Go to Login</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {status === 'success' && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleGoToApp}
          >
            <ThemedText style={[styles.buttonText, { color: tintColor }]}>
              Continue to App
            </ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  successDetails: {
    marginBottom: 32,
  },
  detailText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
  },
  actions: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

