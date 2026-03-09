import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { signupWithEmail, loginWithEmail, loginWithGoogle } from '../../utils/api';
import { Colors } from '../../constants/Theme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Load Google Sign-In script on web
const loadGoogleScript = () => {
  if (Platform.OS !== 'web') return;
  if (document.getElementById('google-signin-script')) return;
  const script = document.createElement('script');
  script.id = 'google-signin-script';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => { loadGoogleScript(); }, []);

  const showError = (msg: string) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Error', msg);
  };

  const handleEmailAuth = async () => {
    if (!email.trim()) return showError('Please enter your email');
    if (!password.trim() || password.length < 6) return showError('Password must be at least 6 characters');
    if (isSignUp && !name.trim()) return showError('Please enter your name');

    setLoading(true);
    try {
      const response = isSignUp
        ? await signupWithEmail(name.trim(), email.trim(), password)
        : await loginWithEmail(email.trim(), password);

      if (response.success) {
        await login(response.user, response.token);
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Authentication failed';
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS !== 'web') {
      showError('Google Sign-In is available on web only for now.');
      return;
    }

    setGoogleLoading(true);
    try {
      const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '237070794063-3i6vkugt6n0n4s7ejhv7ace2hiumspjb.apps.googleusercontent.com';
      if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
        showError('Google Client ID not configured. To enable Google Sign-In, add EXPO_PUBLIC_GOOGLE_CLIENT_ID to frontend/.env');
        setGoogleLoading(false);
        return;
      }

      const google = (window as any).google;
      if (!google?.accounts?.id) {
        showError('Google Sign-In is still loading. Please try again.');
        setGoogleLoading(false);
        return;
      }

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            const result = await loginWithGoogle(response.credential);
            if (result.success) {
              await login(result.user, result.token);
              router.replace('/(tabs)/home');
            }
          } catch (err: any) {
            showError(err.response?.data?.detail || err.message || 'Google sign-in failed');
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const btnDiv = document.getElementById('google-btn-container');
          if (btnDiv) {
            btnDiv.innerHTML = '';
            google.accounts.id.renderButton(btnDiv, {
              type: 'standard', theme: 'outline', size: 'large',
              text: 'continue_with', width: 320,
            });
          }
          setGoogleLoading(false);
        }
      });
    } catch (error: any) {
      showError(error.message || 'Google Sign-In failed');
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={[styles.card, isWeb && width > 768 && styles.cardWeb]}>
              {/* Header */}
              <View style={styles.header}>
                <Image
                  source={require('../../assets/images/jazline-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.title}>
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </Text>
                <Text style={styles.subtitle}>
                  {isSignUp ? 'Sign up to buy or rent medical equipment' : 'Login to your Jazline account'}
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {isSignUp && (
                  <>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={18} color="#90A4AE" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor="#B0BEC5"
                        value={name}
                        onChangeText={setName}
                      />
                    </View>
                  </>
                )}

                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color="#90A4AE" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#B0BEC5"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#90A4AE" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={isSignUp ? 'Create password (min 6 chars)' : 'Enter your password'}
                    placeholderTextColor="#B0BEC5"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#90A4AE" />
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity style={styles.primaryButton} onPress={handleEmailAuth} disabled={loading} activeOpacity={0.8}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {isSignUp ? 'Create Account' : 'Login'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign In */}
                <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={googleLoading} activeOpacity={0.8}>
                  {googleLoading ? (
                    <ActivityIndicator color="#333" size="small" />
                  ) : (
                    <>
                      <Image
                        source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                        style={styles.googleIcon}
                        defaultSource={require('../../assets/images/app-image.png')}
                      />
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {isWeb && (
                  <View style={styles.googleFallback} nativeID="google-btn-container" />
                )}

                {/* Toggle */}
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleText}>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  </Text>
                  <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setName(''); setEmail(''); setPassword(''); }}>
                    <Text style={styles.toggleLink}>{isSignUp ? 'Login' : 'Sign Up'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Trust badges */}
              <View style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <Ionicons name="lock-closed" size={12} color="#90A4AE" />
                  <Text style={styles.trustText}>Secure</Text>
                </View>
                <View style={styles.trustItem}>
                  <Ionicons name="shield-checkmark" size={12} color="#90A4AE" />
                  <Text style={styles.trustText}>HIPAA Safe</Text>
                </View>
                <View style={styles.trustItem}>
                  <Ionicons name="checkmark-circle" size={12} color="#90A4AE" />
                  <Text style={styles.trustText}>Verified</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: '100%' as any },
  card: { backgroundColor: '#FFFFFF', borderRadius: 28, width: '100%', maxWidth: 440, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 5 },
  cardWeb: { padding: 48 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 180, height: 60, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A2138', marginBottom: 8, letterSpacing: -0.5, fontFamily: "'Playfair Display', 'Times New Roman', serif" },
  subtitle: { fontSize: 14, color: '#78909C', textAlign: 'center', lineHeight: 20 },
  form: { width: '100%' },
  label: { fontSize: 13, fontWeight: '700', color: '#455A64', marginBottom: 8, letterSpacing: 0.3 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderWidth: 1.5, borderColor: '#E8ECF0', borderRadius: 14, paddingHorizontal: 16, marginBottom: 18, height: 54 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#1A2138', height: '100%', ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
  eyeBtn: { padding: 4 },
  primaryButton: { backgroundColor: Colors.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 22, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8ECF0' },
  dividerText: { fontSize: 12, color: '#90A4AE', fontWeight: '600' },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 14, height: 54, gap: 10 },
  googleIcon: { width: 20, height: 20 },
  googleButtonText: { fontSize: 15, fontWeight: '700', color: '#455A64' },
  googleFallback: { alignItems: 'center', marginTop: 12 },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 6 },
  toggleText: { fontSize: 14, color: '#78909C' },
  toggleLink: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  trustRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28, gap: 20 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { fontSize: 12, color: '#90A4AE', fontWeight: '600' },
});