// Modern Auth Screen - Flutter tasarımına uygun
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
  Alert,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TickCircleIcon, UserIcon, XIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, AlertIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { signIn, signUp, checkNicknameAvailable, sendVerificationCode, verifyCode, apiUserToUser } from '../services/api';
import { sanitizeInput, RateLimits } from '../utils/security';
import { loginSchema, registerSchema, firstError } from '../utils/validation';
import { AppConfig } from '../config/appConfig';
import { Spacing, BorderRadius, FontSizes, Colors } from '../config/theme';

export const AuthScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useTranslation();
  const { isDark, ui } = useTheme();
  const { setUser, setLanguage } = useStore();
  const { cardBg, textColor, subTextColor, borderColor, inputBg, primaryColor } = ui;

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const nicknameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Verification code state
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const codeInputRefs = useRef<Array<TextInput | null>>([]);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Debounced nickname check
  useEffect(() => {
    if (nicknameTimerRef.current) clearTimeout(nicknameTimerRef.current);
    if (isLoginMode) return;

    const trimmed = nickname.trim();
    if (trimmed.length < 3) {
      setNicknameAvailable(null);
      setCheckingNickname(false);
      return;
    }

    setCheckingNickname(true);
    nicknameTimerRef.current = setTimeout(async () => {
      const available = await checkNicknameAvailable(trimmed);
      setNicknameAvailable(available);
      setCheckingNickname(false);
    }, 500);

    return () => { if (nicknameTimerRef.current) clearTimeout(nicknameTimerRef.current); };
  }, [nickname, isLoginMode]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      resendIntervalRef.current = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (resendIntervalRef.current) clearInterval(resendIntervalRef.current); };
    }
  }, [resendTimer]);

  const startResendTimer = () => setResendTimer(60);

  const handleSendCode = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await sendVerificationCode(email.trim().toLowerCase());
      if (res.dev_code) setDevCode(res.dev_code);
      setShowVerification(true);
      setVerificationCode(['', '', '', '', '', '']);
      startResendTimer();
      setTimeout(() => codeInputRefs.current[0]?.focus(), 300);
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('already registered')) {
        setErrorMessage(t('emailAlreadyRegistered'));
      } else if (msg.includes('wait')) {
        setErrorMessage(t('resendCode'));
      } else if (msg.includes('Network') || msg.includes('fetch') || msg.includes('aborted') || msg.includes('timed out')) {
        setErrorMessage(t('connectionError'));
      } else {
        setErrorMessage(msg || t('failedSendCode'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async (codeOverride?: string) => {
    const code = codeOverride || verificationCode.join('');
    if (code.length !== 6) {
      setErrorMessage(t('enterSixDigitCode'));
      return;
    }

    setVerifyLoading(true);
    setErrorMessage('');

    const cleanEmail = sanitizeInput(email.trim().toLowerCase());
    const cleanNickname = sanitizeInput(nickname.trim());

    try {
      // Step 1: Verify code
      await verifyCode(cleanEmail, code);

      // Step 2: Register (backend checks verified flag)
      const res = await signUp(cleanEmail, password, cleanNickname, language);
      setUser(apiUserToUser(res.user, language));

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => navigation.replace('Onboarding'), 100);
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = error?.message || '';
      // Backend returns specific messages — pass them through
      setErrorMessage(msg || t('registrationFailed'));
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newCode = [...verificationCode];
    newCode[index] = digit;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5 && newCode.every(d => d !== '')) {
      setTimeout(() => handleVerifyAndRegister(newCode.join('')), 100);
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

  // Screen-specific background (rest of the palette comes from useTheme().ui)
  const bgColor = isDark ? 'transparent' : '#FAFAFA';

  const handleAuth = async () => {
    setErrorMessage('');

    if (!RateLimits.AUTH_ATTEMPT.canMakeRequest()) {
      setErrorMessage(t('tooManyAttempts'));
      return;
    }

    const validationError = isLoginMode
      ? firstError(loginSchema, { email, password })
      : firstError(registerSchema, { email, nickname, password, confirmPassword });
    if (validationError) {
      setErrorMessage(t(validationError));
      return;
    }

    // Async nickname availability isn't expressible in the schema — check separately.
    if (!isLoginMode && nicknameAvailable === false) {
      setErrorMessage(t('usernameTaken'));
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isLoginMode) {
      // Register flow: send verification code (handles its own loading state)
      await handleSendCode();
      return;
    }

    // Login flow
    setIsLoading(true);
    const cleanEmail = sanitizeInput(email.trim().toLowerCase());

    try {
      const res = await signIn(cleanEmail, password);
      const profile = res.user;
      setUser(apiUserToUser(profile, language));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Sign-in always goes straight to the app. Onboarding is only shown right after
      // a NEW registration; existing users (even with incomplete onboarding) can fill
      // birth details from Edit Profile, so we never trap them in onboarding on login.
      setTimeout(() => navigation.replace('Main'), 100);
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (__DEV__) console.log('Auth Error:', error?.message);
      // Backend returns clear messages — pass through
      setErrorMessage(error?.message || t('authFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate guest login
    setUser({
      id: `guest_${Date.now()}`,
      authId: `guest_${Date.now()}`,
      nickname: t('guest'),
      email: '',
      languageCode: language,
      tokens: AppConfig.defaultTokens,
      isPremium: false,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    // Let the navigator re-render with the authenticated screens before navigating
    // (immediate replace races the store update → "screen not handled" error).
    setTimeout(() => navigation.replace('Main'), 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Brand Title */}
            <View style={styles.header}>
              <Text style={[styles.appName, { color: textColor }]}>
                {t('appTitle')}
              </Text>
              <Text style={[styles.tagline, { color: subTextColor }]}>
                {t('tagline')}
              </Text>

              {/* Language toggle (TR / EN) */}
              <View style={[styles.langToggle, { backgroundColor: inputBg, borderColor }]}>
                {(['tr', 'en'] as const).map((lng) => {
                  const active = language === lng;
                  return (
                    <TouchableOpacity
                      key={lng}
                      onPress={() => { Haptics.selectionAsync(); setLanguage(lng); }}
                      style={[styles.langOption, active && { backgroundColor: primaryColor }]}
                    >
                      <Text style={[styles.langOptionText, { color: active ? '#FFFFFF' : subTextColor }]}>
                        {lng.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Main Card */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {showVerification ? (
                <>
                  {/* ─── Verification Code (full card) ─── */}
                  <TouchableOpacity
                    style={{ alignSelf: 'flex-start', marginBottom: 16 }}
                    onPress={() => { setShowVerification(false); setErrorMessage(''); setDevCode(null); }}
                  >
                    <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '500' }}>{t('back')}</Text>
                  </TouchableOpacity>

                  <View style={{ alignItems: 'center' }}>
                    <MailIcon size={36} color={primaryColor} />
                    <Text style={[styles.verificationTitle, { color: textColor }]}>
                      {t('verifyEmail')}
                    </Text>
                    <Text style={[styles.verificationSubtitle, { color: subTextColor }]}>
                      {t('verifyEmailSubtitle')}{'\n'}
                      <Text style={{ color: primaryColor, fontWeight: '600' }}>{email.trim().toLowerCase()}</Text>
                    </Text>
                  </View>

                  {__DEV__ && devCode && (
                    <Text style={{ color: '#F59E0B', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
                      DEV code: {devCode}
                    </Text>
                  )}

                  {errorMessage !== '' && (
                    <View style={[styles.errorContainer, { marginBottom: 12 }]}>
                      <AlertIcon size={16} color="#EF4444" />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  )}

                  <View style={styles.codeRow}>
                    {verificationCode.map((digit, i) => (
                      <TextInput
                        key={i}
                        ref={(ref) => { codeInputRefs.current[i] = ref; }}
                        style={[
                          styles.codeInput,
                          {
                            backgroundColor: inputBg,
                            color: textColor,
                            borderColor: digit ? primaryColor : borderColor,
                            borderWidth: digit ? 2 : 1,
                          },
                        ]}
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
                    onPress={() => handleVerifyAndRegister()}
                    disabled={verifyLoading || verificationCode.some(d => !d)}
                    style={[
                      styles.submitButton,
                      { backgroundColor: primaryColor, marginTop: 20, opacity: verificationCode.some(d => !d) ? 0.5 : 1 },
                    ]}
                  >
                    {verifyLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>{t('verifyCreateAccount')}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSendCode}
                    disabled={resendTimer > 0 || isLoading}
                    style={{ marginTop: 16, alignItems: 'center' }}
                  >
                    <Text style={{ color: resendTimer > 0 ? subTextColor : primaryColor, fontSize: 13, fontWeight: '500' }}>
                      {resendTimer > 0 ? `${t('resendCodeIn')} ${resendTimer}s` : t('resendCode')}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* ─── Login / Register Form ─── */}
                  <View style={[styles.tabContainer, { backgroundColor: inputBg }]}>
                    <TouchableOpacity
                      style={[styles.tab, isLoginMode && styles.tabActive]}
                      onPress={() => setIsLoginMode(true)}
                    >
                      <Text style={[styles.tabText, { color: isLoginMode ? '#FFFFFF' : subTextColor }]}>
                        {t('signIn')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tab, !isLoginMode && styles.tabActive]}
                      onPress={() => setIsLoginMode(false)}
                    >
                      <Text style={[styles.tabText, { color: !isLoginMode ? '#FFFFFF' : subTextColor }]}>
                        {t('signUp')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {errorMessage !== '' && (
                    <View style={styles.errorContainer}>
                      <AlertIcon size={18} color="#EF4444" />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  )}

                  {!isLoginMode && (
                    <View>
                      <View style={[styles.inputContainer, { backgroundColor: inputBg }, nicknameAvailable === false && { borderWidth: 1, borderColor: '#EF4444' }, nicknameAvailable === true && nickname.trim().length >= 3 && { borderWidth: 1, borderColor: '#22C55E' }]}>
                        <UserIcon size={20} color={primaryColor} />
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder={t('username')}
                          placeholderTextColor={subTextColor}
                          value={nickname}
                          onChangeText={setNickname}
                          autoCapitalize="none"
                        />
                        {checkingNickname && <ActivityIndicator size="small" color={subTextColor} />}
                        {!checkingNickname && nicknameAvailable === true && nickname.trim().length >= 3 && (
                          <TickCircleIcon size={20} color="#22C55E" />
                        )}
                        {!checkingNickname && nicknameAvailable === false && (
                          <XIcon size={20} color="#EF4444" />
                        )}
                      </View>
                      {!checkingNickname && nicknameAvailable === false && (
                        <Text style={{ color: '#EF4444', fontSize: 12, marginLeft: 16, marginTop: 4 }}>{t('usernameTaken')}</Text>
                      )}
                    </View>
                  )}

                  <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
                    <MailIcon size={20} color={primaryColor} />
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      placeholder={isLoginMode ? t('emailOrUsername') : t('emailAddress')}
                      placeholderTextColor={subTextColor}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>

                  <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
                    <LockIcon size={20} color={primaryColor} />
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      placeholder={t('password')}
                      placeholderTextColor={subTextColor}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOffIcon size={20} color={subTextColor} /> : <EyeIcon size={20} color={subTextColor} />}
                    </TouchableOpacity>
                  </View>

                  {!isLoginMode && (
                    <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
                      <LockIcon size={20} color={primaryColor} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder={t('confirmPassword')}
                        placeholderTextColor={subTextColor}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOffIcon size={20} color={subTextColor} /> : <EyeIcon size={20} color={subTextColor} />}
                      </TouchableOpacity>
                    </View>
                  )}

                  {isLoginMode && (
                    <TouchableOpacity style={styles.forgotButton} onPress={() => navigation.navigate('ForgotPassword')}>
                      <Text style={[styles.forgotText, { color: primaryColor }]}>{t('forgotPassword')}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity onPress={handleAuth} disabled={isLoading} style={[styles.submitButton, { backgroundColor: primaryColor }]}>
                    {isLoading ? <ActivityIndicator color="#FFFFFF" /> : (
                      <>
                        <UserIcon size={20} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>{isLoginMode ? t('signIn') : t('signUp')}</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
                    <Text style={[styles.dividerText, { color: subTextColor }]}>{t('orText')}</Text>
                    <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
                  </View>

                  <View style={styles.socialRow}>
                    <TouchableOpacity
                      style={[styles.socialButton, styles.googleButton, { opacity: 0.6 }]}
                      onPress={() => Alert.alert(t('comingSoon'), t('comingSoonMsg'))}
                    >
                      <Image source={require('../assets/images/google_logo.png')} style={styles.googleLogo} resizeMode="contain" />
                      <Text style={styles.googleText}>Google</Text>
                      <View style={styles.soonBadge}><Text style={styles.soonBadgeText}>{t('comingSoon')}</Text></View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.socialButton, styles.facebookButton, { opacity: 0.6 }]}
                      onPress={() => Alert.alert(t('comingSoon'), t('comingSoonMsg'))}
                    >
                      <View style={styles.facebookIcon}><Text style={styles.facebookIconText}>f</Text></View>
                      <Text style={styles.facebookText}>Facebook</Text>
                      <View style={styles.soonBadge}><Text style={styles.soonBadgeText}>{t('comingSoon')}</Text></View>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleGuestLogin}
                    style={[styles.guestButton, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)' }]}
                  >
                    <UserIcon size={20} color={subTextColor} />
                    <Text style={[styles.guestButtonText, { color: subTextColor }]}>{t('continueAsGuest')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Footer */}
            <Text style={[styles.footerText, { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }]}>
              {t('termsNotice')}
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  content: {
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    marginTop: 8,
    letterSpacing: 1,
  },
  langToggle: {
    flexDirection: 'row',
    marginTop: 20,
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  langOption: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 9,
  },
  langOptionText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#9D4EDD',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  soonBadge: {
    position: 'absolute',
    top: -7,
    right: -4,
    backgroundColor: '#9D4EDD',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 7,
  },
  soonBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleText: {
    color: '#1C1C1E',
    fontSize: 14,
    fontWeight: '600',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  facebookIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  facebookIconText: {
    color: '#1877F2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  facebookText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  guestButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    borderWidth: 1,
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
  // ─── Verification ───
  verificationTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  verificationSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  codeInput: {
    width: 44,
    height: 52,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
});
