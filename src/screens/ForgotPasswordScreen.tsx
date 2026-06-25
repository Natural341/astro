import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  TickCircleIcon, ArrowCircleLeftIcon, MailIcon, LockIcon, AlertIcon,
  EyeIcon, EyeOffIcon,
} from '../components/icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { sendPasswordResetCode, verifyCode, resetPassword } from '../services/api';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDark, ui } = useTheme();
  const { t } = useTranslation();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  const codeInputRefs = useRef<Array<TextInput | null>>([]);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      resendIntervalRef.current = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) { if (resendIntervalRef.current) clearInterval(resendIntervalRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => { if (resendIntervalRef.current) clearInterval(resendIntervalRef.current); };
    }
  }, [resendTimer]);

  const bgColor = isDark ? 'transparent' : '#FAFAFA';
  const { cardBg, textColor, subTextColor, borderColor, inputBg } = ui;
  const primaryColor = '#9D4EDD';

  const handleSendCode = async () => {
    if (!email.trim()) { setErrorMessage('Please enter your email address.'); return; }
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await sendPasswordResetCode(email.trim().toLowerCase());
      if (res.dev_code) setDevCode(res.dev_code);
      setStep(1);
      setVerificationCode(['', '', '', '', '', '']);
      setResendTimer(60);
      setTimeout(() => codeInputRefs.current[0]?.focus(), 300);
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('wait')) setErrorMessage('Please wait before requesting a new code.');
      else if (msg.includes('Network') || msg.includes('fetch')) setErrorMessage('Could not connect to server.');
      else setErrorMessage(msg || 'Failed to send code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newCode = [...verificationCode];
    newCode[index] = digit;
    setVerificationCode(newCode);
    if (digit && index < 5) codeInputRefs.current[index + 1]?.focus();
    if (digit && index === 5 && newCode.every(d => d !== '')) {
      setTimeout(() => handleVerifyCode(newCode.join('')), 100);
    }
  };

  const handleCodeKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
      const newCode = [...verificationCode];
      newCode[index - 1] = '';
      setVerificationCode(newCode);
    }
  };

  const handleVerifyCode = async (codeStr?: string) => {
    const code = codeStr || verificationCode.join('');
    if (code.length !== 6) { setErrorMessage('Please enter the 6-digit code.'); return; }
    setErrorMessage('');
    setIsLoading(true);
    try {
      await verifyCode(email.trim().toLowerCase(), code);
      setStep(2);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) { setErrorMessage('Please fill in all fields.'); return; }
    if (password !== confirmPassword) { setErrorMessage('Passwords do not match.'); return; }
    if (password.length < 6) { setErrorMessage('Password must be at least 6 characters.'); return; }
    setErrorMessage('');
    setIsLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase(), verificationCode.join(''), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(3);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>{t('forgotPassword')}</Text>
              <Text style={[styles.subtitle, { color: subTextColor }]}>
                Enter your email address and we'll send you a verification code.
              </Text>
            </View>
            <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
              <MailIcon size={20} color={primaryColor} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder={t('emailAddress')}
                placeholderTextColor={subTextColor}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <TouchableOpacity onPress={handleSendCode} disabled={isLoading} style={[styles.submitButton, { backgroundColor: primaryColor }]}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>{t('sendCode')}</Text>}
            </TouchableOpacity>
          </>
        );

      case 1:
        return (
          <>
            <View style={styles.header}>
              <MailIcon size={36} color={primaryColor} />
              <Text style={[styles.title, { color: textColor, marginTop: 12 }]}>{t('verificationCode')}</Text>
              <Text style={[styles.subtitle, { color: subTextColor }]}>
                Enter the 6-digit code sent to{'\n'}
                <Text style={{ color: primaryColor, fontWeight: '600' }}>{email.trim().toLowerCase()}</Text>
              </Text>
            </View>

            {__DEV__ && devCode && (
              <Text style={{ color: '#F59E0B', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>DEV code: {devCode}</Text>
            )}

            <View style={styles.codeRow}>
              {verificationCode.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { codeInputRefs.current[i] = ref; }}
                  style={[styles.codeInput, {
                    backgroundColor: inputBg, color: textColor,
                    borderColor: digit ? primaryColor : borderColor,
                    borderWidth: digit ? 2 : 1,
                  }]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, i)}
                  onKeyPress={(e) => handleCodeKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={() => handleVerifyCode()}
              disabled={isLoading || verificationCode.some(d => !d)}
              style={[styles.submitButton, { backgroundColor: primaryColor, marginTop: 20, opacity: verificationCode.some(d => !d) ? 0.5 : 1 }]}
            >
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>{t('verifyCode')}</Text>}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity onPress={() => { setStep(0); setErrorMessage(''); }}>
                <Text style={{ color: subTextColor, fontSize: 13 }}>{t('changeEmail')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSendCode} disabled={resendTimer > 0}>
                <Text style={{ color: resendTimer > 0 ? subTextColor : primaryColor, fontSize: 13, fontWeight: '500' }}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 2:
        return (
          <>
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>{t('newPasswordLabel')}</Text>
              <Text style={[styles.subtitle, { color: subTextColor }]}>{t('setNewPassword')}.</Text>
            </View>
            <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
              <LockIcon size={20} color={primaryColor} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder={t('newPasswordPh')}
                placeholderTextColor={subTextColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOffIcon size={20} color={subTextColor} /> : <EyeIcon size={20} color={subTextColor} />}
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
              <LockIcon size={20} color={primaryColor} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder={t('confirmNewPasswordPh')}
                placeholderTextColor={subTextColor}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOffIcon size={20} color={subTextColor} /> : <EyeIcon size={20} color={subTextColor} />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleResetPassword} disabled={isLoading} style={[styles.submitButton, { backgroundColor: primaryColor }]}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>{t('updatePassword')}</Text>}
            </TouchableOpacity>
          </>
        );

      case 3:
        return (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <TickCircleIcon size={64} color="#22C55E" />
            <Text style={[styles.title, { color: textColor, marginTop: 20 }]}>{t('passwordUpdated')}</Text>
            <Text style={[styles.subtitle, { color: subTextColor, textAlign: 'center', marginTop: 8 }]}>
              Your password has been updated successfully. You can now sign in with your new password.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.submitButton, { backgroundColor: primaryColor, marginTop: 24, width: '100%' }]}
            >
              <Text style={styles.submitButtonText}>{t('backToSignIn')}</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowCircleLeftIcon size={24} color={textColor} />
          </TouchableOpacity>

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {errorMessage !== '' && (
                <View style={styles.errorContainer}>
                  <AlertIcon size={18} color="#EF4444" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}
              {renderContent()}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  backButton: { position: 'absolute', top: 20, left: 20, zIndex: 10, padding: 10 },
  content: { maxWidth: 420, alignSelf: 'center', width: '100%' },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  card: { padding: 24, borderRadius: 24, borderWidth: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, height: 52, marginBottom: 16 },
  input: { flex: 1, marginLeft: 12, fontSize: 14 },
  submitButton: { flexDirection: 'row', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: { color: '#EF4444', fontSize: 12, marginLeft: 8, flex: 1 },
  codeRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  codeInput: { width: 44, height: 52, borderRadius: 12, textAlign: 'center', fontSize: 22, fontWeight: '700' },
});
