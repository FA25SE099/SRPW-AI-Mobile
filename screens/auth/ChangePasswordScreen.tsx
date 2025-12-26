/**
 * Change Password Screen
 * Allows authenticated users to change their password
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../../theme';
import { Button, Spacer, H3, BodySmall } from '../../components/ui';
import { useChangePassword, useUser } from '../../libs/auth';
import { ROLES } from '../../libs/authorization';
import { Ionicons } from '@expo/vector-icons';

export const ChangePasswordScreen = () => {
  const router = useRouter();
  const changePassword = useChangePassword();
  const { data: user } = useUser();
  
  const isFarmer = user?.role === ROLES.Farmer || (user?.role as string) === 'Farmer';
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!currentPassword) {
      newErrors.currentPassword = isFarmer ? 'Mật khẩu hiện tại là bắt buộc' : 'Current password is required';
      valid = false;
    }

    if (!newPassword) {
      newErrors.newPassword = isFarmer ? 'Mật khẩu mới là bắt buộc' : 'New password is required';
      valid = false;
    } else if (newPassword.length < 5) {
      newErrors.newPassword = isFarmer ? 'Mật khẩu phải có ít nhất 5 ký tự' : 'Password must be at least 5 characters';
      valid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = isFarmer ? 'Vui lòng xác nhận mật khẩu' : 'Please confirm your password';
      valid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = isFarmer ? 'Mật khẩu không khớp' : "Passwords don't match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const result = await changePassword.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      
      // Show success message
      Alert.alert(
        isFarmer ? 'Thành công' : 'Success',
        result.message || (isFarmer ? 'Mật khẩu đã được thay đổi thành công' : 'Password changed successfully'),
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      // Error alert is already shown by api-client interceptor
      // Just log for debugging
      console.error('Change password error:', error);
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
          {/* Header with Back Button */}
          <View style={styles.headerRow}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <Spacer size="lg" />

          {/* Title Section */}
          <View style={styles.titleSection}>
            <H3>{isFarmer ? 'Thay đổi mật khẩu' : 'Change Password'}</H3>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>
              {isFarmer ? 'Cập nhật mật khẩu của bạn để giữ an toàn cho tài khoản.' : 'Update your password to keep your account secure.'}
            </BodySmall>
          </View>

          <Spacer size="xl" />

          {/* Form */}
          <View style={styles.form}>
            {/* Current Password */}
            <Text style={styles.label}>{isFarmer ? 'Mật khẩu hiện tại' : 'Current Password'}</Text>
            <View style={[styles.inputContainer, errors.currentPassword ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={20} color="#999999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isFarmer ? 'Nhập mật khẩu hiện tại' : 'Enter current password'}
                placeholderTextColor="#999999"
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  setErrors({ ...errors, currentPassword: '' });
                }}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons 
                  name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={22} 
                  color="#999999" 
                />
              </TouchableOpacity>
            </View>
            {errors.currentPassword ? (
              <Text style={styles.errorText}>{errors.currentPassword}</Text>
            ) : null}

            <Spacer size="lg" />

            {/* New Password */}
            <Text style={styles.label}>{isFarmer ? 'Mật khẩu mới' : 'New Password'}</Text>
            <View style={[styles.inputContainer, errors.newPassword ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={20} color="#999999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isFarmer ? 'Nhập mật khẩu mới' : 'Enter new password'}
                placeholderTextColor="#999999"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setErrors({ ...errors, newPassword: '' });
                }}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoComplete="password-new"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={22} 
                  color="#999999" 
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword ? (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            ) : null}

            <Spacer size="lg" />

            {/* Confirm Password */}
            <Text style={styles.label}>{isFarmer ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}</Text>
            <View style={[styles.inputContainer, errors.confirmPassword ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={20} color="#999999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isFarmer ? 'Nhập lại mật khẩu mới' : 'Confirm new password'}
                placeholderTextColor="#999999"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrors({ ...errors, confirmPassword: '' });
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="password-new"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={22} 
                  color="#999999" 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
          </View>

          <Spacer size="xl" />

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={changePassword.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                {changePassword.isPending 
                  ? (isFarmer ? 'ĐANG CẬP NHẬT...' : 'UPDATING...') 
                  : (isFarmer ? 'THAY ĐỔI MẬT KHẨU' : 'CHANGE PASSWORD')
                }
              </Text>
            </TouchableOpacity>

            <Spacer size="md" />

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={changePassword.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{isFarmer ? 'HỦY' : 'CANCEL'}</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  titleSection: {
    width: '100%',
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
  eyeIcon: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
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
  cancelButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
  },
});
