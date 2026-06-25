// Become Consultant Screen — Matte dark theme, toast, application status check
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TickCircleIcon, ClockIcon as VuesaxClockIcon, ArrowCircleLeftIcon, MagicStarIcon, BriefcaseIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { useToast } from '../components/Toast';
import { submitApplication, getMyApplicationStatus } from '../services/api';
import { Spacing } from '../config/theme';

const SPECIALTIES = [
  { id: 'tarot', label: 'Tarot', icon: 'flower-outline' },
  { id: 'astrology', label: 'Astrology', icon: 'planet-outline' },
  { id: 'numerology', label: 'Numerology', icon: 'grid-outline' },
  { id: 'dream', label: 'Dream Reading', icon: 'moon-outline' },
  { id: 'palm', label: 'Palm Reading', icon: 'hand-left-outline' },
  { id: 'coffee', label: 'Coffee Fortune', icon: 'cafe-outline' },
];

const BENEFITS = [
  { icon: 'briefcase', title: 'Earn Income', desc: 'Monetize your expertise', customIcon: true },
  { icon: 'time-outline', title: 'Flexible Hours', desc: 'Work whenever you want' },
  { icon: 'people-outline', title: 'Wide Audience', desc: 'Reach thousands of users' },
  { icon: 'shield-checkmark-outline', title: 'Secure Payments', desc: 'Guaranteed payment system' },
];

type AppStatus = 'none' | 'pending' | 'rejected' | 'loading';

