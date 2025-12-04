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
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, textStyles, borderRadius } from '../../theme';
import { Container, Input, Button, H1, Body, BodySemibold, Spacer, Card } from '../../components/ui';
import { useLogin } from '../../libs/auth';

export const LoginScreen = () => {
  const router = useRouter();
  const login = useLogin();
  
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ credential: '', password: '' });

  const validateForm = () => {
    let valid = true;
    const newErrors = { credential: '', password: '' };

    if (loginMethod === 'email') {
      if (!email) {
        newErrors.credential = 'Email is required';
        valid = false;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.credential = 'Email is invalid';
        valid = false;
      }
    } else {
      if (!phoneNumber) {
        newErrors.credential = 'Phone number is required';
        valid = false;
      } else if (!/^[+]?[\d\s-()]+$/.test(phoneNumber)) {
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
        email: loginMethod === 'email' ? email : null,
        phoneNumber: loginMethod === 'phone' ? phoneNumber : null,
        password,
        rememberMe: true,
      });
      // Navigate to index, which will handle role-based routing
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
        >
          <Container padding="lg">
            <View style={styles.heroRow}>
              <View style={styles.heroText}>
                <BodySemibold color={colors.primary}>Welcome back</BodySemibold>
                <H1 style={styles.title}>Sign in to your farm hub</H1>
                <Body color={colors.textSecondary} style={styles.subtitle}>
                  Keep today’s plots, weather notes, and UAV spraying tasks in sync.
                </Body>
              </View>
              <Image
                source={require('../../assets/icons/splash-icon.png')}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>

            <Spacer size="xl" />

            <Card variant="elevated" style={styles.formCard}>
              <View style={styles.form}>
                {/* Login Method Toggle */}
                <View style={styles.methodToggle}>
                  <TouchableOpacity
                    style={[
                      styles.methodButton,
                      loginMethod === 'email' && styles.methodButtonActive,
                    ]}
                    onPress={() => {
                      setLoginMethod('email');
                      setErrors({ credential: '', password: '' });
                    }}
                  >
                    <Body
                      color={loginMethod === 'email' ? colors.white : colors.textSecondary}
                      style={styles.methodButtonText}
                    >
                      Email
                    </Body>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.methodButton,
                      loginMethod === 'phone' && styles.methodButtonActive,
                    ]}
                    onPress={() => {
                      setLoginMethod('phone');
                      setErrors({ credential: '', password: '' });
                    }}
                  >
                    <Body
                      color={loginMethod === 'phone' ? colors.white : colors.textSecondary}
                      style={styles.methodButtonText}
                    >
                      Phone
                    </Body>
                  </TouchableOpacity>
                </View>

                <Spacer size="md" />

                {loginMethod === 'email' ? (
                  <Input
                    label="Email"
                    placeholder="farmer@example.com"
                    value={email}
                    onChangeText={setEmail}
                    error={errors.credential}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                ) : (
                  <Input
                    label="Phone Number"
                    placeholder="+84912345678"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    error={errors.credential}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                )}

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

              <Spacer size="lg" />

              <Button onPress={handleLogin} loading={login.isPending} fullWidth size="lg">
                Log in
              </Button>
            </Card>

            <Spacer size="lg" />

            <View style={styles.footer}>
              <Body color={colors.textSecondary}>Need an account? </Body>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Body color={colors.primary} style={styles.signUpText}>
                  Contact support
                </Body>
              </TouchableOpacity>
            </View>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroRow: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    ...{
      shadowColor: colors.dark,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
  },
  heroText: {
    flex: 1,
  },
  title: {
    paddingTop: spacing.xs,
  },
  subtitle: {
    paddingTop: spacing.xs,
    lineHeight: 22,
  },
  heroImage: {
    width: 100,
    height: 100,
  },
  formCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  form: {
    width: '100%',
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    padding: spacing.xs / 2,
  },
  methodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodButtonActive: {
    backgroundColor: colors.primary,
  },
  methodButtonText: {
    fontFamily: textStyles.bodySemibold.fontFamily,
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

