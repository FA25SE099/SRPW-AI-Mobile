/**
 * Simple Modern Login Screen
 * Clean authentication screen with minimal design
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Text,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../../theme';
import { Button, Spacer } from '../../components/ui';
import { useLogin } from '../../libs/auth';
import { Ionicons } from '@expo/vector-icons';

export const LoginScreen = () => {
  const router = useRouter();
  const login = useLogin();
  
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ credential: '', password: '' });

  // Auto-detect if input is email or phone number
  const isEmail = (input: string) => {
    return input.includes('@');
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { credential: '', password: '' };

    if (!credential) {
      newErrors.credential = 'Email or phone number is required';
      valid = false;
    } else if (isEmail(credential)) {
      // Validate as email
      if (!/\S+@\S+\.\S+/.test(credential)) {
        newErrors.credential = 'Email is invalid';
        valid = false;
      }
    } else {
      // Validate as phone number
      if (!/^[+]?[\d\s-()]+$/.test(credential)) {
        newErrors.credential = 'Phone number is invalid';
        valid = false;
      }
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 5) {
      newErrors.password = 'Password must be at least 5 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login.mutateAsync({
        email: isEmail(credential) ? credential : null,
        phoneNumber: !isEmail(credential) ? credential : null,
        password,
        rememberMe: true,
      });
      router.replace('/');
    } catch (error: any) {
      setErrors({
        credential: error.message || 'Invalid credentials',
        password: error.message || 'Invalid credentials',
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoSubtitle}>Managing your farm made easy</Text>
          </View>

          <Spacer size="xl" />

          {/* Form */}
          <View style={styles.form}>
            {/* Email Address Label */}
            <Text style={styles.label}>Email Address</Text>
            
            {/* Input Field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Uzzalh4343@gmail.com"
                placeholderTextColor="#999999"
                value={credential}
                onChangeText={setCredential}
                keyboardType="default"
                autoCapitalize="none"
                autoComplete="username"
              />
            </View>
            {errors.credential ? (
              <Text style={styles.errorText}>{errors.credential}</Text>
            ) : null}

            <Spacer size="lg" />

            {/* Password Label */}
            <Text style={styles.label}>Password</Text>
            
            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor="#999999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={22} 
                  color="#999999" 
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}

            <Spacer size="sm" />

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>
          </View>

          <Spacer size="xl" />

          {/* Sign In Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleLogin}
              disabled={login.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.signInButtonText}>
                {login.isPending ? 'SIGNING IN...' : 'SIGN IN'}
              </Text>
            </TouchableOpacity>
          </View>

          <Spacer size="md" />

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Lost your password? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.signUpText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

          <Spacer size="xl" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoImage: {
    width: 220,
    height: 90,
    marginBottom: spacing.xs,
  },
  logoSubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: '#000000',
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: spacing.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
  },
  buttonContainer: {
    width: '100%',
  },
  signInButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
  },
  signUpText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});