import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import api from '../../services/api';
import { ENDPOINTS } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';

const PRIMARY      = '#4F46E5';
const PRIMARY_DARK = '#3730A3';
const WHITE        = '#FFFFFF';
const BG           = '#F5F6FA';
const TEXT         = '#1E1B4B';
const TEXT_SUB     = '#6B7280';
const BORDER       = '#E5E7EB';
const BORDER_FOCUS = '#4F46E5';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState(null);
  const { saveAuth } = useAuth();

  const headerY  = useRef(new Animated.Value(-40)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const cardY    = useRef(new Animated.Value(60)).current;
  const cardOp   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.parallel([
        Animated.spring(headerY, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
        Animated.timing(headerOp, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(cardY, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
        Animated.timing(cardOp, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(ENDPOINTS.LOGIN, {
        username: username.trim(),
        password,
      });
      if (data.success) {
        await saveAuth(data.token, data.user);
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials.');
      }
    } catch (err) {
      if (err.response) {
        Alert.alert('Error', err.response.data.message || 'Login failed');
      } else if (err.request) {
        Alert.alert('Network Error', 'Could not connect. Check your connection.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_DARK} />

      {/* ── Purple header ─────────────────────────────── */}
      <Animated.View
        style={[
          styles.header,
          { transform: [{ translateY: headerY }], opacity: headerOp },
        ]}
      >
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        {/* Replace with your actual icon or remove if no asset */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>💰</Text>
        </View>
        <Text style={styles.appName}>MyExpendo</Text>
        <Text style={styles.appTagline}>Track. Plan. Spend Smart.</Text>
      </Animated.View>

      {/* ── White card ────────────────────────────────── */}
      <Animated.View
        style={[
          styles.card,
          { transform: [{ translateY: cardY }], opacity: cardOp },
        ]}
      >
        <Text style={styles.cardTitle}>Welcome Back</Text>
        <Text style={styles.cardSub}>Login to continue to your account</Text>

        {/* Username */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Username or Email</Text>
          <View style={[styles.inputRow, focused === 'user' && styles.inputRowFocused]}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter username or email"
              placeholderTextColor="#B0AECB"
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocused('user')}
              onBlur={() => setFocused(null)}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              // ✅ Prevents keyboard dismiss on tap
              blurOnSubmit={false}
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputRow, focused === 'pass' && styles.inputRowFocused]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter password"
              placeholderTextColor="#B0AECB"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('pass')}
              onBlur={() => setFocused(null)}
              secureTextEntry={!showPass}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPass(v => !v)}
              style={styles.eyeBtn}
              // ✅ Prevents keyboard from closing when tapping eye icon
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot password */}
        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.75 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={WHITE} />
            : <Text style={styles.loginBtnText}>Login</Text>
          }
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social buttons */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialLabel}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Text style={styles.socialIcon}></Text>
            <Text style={styles.socialLabel}>Apple</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ Sign Up moved inside card */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    backgroundColor: PRIMARY,
    paddingTop: 56,
    paddingBottom: 36,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#818CF8',
    opacity: 0.35,
  },
  blob2: {
    position: 'absolute',
    bottom: -30,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3730A3',
    opacity: 0.45,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    color: WHITE,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  appTagline: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // ── Card ────────────────────────────────────────────────
  card: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: TEXT_SUB,
    marginBottom: 24,
  },

  // ── Fields ──────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: WHITE,
  },
  inputRowFocused: {
    borderColor: BORDER_FOCUS,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
    paddingVertical: 10,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 17,
  },

  // ── Forgot ──────────────────────────────────────────────
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 2,
  },
  forgotText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Login button ────────────────────────────────────────
  loginBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Divider ─────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 13,
    color: TEXT_SUB,
  },

  // ── Social ──────────────────────────────────────────────
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 11,
    gap: 8,
    backgroundColor: WHITE,
  },
  socialIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
  },

  // ── Footer (now inside card) ─────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerText: {
    color: TEXT_SUB,
    fontSize: 14,
  },
  footerLink: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  },
});