/**
 * Login Screen
 * User authentication screen with email and password
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, textStyles } from '../../theme';
import { Container, Input, Button, H1, Body, Spacer } from '../../components/ui';
import { useLogin } from '../../libs/auth';

export const LoginScreen = () => {
  const router = useRouter();
  const login = useLogin();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
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
      // await login.mutateAsync({ email, password });
      // Navigation will be handled by auth state change
      router.replace('/home');
    } catch (error) {
      setErrors({
        email: '',
        password: 'Invalid email or password',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Container padding="lg">
          <Spacer size="3xl" />
          
          {/* Header */}
          <View style={styles.header}>
            <H1 style={styles.title}>Welcome Back!</H1>
            <Spacer size="sm" />
            <Body color={colors.textSecondary} style={styles.subtitle}>
              Sign in to continue managing your tasks
            </Body>
          </View>

          <Spacer size="2xl" />

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Body color={colors.primary}>Forgot Password?</Body>
            </TouchableOpacity>
          </View>

          <Spacer size="xl" />

          {/* Login Button */}
          <Button
            onPress={handleLogin}
            loading={login.isPending}
            fullWidth
            size="lg"
          >
            Log in
          </Button>

          <Spacer size="lg" />

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Body color={colors.textSecondary}>Don't have an account? </Body>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Body color={colors.primary} style={styles.signUpText}>Sign Up</Body>
            </TouchableOpacity>
          </View>
        </Container>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontFamily: textStyles.bodySemibold.fontFamily,
  },
});