export const BecomeConsultantScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useStore();
  const { showToast } = useToast();

  const [appStatus, setAppStatus] = useState<AppStatus>('loading');
  const [adminNote, setAdminNote] = useState('');
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.nickname || '',
    experience: '',
    bio: '',
    specialties: [] as string[],
  });

  const bg = isDark ? '#0F0F1A' : '#F8F9FA';
  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subText = isDark ? 'rgba(255,255,255,0.5)' : '#8E8E93';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#E0E0E0';
  const inputBg = isDark ? '#1E1E30' : '#F0F0F5';
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0';

  // Check application status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await getMyApplicationStatus();
        if (res.status === 'pending') {
          setAppStatus('pending');
        } else if (res.status === 'rejected') {
          setAppStatus('rejected');
          if (res.admin_note) setAdminNote(res.admin_note);
        } else {
          setAppStatus('none');
        }
      } catch {
        setAppStatus('none');
      }
    };
    checkStatus();
  }, []);

  const toggleSpecialty = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (formData.specialties.includes(id)) {
      setFormData({ ...formData, specialties: formData.specialties.filter(s => s !== id) });
    } else {
      setFormData({ ...formData, specialties: [...formData.specialties, id] });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('error', 'Please enter your full name');
      return;
    }
    if (!formData.bio.trim()) {
      showToast('error', 'Please write something about yourself');
      return;
    }
    if (formData.specialties.length === 0) {
      showToast('error', 'Please select at least one specialty');
      return;
    }

    const isGuest = !user?.email;
    if (isGuest) {
      showToast('error', 'Account required', 'You need to create an account first');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitApplication({
        full_name: formData.name.trim(),
        title: formData.specialties[0] ? `${SPECIALTIES.find(s => s.id === formData.specialties[0])?.label || ''} Reader` : 'Astrologer',
        specialties: formData.specialties,
        experience_years: parseInt(formData.experience, 10) || 0,
        bio: formData.bio.trim(),
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('success', 'Application submitted', 'We will review it within 3-5 business days');
      setAppStatus('pending');
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = error?.message || '';

      if (msg.includes('already have')) {
        showToast('error', 'Already applied', 'You have a pending or approved application');
      } else if (msg.includes('connect') || msg.includes('Network') || msg.includes('Aborted')) {
        showToast('error', 'Connection error', 'Please check your internet connection');
      } else {
        showToast('error', 'Something went wrong', msg || 'Please try again');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.name.trim()) {
      showToast('error', 'Please enter your full name');
      return;
    }
    if (step < 2) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  // Loading state
  if (appStatus === 'loading') {
    return (
      <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9D4EDD" />
      </View>
    );
  }

  // Pending status
  if (appStatus === 'pending') {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: backBg }]}>
              <ArrowCircleLeftIcon size={18} color={textColor} />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={[styles.headerTitle, { color: textColor }]}>{t('applicationStatus')}</Text>
            </View>
          </View>

          <View style={styles.statusCenter}>
            <View style={[styles.statusCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={[styles.statusIconCircle, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Ionicons name="hourglass-outline" size={36} color="#3B82F6" />
              </View>
              <Text style={[styles.statusTitle, { color: textColor }]}>{t('underReview')}</Text>
              <Text style={[styles.statusDesc, { color: subText }]}>
                Your application is being reviewed by our team. You will receive a notification with the result within 3-5 business days.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Rejected status shows form again with info banner
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: backBg }]}>
              <ArrowCircleLeftIcon size={18} color={textColor} />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={[styles.headerTitle, { color: textColor }]}>{t('becomeAstrologer')}</Text>
              <Text style={[styles.headerSubtitle, { color: subText }]}>{t('becomeAstrologerSub')}</Text>
            </View>
          </View>

          {/* Rejected banner */}
          {appStatus === 'rejected' && (
            <View style={[styles.rejectedBanner, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)' }]}>
              <Ionicons name="alert-circle" size={22} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rejectedTitle, { color: '#EF4444' }]}>{t('prevNotApproved')}</Text>
                {adminNote ? (
                  <Text style={[styles.rejectedNote, { color: subText }]}>{adminNote}</Text>
                ) : null}
                <Text style={[styles.rejectedNote, { color: subText }]}>{t('canSubmitNew')}</Text>
              </View>
            </View>
          )}

          {/* Progress */}
          <View style={styles.progressContainer}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.progressDot, { backgroundColor: borderColor }, step >= i && styles.progressDotActive]} />
            ))}
          </View>

          {step === 0 && (
            <>
              <View style={styles.benefitsGrid}>
                {BENEFITS.map((b, i) => (
                  <View key={i} style={[styles.benefitCard, { backgroundColor: cardBg, borderColor }]}>
                    {b.customIcon ? <BriefcaseIcon size={28} color="#9D4EDD" /> : <Ionicons name={b.icon as any} size={28} color="#9D4EDD" />}
                    <Text style={[styles.benefitTitle, { color: textColor }]}>{b.title}</Text>
                    <Text style={[styles.benefitDesc, { color: subText }]}>{b.desc}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(157,78,221,0.12)' : 'rgba(157,78,221,0.08)' }]}>
                <MagicStarIcon size={24} color="#9D4EDD" />
                <Text style={[styles.infoText, { color: textColor }]}>
                  Join Kosmos as an astrologer and reach thousands of users. Share your expertise and earn from every reading.
                </Text>
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t('personalInfo')}</Text>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: textColor }]}>{t('fullName')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                  placeholder={t('yourFullName')}
                  placeholderTextColor={subText}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Experience (Years)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                  placeholder={t('yearsExperiencePh')}
                  placeholderTextColor={subText}
                  keyboardType="number-pad"
                  value={formData.experience}
                  onChangeText={(text) => setFormData({ ...formData, experience: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: textColor }]}>{t('aboutYou')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor, color: textColor }]}
                  placeholder={t('experiencePh')}
                  placeholderTextColor={subText}
                  multiline
                  value={formData.bio}
                  onChangeText={(text) => setFormData({ ...formData, bio: text })}
                />
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t('specialties')}</Text>
              <Text style={[styles.sectionSubtitle, { color: subText }]}>{t('selectExpertise')}</Text>
              <View style={styles.specialtiesGrid}>
                {SPECIALTIES.map((s) => {
                  const active = formData.specialties.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.specialtyCard,
                        { backgroundColor: cardBg, borderColor },
                        active && styles.specialtyCardActive,
                      ]}
                      onPress={() => toggleSpecialty(s.id)}
                    >
                      <Ionicons name={s.icon as any} size={28} color={active ? '#9D4EDD' : subText} />
                      <Text style={[styles.specialtyLabel, { color: active ? '#9D4EDD' : subText }, active && styles.specialtyLabelActive]}>
                        {s.label}
                      </Text>
                      {active && (
                        <TickCircleIcon size={20} color="#9D4EDD" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Next/Submit Button */}
          <TouchableOpacity
            style={[styles.nextButton, isSubmitting && { opacity: 0.6 }]}
            onPress={nextStep}
            disabled={isSubmitting}
          >
            <View style={styles.nextButtonInner}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.nextText}>{step === 2 ? 'Submit Application' : 'Continue'}</Text>
                  {step === 2 ? <TickCircleIcon size={20} color="#FFFFFF" /> : <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
                </>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 16 },
  backButton: { padding: 10, borderRadius: 12, marginRight: 16 },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },

  // Status center
  statusCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: 80 },
  statusCard: { padding: 32, borderRadius: 24, borderWidth: 1, alignItems: 'center', width: '100%' },
  statusIconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  statusTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  statusDesc: { fontSize: 14, lineHeight: 22, textAlign: 'center' },

  // Rejected banner
  rejectedBanner: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: Spacing.lg, marginBottom: 16, padding: 16, borderRadius: 14, gap: 12 },
  rejectedTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  rejectedNote: { fontSize: 13, lineHeight: 18 },

  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  progressDot: { width: 10, height: 10, borderRadius: 5 },
  progressDotActive: { backgroundColor: '#9D4EDD', width: 24 },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: 12 },
  benefitCard: { width: '47%', padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  benefitTitle: { fontSize: 14, fontWeight: '600', marginTop: 10 },
  benefitDesc: { fontSize: 11, textAlign: 'center', marginTop: 4 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: Spacing.lg, marginTop: 20, padding: 18, borderRadius: 16, gap: 12 },
  infoText: { flex: 1, fontSize: 14, lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '800', paddingHorizontal: Spacing.lg, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, paddingHorizontal: Spacing.lg, marginBottom: 16 },
  inputContainer: { marginHorizontal: Spacing.lg, marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 14, padding: 16, fontSize: 15, borderWidth: 1 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  specialtiesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: 12 },
  specialtyCard: { width: '47%', padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 2 },
  specialtyCardActive: { borderColor: '#9D4EDD', backgroundColor: 'rgba(157,78,221,0.1)' },
  specialtyLabel: { fontSize: 14, fontWeight: '500', marginTop: 8 },
  specialtyLabelActive: { color: '#9D4EDD', fontWeight: '600' },
  specialtyCheck: { position: 'absolute', top: 10, right: 10 },
  nextButton: { marginHorizontal: Spacing.lg, marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  nextButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
    backgroundColor: '#9D4EDD',
    borderRadius: 14,
  },
  nextText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  bottomSpacer: { height: 100 },
});
