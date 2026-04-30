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
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../../services/api';
import { ENDPOINTS } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../utils/constants';
import { theme } from '../../styles/theme';

const FIELDS = [
  { key: 'full_name', label: 'Full Name', autoCapitalize: 'words' },
  { key: 'username', label: 'Username', autoCapitalize: 'none' },
  { key: 'email', label: 'Email Address', keyboard: 'email-address', autoCapitalize: 'none' },
  { key: 'phone', label: 'Phone Number (optional)', keyboard: 'phone-pad', autoCapitalize: 'none' },
  { key: 'password', label: 'Password', secure: true, autoCapitalize: 'none' },
  { key: 'confirmPassword', label: 'Confirm Password', secure: true, autoCapitalize: 'none' },
];

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    full_name: '', username: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();

  const headerAnim = useRef(new Animated.Value(-60)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(50)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  const labelAnims = useRef(
    Object.fromEntries(FIELDS.map(f => [f.key, new Animated.Value(form[f.key] ? 1 : 0)]))
  ).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.parallel([
        Animated.spring(headerAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(cardAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      Animated.timing(footerOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const floatLabel = (key, up) => {
    Animated.spring(labelAnims[key], {
      toValue: up ? 1 : 0,
      tension: 80,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const handleRegister = async () => {
    const { full_name, username, email, phone, password, confirmPassword } = form;

    if (!full_name || !username || !email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(ENDPOINTS.REGISTER, {
        full_name: full_name.trim(),
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      const { data } = response;
      
      if (data.success) {
        await saveAuth(data.token, data.user);
        // Navigation will be handled automatically
      } else {
        Alert.alert('Registration Failed', data.message || 'Something went wrong.');
      }
    } catch (error) {
      if (error.response) {
        Alert.alert('Error', error.response.data.message || 'Registration failed');
      } else if (error.request) {
        Alert.alert('Network Error', 'Could not connect to server. Please check your internet connection.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const isFocused = focusedField === field.key;
    const isPassField = field.key === 'password';
    const isConfirmPassField = field.key === 'confirmPassword';
    const showingPass = isPassField ? showPass : isConfirmPassField ? showConfirmPass : false;
    const togglePass = isPassField
      ? () => setShowPass(v => !v)
      : () => setShowConfirmPass(v => !v);

    return (
      <View key={field.key} style={styles.fieldWrapper}>
        <Animated.Text
          style={[
            styles.floatingLabel,
            {
              top: labelAnims[field.key].interpolate({ inputRange: [0, 1], outputRange: [18, -8] }),
              fontSize: labelAnims[field.key].interpolate({ inputRange: [0, 1], outputRange: [15, 12] }),
              color: isFocused ? COLORS.primary : '#9b8ab8',
            },
          ]}
        >
          {field.label}
        </Animated.Text>
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            (isPassField || isConfirmPassField) && { paddingRight: 50 },
          ]}
          value={form[field.key]}
          onChangeText={val => setForm(prev => ({ ...prev, [field.key]: val }))}
          onFocus={() => {
            setFocusedField(field.key);
            floatLabel(field.key, true);
          }}
          onBlur={() => {
            setFocusedField(null);
            if (!form[field.key]) floatLabel(field.key, false);
          }}
          secureTextEntry={field.secure && !showingPass}
          keyboardType={field.keyboard || 'default'}
          autoCapitalize={field.autoCapitalize || 'sentences'}
          autoCorrect={false}
          returnKeyType="next"
        />
        {(isPassField || isConfirmPassField) && (
          <TouchableOpacity style={styles.eyeBtn} onPress={togglePass}>
            <Text style={styles.eyeIcon}>{showingPass ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { transform: [{ translateY: headerAnim }], opacity: headerOpacity },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSub}>Join MyExpendo and take control of your money</Text>
      </Animated.View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: cardAnim }], opacity: cardOpacity },
          ]}
        >
          <Text style={styles.sectionLabel}>Personal Info</Text>
          {renderField(FIELDS[0])}
          {renderField(FIELDS[1])}
          {renderField(FIELDS[2])}
          {renderField(FIELDS[3])}

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Security</Text>
          {renderField(FIELDS[4])}
          {renderField(FIELDS[5])}

          {/* Register button */}
          <TouchableOpacity
            style={[theme.button, { marginTop: 24 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={theme.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Login link */}
        <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  backBtn: {
    marginBottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  fieldWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  floatingLabel: {
    position: 'absolute',
    left: 14,
    backgroundColor: COLORS.white,
    paddingHorizontal: 4,
    zIndex: 1,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 10,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#7a6b99',
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});