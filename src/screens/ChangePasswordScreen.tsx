import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowCircleLeftIcon, LockIcon, MailIcon, AlertIcon, TickCircleIcon,
  EyeIcon, EyeOffIcon, ShieldTickIcon,
} from '../components/icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { changePassword, sendVerificationCode, verifyCode } from '../services/api';

type Method = 'password' | 'code';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark, ui } = useTheme();
  const { t } = useTranslation();
  const { user } = useStore();

  const [method, setMethod] = useState<Method>('password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // Code method state
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const codeInputRefs = useRef<Array<TextInput | null>>([]);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const textColor = colors.text;
  const { cardBg, subTextColor, borderColor, inputBg, primaryColor } = ui;

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

  const handleSendCode = async () => {
    if (!user?.email) return;
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await sendVerificationCode(user.email);
      if (res.dev_code) setDevCode(res.dev_code);
      setCodeSent(true);
      setVerificationCode(['', '', '', '', '', '']);
      setResendTimer(60);
      setTimeout(() => codeInputRefs.current[0]?.focus(), 300);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to send code.');
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
    if (code.length !== 6 || !user?.email) return;
    setErrorMessage('');
    setIsLoading(true);
    try {
      await verifyCode(user.email, code);
      setCodeVerified(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) { setErrorMessage('Please fill in all fields.'); return; }
    if (newPassword !== confirmPassword) { setErrorMessage('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setErrorMessage('Password must be at least 6 characters.'); return; }

    if (method === 'password' && !currentPassword) { setErrorMessage('Please enter your current password.'); return; }
    if (method === 'code' && !codeVerified) { setErrorMessage('Please verify your email first.'); return; }

    setErrorMessage('');
    setIsLoading(true);
    try {
      const params = method === 'password'
        ? { current_password: currentPassword, new_password: newPassword }
        : { code: verificationCode.join(''), new_password: newPassword };
      await changePassword(params);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? 'transparent' : '#FAFAFA' }]}>
        <View style={styles.successContainer}>
          <TickCircleIcon size={64} color="#22C55E" />
          <Text style={[styles.successTitle, { color: textColor }]}>{t('passwordChanged')}</Text>
          <Text style={[styles.successSubtitle, { color: subTextColor }]}>
            Your password has been updated successfully.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.submitButton, { backgroundColor: primaryColor, width: '80%', marginTop: 24 }]}
          >
            <Text style={styles.submitButtonText}>{t('done')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? 'transparent' : '#FAFAFA' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <ArrowCircleLeftIcon size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('changePassword')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Method Tabs */}
          <View style={[styles.tabRow, { backgroundColor: inputBg }]}>
            <TouchableOpacity
              style={[styles.tab, method === 'password' && { backgroundColor: primaryColor }]}
              onPress={() => { setMethod('password'); setErrorMessage(''); }}
            >
              <LockIcon size={16} color={method === 'password' ? '#FFF' : subTextColor} />
              <Text style={[styles.tabText, { color: method === 'password' ? '#FFF' : subTextColor }]}>{t('currentPassword')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, method === 'code' && { backgroundColor: primaryColor }]}
              onPress={() => { setMethod('code'); setErrorMessage(''); }}
            >
              <MailIcon size={16} color={method === 'code' ? '#FFF' : subTextColor} />
              <Text style={[styles.tabText, { color: method === 'code' ? '#FFF' : subTextColor }]}>{t('emailCode')}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {errorMessage !== '' && (
              <View style={styles.errorContainer}>
                <AlertIcon size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {method === 'password' ? (
              <>
                <Text style={[styles.sectionLabel, { color: subTextColor }]}>{t('enterCurrentPassword')}</Text>
                <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
                  <LockIcon size={20} color={primaryColor} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder={t('currentPasswordPh')}
                    placeholderTextColor={subTextColor}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrent}
                  />
                  <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                    {showCurrent ? <EyeOffIcon size={20} color={subTextColor} /> : <EyeIcon size={20} color={subTextColor} />}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {!codeSent ? (
                  <>
                    <Text style={[styles.sectionLabel, { color: subTextColor }]}>
                      We'll send a verification code to{'\n'}
                      <Text style={{ color: primaryColor, fontWeight: '600' }}>{user?.email}</Text>
                    </Text>
                    <TouchableOpacity
                      onPress={handleSendCode}
                      disabled={isLoading}
                      style={[styles.submitButton, { backgroundColor: primaryColor }]}
                    >
                      {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>{t('sendCode')}</Text>}
                    </TouchableOpacity>
                  </>
                ) : !codeVerified ? (
                  <>
                    <Text style={[styles.sectionLabel, { color: subTextColor, textAlign: 'center' }]}>Enter the 6-digit code</Text>
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
                      style={[styles.submitButton, { backgroundColor: primaryColor, marginTop: 16, opacity: verificationCode.some(d => !d) ? 0.5 : 1 }]}
                    >
                      {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>{t('verify')}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSendCode} disabled={resendTimer > 0} style={{ marginTop: 12, alignItems: 'center' }}>
                      <Text style={{ color: resendTimer > 0 ? subTextColor : primaryColor, fontSize: 13 }}>
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <ShieldTickIcon size={20} color="#22C55E" />
                    <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '600' }}>{t('emailVerified')}</Text>
                  </View>
                )}
              </>
            )}

            {/* New password fields — show for password method always, for code method only after verified */}
            {(method === 'password' || (method === 'code' && codeVerified)) && (
              <>
                <View style={[styles.dividerLine, { backgroundColor: borderColor, marginVertical: 16 }]} />
                <Text style={[styles.sectionLabel, { color: subTextColor }]}>{t('setNewPassword')}</Text>
                <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
                  <LockIcon size={20} color={primaryColor} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder={t('newPasswordPh')}
                    placeholderTextColor={subTextColor}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                  />
                  <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                    {showNew ? <EyeOffIcon size={20} color={subTextColor} /> : <EyeIcon size={20} color={subTextColor} />}
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
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOffIcon size={20} color={subTextColor} /> : <EyeIcon size={20} color={subTextColor} />}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleSubmit} disabled={isLoading} style={[styles.submitButton, { backgroundColor: primaryColor }]}>
                  {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>{t('changePassword')}</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backButton: { padding: 12, borderRadius: 14 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: 16 },
  tabRow: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabText: { fontSize: 13, fontWeight: '600' },
  card: { padding: 20, borderRadius: 20, borderWidth: 1 },
  sectionLabel: { fontSize: 13, marginBottom: 12, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, height: 52, marginBottom: 12 },
  input: { flex: 1, marginLeft: 12, fontSize: 14 },
  submitButton: { flexDirection: 'row', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  submitButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  dividerLine: { height: 1 },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { color: '#EF4444', fontSize: 12, marginLeft: 8, flex: 1 },
  codeRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  codeInput: { width: 44, height: 52, borderRadius: 12, textAlign: 'center', fontSize: 22, fontWeight: '700' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successTitle: { fontSize: 22, fontWeight: '700', marginTop: 16 },
  successSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8 },
});
