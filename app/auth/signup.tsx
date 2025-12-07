import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    // Validation
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Please confirm your password');
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Password match validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Username validation
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: signUpError } = await signUp(
        email.trim(),
        password,
        {
          username: username.trim(),
          full_name: fullName.trim(),
        }
      );

      if (signUpError) {
        const errorMessage =
          signUpError?.message ||
          signUpError?.toString() ||
          'Failed to create account. Please try again.';
        setError(errorMessage);
        Alert.alert('Sign Up Failed', errorMessage);
        return;
      }

      // Success
      Alert.alert(
        'Success',
        'Account created successfully! You can now sign in.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to login or directly to tabs
              // If email confirmation is required, go to login
              // Otherwise, go directly to tabs
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo/Title Section */}
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: tintColor + '20' }]}>
                <Ionicons name="cube-outline" size={48} color={tintColor} />
              </View>
              <ThemedText type="title" style={styles.title}>
                Stockly
              </ThemedText>
              <ThemedText style={styles.subtitle}>Create Your Account</ThemedText>
            </View>

            {/* Signup Form */}
            <ThemedView style={styles.form}>
              <ThemedText type="subtitle" style={styles.formTitle}>
                Sign Up
              </ThemedText>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                </View>
              )}

              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Full Name</ThemedText>
                <View style={[styles.inputContainer, { borderColor: tintColor + '40' }]}>
                  <Ionicons name="person-outline" size={20} color={tintColor} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      setError(null);
                    }}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Username Input */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Username</ThemedText>
                <View style={[styles.inputContainer, { borderColor: tintColor + '40' }]}>
                  <Ionicons name="at-outline" size={20} color={tintColor} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Choose a username"
                    placeholderTextColor="#9CA3AF"
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      setError(null);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Email</ThemedText>
                <View style={[styles.inputContainer, { borderColor: tintColor + '40' }]}>
                  <Ionicons name="mail-outline" size={20} color={tintColor} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <View style={[styles.inputContainer, { borderColor: tintColor + '40' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={tintColor} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Create a password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError(null);
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Confirm Password</ThemedText>
                <View style={[styles.inputContainer, { borderColor: tintColor + '40' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={tintColor} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setError(null);
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={[
                  styles.signupButton,
                  { backgroundColor: tintColor },
                  loading && styles.signupButtonDisabled,
                ]}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="person-add-outline" size={24} color="#fff" />
                )}
                <ThemedText style={styles.signupButtonText}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </ThemedText>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <ThemedText style={styles.loginText}>Already have an account? </ThemedText>
                <TouchableOpacity
                  onPress={() => router.push('/auth/login' as any)}
                  disabled={loading}
                >
                  <ThemedText style={[styles.loginLink, { color: tintColor }]}>
                    Sign In
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  form: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    opacity: 0.6,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

