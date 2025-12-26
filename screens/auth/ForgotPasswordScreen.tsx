/**
 * Forgot Password Screen
 * Allows users to request a password reset link
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
import { useForgotPassword } from '../../libs/auth';
import { Ionicons } from '@expo/vector-icons';

export const ForgotPasswordScreen = () => {
  const router = useRouter();
  const forgotPassword = useForgotPassword();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmail()) return;

    try {
      await forgotPassword.mutateAsync({ email });
      setIsSubmitted(true);
    } catch (error: any) {
      // Error alert is already shown by api-client interceptor
      // Just log for debugging
      console.error('Forgot password error:', error);
    }
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#10b981" />
            </View>
            <Spacer size="lg" />
            
            <Text style={styles.successTitle}>Kiểm tra email của bạn</Text>
            <Spacer size="sm" />
            
            <Text style={styles.successMessage}>
              Chúng tôi đã gửi liên kết đặt lại mật khẩu đến{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
            
            <Spacer size="xl" />
            
            <Button onPress={() => router.replace('/auth/login')} fullWidth>
              Quay lại đăng nhập
            </Button>
            
            <Spacer size="md" />
            
            <TouchableOpacity 
              onPress={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              style={styles.resendButton}
            >
              <Text style={styles.resendText}>Gửi lại email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>

          <Spacer size="xl" />

          {/* Header */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Spacer size="md" />
            <Text style={styles.title}>Quên mật khẩu?</Text>
            <Spacer size="sm" />
            <Text style={styles.subtitle}>
              Nhập địa chỉ email được liên kết với tài khoản của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
            </Text>
          </View>

          <Spacer size="xl" />

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            
            <View style={[styles.inputContainer, error ? styles.inputError : null]}>
              <Ionicons name="mail-outline" size={20} color="#999999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#999999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </View>

          <Spacer size="xl" />

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={forgotPassword.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                {forgotPassword.isPending ? 'ĐANG GỬI...' : 'GỬI LIÊN KẾT ĐẶT LẠI'}
              </Text>
            </TouchableOpacity>
          </View>

          <Spacer size="md" />

          {/* Back to login link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Nhớ mật khẩu? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>

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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  logoImage: {
    width: 180,
    height: 75,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
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
  inputError: {
    borderColor: '#FF3B30',
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: spacing.xs,
  },
  buttonContainer: {
    width: '100%',
  },
  submitButton: {
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
  submitButtonText: {
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
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  // Success state styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  successContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: '#000000',
  },
  resendButton: {
    padding: spacing.sm,
  },
  resendText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
