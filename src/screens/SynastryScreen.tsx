// Synastry (Compatibility) Screen - Premium Cosmic Analysis
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Modal,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AddCircleIcon, ArrowCircleLeftIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { tracker } from '../services/eventTracker';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../config/theme';
import { ZODIAC_SIGNS, getCompatibility, ZodiacSignName, CompatibilityResult, Gender } from '../data/zodiacCompatibility';
import { ZodiacSvgIcon } from '../data/zodiacSvgs';

const { width } = Dimensions.get('window');
const ACCENT = Colors.accent.purple;
const TOKEN_COST = 50;

export const SynastryScreen: React.FC = () => {
    const { colors, isDark, accent } = useTheme();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const tokens = useStore((state) => state.user?.tokens ?? 0);

    const [sign1, setSign1] = useState<ZodiacSignName | null>(null);
    const [sign2, setSign2] = useState<ZodiacSignName | null>(null);
    const [gender1, setGender1] = useState<Gender>('Female');
    const [gender2, setGender2] = useState<Gender>('Male');

    const [isCalculating, setIsCalculating] = useState(false);
    const [result, setResult] = useState<CompatibilityResult | null>(null);
    const [showSignPicker, setShowSignPicker] = useState<1 | 2 | null>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const resultFade = useRef(new Animated.Value(0)).current;
    const loadingPulse = useRef(new Animated.Value(0)).current;
    const orbitAnim = useRef(new Animated.Value(0)).current;

    // Orbit animation for hero visual
    const heroOrbit = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        tracker.track('screen_view', { screen: 'Synastry' });
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        Animated.loop(
            Animated.timing(heroOrbit, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
        ).start();
    }, []);

    const calculateSynastry = async () => {
        if (!sign1 || !sign2) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        tracker.track('feature_tap', { feature: 'synastry' });

        setIsCalculating(true);
        orbitAnim.setValue(0);
        loadingPulse.setValue(0);

        // Loading pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(loadingPulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(loadingPulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // Orbital merge
        Animated.timing(orbitAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true
        }).start();

        await new Promise(resolve => setTimeout(resolve, 2500));

        const res = getCompatibility(sign1, sign2, gender1, gender2);
        setResult(res);
        setIsCalculating(false);

        tracker.track('feature_complete', { feature: 'synastry', score: res.score });

        // Fade in results
        resultFade.setValue(0);
        Animated.timing(resultFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    };

    const reset = () => {
        setResult(null);
        setSign1(null);
        setSign2(null);
        setGender1('Female');
        setGender2('Male');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    };

    // ZodiacSvgIcon is now imported from zodiacSvgs.ts

    // -- Score arc for the big circle --
    const renderScoreArc = (score: number) => {
        const size = 180;
        const strokeWidth = 10;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;

        const scoreColor = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.error;

        return (
            <View style={{ justifyContent: 'center', alignItems: 'center', width: size, height: size, marginBottom: Spacing.lg }}>
                <Svg width={size} height={size}>
                    <Circle
                        cx={size / 2} cy={size / 2} r={radius}
                        stroke={colors.border}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <Circle
                        cx={size / 2} cy={size / 2} r={radius}
                        stroke={scoreColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeLinecap="round"
                        fill="none"
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                    />
                </Svg>
                <View style={{ position: 'absolute', alignItems: 'center' }}>
                    <Text style={{ fontSize: 44, fontWeight: FontWeights.extrabold, color: colors.text }}>{score}%</Text>
                    <Text style={{ fontSize: FontSizes.xs, color: colors.textSecondary, letterSpacing: 2, marginTop: 2 }}>{t('overall')}</Text>
                </View>
            </View>
        );
    };

    // -- Dimension bar --
    const renderDimensionBar = (label: string, value: number, icon: string, barColor: string) => (
        <View style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name={icon as any} size={16} color={barColor} />
                    <Text style={{ fontSize: FontSizes.md, color: colors.text, fontWeight: FontWeights.medium }}>{label}</Text>
                </View>
                <Text style={{ fontSize: FontSizes.md, color: barColor, fontWeight: FontWeights.bold }}>{value}%</Text>
            </View>
            <View style={{ height: 8, borderRadius: BorderRadius.full, backgroundColor: colors.border, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${value}%`, borderRadius: BorderRadius.full, backgroundColor: barColor }} />
            </View>
        </View>
    );

    // -- Gender toggle (♀ ♂ icons with color) --
    const GENDERS: { key: Gender; symbol: string; color: string }[] = [
        { key: 'Female', symbol: '♀', color: '#F472B6' },
        { key: 'Male', symbol: '♂', color: '#60A5FA' },
    ];
    const renderGenderToggle = (currentGender: Gender, setGender: (g: Gender) => void) => (
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
            {GENDERS.map(g => {
                const active = currentGender === g.key;
                return (
                    <TouchableOpacity
                        key={g.key}
                        style={{
                            width: 42, height: 42, borderRadius: 21,
                            justifyContent: 'center', alignItems: 'center',
                            backgroundColor: active ? g.color + '25' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                            borderWidth: active ? 2 : 1,
                            borderColor: active ? g.color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                        }}
                        onPress={() => setGender(g.key)}
                    >
                        <Text style={{
                            fontSize: 20, fontWeight: '700',
                            color: active ? g.color : colors.textTertiary,
                        }}>{g.symbol}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    // -- Sign selector card (minimal monochrome) --
    const renderSignSelector = (num: 1 | 2, selectedSign: ZodiacSignName | null) => {
        const signData = selectedSign ? ZODIAC_SIGNS[selectedSign] : null;
        const iconColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)';
        const currentGender = num === 1 ? gender1 : gender2;
        const setGender = num === 1 ? setGender1 : setGender2;

        return (
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: FontSizes.xs, color: colors.textSecondary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.sm, fontWeight: FontWeights.semibold }}>
                    {num === 1 ? 'You' : 'Partner'}
                </Text>
                <TouchableOpacity
                    style={{
                        width: '100%',
                        aspectRatio: 0.85,
                        borderRadius: 20,
                        borderWidth: signData ? 1.5 : 1,
                        borderColor: signData ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                        borderStyle: signData ? 'solid' : 'dashed',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                    }}
                    onPress={() => {
                        setShowSignPicker(num);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                >
                    {signData ? (
                        <>
                            <ZodiacSvgIcon sign={signData.name} color={iconColor} size={52} />
                            <Text style={{ fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginTop: 10 }}>{signData.name}</Text>
                            <Text style={{ fontSize: FontSizes.xs, color: colors.textTertiary, marginTop: 4 }}>{signData.element}</Text>
                        </>
                    ) : (
                        <>
                            <AddCircleIcon size={28} color={colors.textTertiary} />
                            <Text style={{ color: colors.textSecondary, fontSize: FontSizes.md, marginTop: 10, fontWeight: FontWeights.medium }}>{t('selectSign')}</Text>
                        </>
                    )}
                </TouchableOpacity>
                {renderGenderToggle(currentGender, setGender)}
            </View>
        );
    };

    // -- Loading overlay --
    const renderLoading = () => {
        if (!isCalculating || !sign1 || !sign2) return null;

        const s1 = ZODIAC_SIGNS[sign1];
        const s2 = ZODIAC_SIGNS[sign2];

        const orbit1X = orbitAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -50, 0] });
        const orbit2X = orbitAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 50, 0] });
        const pulseScale = loadingPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
        const opacity = orbitAnim.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });

        return (
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background + 'EE', zIndex: 100 }]}>
                <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, opacity, transform: [{ scale: pulseScale }] }}>
                    <Animated.View style={{ transform: [{ translateX: orbit1X }] }}>
                        <ZodiacSvgIcon sign={s1.name} color={s1.color} size={56} />
                    </Animated.View>
                    <Animated.View style={{ transform: [{ translateX: orbit2X }] }}>
                        <ZodiacSvgIcon sign={s2.name} color={s2.color} size={56} />
                    </Animated.View>
                </Animated.View>
                <Animated.Text style={{ color: colors.textSecondary, fontSize: FontSizes.lg, fontWeight: FontWeights.medium, marginTop: Spacing.xl, letterSpacing: 2, opacity }}>
                    Merging Energies...
                </Animated.Text>
            </View>
        );
    };

    // -- Result view --
    const renderResultView = () => {
        if (!result || !sign1 || !sign2) return null;
        const s1 = ZODIAC_SIGNS[sign1];
        const s2 = ZODIAC_SIGNS[sign2];

        return (
            <Animated.View style={{ flex: 1, opacity: resultFade }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 120 }}>

                    {/* Signs header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.lg }}>
                        <View style={{ alignItems: 'center' }}>
                            <ZodiacSvgIcon sign={s1.name} color={s1.color} size={40} />
                            <Text style={{ fontSize: FontSizes.sm, color: colors.text, fontWeight: FontWeights.semibold, marginTop: 4 }}>{s1.name}</Text>
                        </View>
                        <Text style={{ fontSize: FontSizes.lg, color: colors.textTertiary, fontWeight: FontWeights.medium }}>&</Text>
                        <View style={{ alignItems: 'center' }}>
                            <ZodiacSvgIcon sign={s2.name} color={s2.color} size={40} />
                            <Text style={{ fontSize: FontSizes.sm, color: colors.text, fontWeight: FontWeights.semibold, marginTop: 4 }}>{s2.name}</Text>
                        </View>
                    </View>

                    {/* Overall score arc */}
                    <View style={{ alignItems: 'center' }}>
                        {renderScoreArc(result.score)}
                    </View>

                    {/* Title */}
                    <Text style={{ fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: colors.text, textAlign: 'center', marginBottom: Spacing.sm }}>{result.title}</Text>

                    {/* Keywords tags */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.lg }}>
                        {result.keywords.map((kw, i) => (
                            <View key={i} style={{ backgroundColor: ACCENT + '20', paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: ACCENT + '30' }}>
                                <Text style={{ fontSize: FontSizes.xs, color: ACCENT, fontWeight: FontWeights.semibold }}>{kw}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Description card */}
                    <View style={{ backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontSize: FontSizes.md, color: colors.textSecondary, lineHeight: 22, textAlign: 'center' }}>{result.description}</Text>
                    </View>

                    {/* Dimension bars */}
                    <View style={{ backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.md }}>{t('dimensions')}</Text>
                        {renderDimensionBar('General', result.score, 'star-outline', accent.purple)}
                        {renderDimensionBar('Romantic', result.loveScore, 'heart-outline', accent.pink)}
                        {renderDimensionBar('Communication', result.communicationScore, 'chatbubbles-outline', accent.blue)}
                        {renderDimensionBar('Emotional', result.emotionalScore, 'water-outline', accent.cyan)}
                    </View>

                    {/* Challenge card */}
                    <View style={{ backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: colors.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
                            <Ionicons name="flash-outline" size={18} color={colors.warning} style={{ marginRight: Spacing.sm }} />
                            <Text style={{ fontSize: FontSizes.lg, fontWeight: FontWeights.semibold, color: colors.text }}>{t('challenge')}</Text>
                        </View>
                        <Text style={{ fontSize: FontSizes.md, color: colors.textSecondary, lineHeight: 22 }}>{result.challenge}</Text>
                    </View>

                    {/* New Analysis button */}
                    <TouchableOpacity
                        style={{
                            paddingVertical: 14,
                            paddingHorizontal: Spacing.xl,
                            borderRadius: BorderRadius.full,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                            alignSelf: 'center',
                        }}
                        onPress={reset}
                    >
                        <Text style={{ color: colors.text, fontWeight: FontWeights.semibold, fontSize: FontSizes.md, letterSpacing: 1 }}>{t('newAnalysis')}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>
        );
    };

    // -- Sign picker modal --
    const ELEMENTS: { name: string; emoji: string; signs: ZodiacSignName[]; tint: string }[] = [
        { name: 'Fire', emoji: '🔥', signs: ['Aries', 'Leo', 'Sagittarius'], tint: '#EF4444' },
        { name: 'Earth', emoji: '🌿', signs: ['Taurus', 'Virgo', 'Capricorn'], tint: '#22C55E' },
        { name: 'Air', emoji: '💨', signs: ['Gemini', 'Libra', 'Aquarius'], tint: '#3B82F6' },
        { name: 'Water', emoji: '🌊', signs: ['Cancer', 'Scorpio', 'Pisces'], tint: '#8B5CF6' },
    ];

    const renderSignPickerModal = () => {
        const iconColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)';
        const selectedColor = isDark ? '#FFFFFF' : '#000000';
        return (
            <Modal visible={showSignPicker !== null} transparent animationType="slide">
                <TouchableOpacity
                    style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    activeOpacity={1}
                    onPress={() => setShowSignPicker(null)}
                >
                    <View
                        style={{
                            backgroundColor: isDark ? '#151525' : '#FAFAFA',
                            borderTopLeftRadius: 28,
                            borderTopRightRadius: 28,
                            paddingBottom: 40,
                        }}
                        onStartShouldSetResponder={() => true}
                    >
                        {/* Handle bar */}
                        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', alignSelf: 'center', marginTop: 12, marginBottom: 16 }} />

                        {/* Title */}
                        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', letterSpacing: -0.3 }}>
                            Choose a Sign
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.textTertiary, textAlign: 'center', marginTop: 4, marginBottom: 20 }}>
                            {showSignPicker === 1 ? 'Select your zodiac sign' : 'Select your partner\'s sign'}
                        </Text>

                        {/* Element groups */}
                        {ELEMENTS.map(elem => (
                            <View key={elem.name} style={{ marginBottom: 8 }}>
                                {/* Element label */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginBottom: 8 }}>
                                    <Text style={{ fontSize: 11 }}>{elem.emoji}</Text>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textTertiary, letterSpacing: 1.5, textTransform: 'uppercase' }}>{elem.name}</Text>
                                    <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', marginLeft: 6 }} />
                                </View>

                                {/* Three signs in a row */}
                                <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8 }}>
                                    {elem.signs.map(key => {
                                        const sign = ZODIAC_SIGNS[key];
                                        const isSelected = (showSignPicker === 1 ? sign1 : sign2) === key;
                                        return (
                                            <TouchableOpacity
                                                key={key}
                                                style={{
                                                    flex: 1,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 12,
                                                    borderRadius: 14,
                                                    backgroundColor: isSelected
                                                        ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')
                                                        : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                                                    borderWidth: isSelected ? 1 : StyleSheet.hairlineWidth,
                                                    borderColor: isSelected
                                                        ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)')
                                                        : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                                                }}
                                                onPress={() => {
                                                    if (showSignPicker === 1) setSign1(key);
                                                    else setSign2(key);
                                                    setShowSignPicker(null);
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <ZodiacSvgIcon sign={sign.name} color={isSelected ? selectedColor : iconColor} size={24} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{
                                                        fontSize: 13,
                                                        fontWeight: isSelected ? '700' : '500',
                                                        color: isSelected ? colors.text : colors.textSecondary,
                                                    }}>{sign.name}</Text>
                                                    <Text style={{ fontSize: 10, color: colors.textTertiary }}>{sign.symbol}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            width: 40, height: 40, borderRadius: 20,
                            backgroundColor: colors.surface,
                            justifyContent: 'center', alignItems: 'center',
                        }}
                    >
                        <ArrowCircleLeftIcon size={22} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, letterSpacing: 1.5 }}>
                        SYNASTRY
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Main content */}
                {!result && !isCalculating && (
                    <Animated.ScrollView
                        style={{ opacity: fadeAnim }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100, flexGrow: 1, justifyContent: 'center' }}
                    >
                        {/* Hero orbit visual */}
                        <View style={{ alignItems: 'center', marginBottom: 28 }}>
                            <View style={{ width: 160, height: 160, justifyContent: 'center', alignItems: 'center' }}>
                                {/* Outer orbit ring */}
                                <View style={{
                                    position: 'absolute', width: 150, height: 150, borderRadius: 75,
                                    borderWidth: 1,
                                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                }} />
                                {/* Mid orbit ring */}
                                <View style={{
                                    position: 'absolute', width: 100, height: 100, borderRadius: 50,
                                    borderWidth: 1,
                                    borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                }} />
                                {/* Inner orbit ring */}
                                <View style={{
                                    position: 'absolute', width: 50, height: 50, borderRadius: 25,
                                    borderWidth: StyleSheet.hairlineWidth,
                                    borderColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                }} />

                                {/* Orbiting body 1 (pink ♀) */}
                                <Animated.View style={{
                                    position: 'absolute',
                                    width: 18, height: 18, borderRadius: 9, backgroundColor: '#F472B6',
                                    shadowColor: '#F472B6', shadowRadius: 14, shadowOpacity: 0.8, shadowOffset: { width: 0, height: 0 }, elevation: 6,
                                    transform: [{
                                        translateX: heroOrbit.interpolate({
                                            inputRange: [0, 0.25, 0.5, 0.75, 1],
                                            outputRange: [0, 70, 0, -70, 0],
                                        }),
                                    }, {
                                        translateY: heroOrbit.interpolate({
                                            inputRange: [0, 0.25, 0.5, 0.75, 1],
                                            outputRange: [-70, 0, 70, 0, -70],
                                        }),
                                    }],
                                }} />
                                {/* Trail glow 1 */}
                                <Animated.View style={{
                                    position: 'absolute',
                                    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(244,114,182,0.15)',
                                    transform: [{
                                        translateX: heroOrbit.interpolate({
                                            inputRange: [0, 0.25, 0.5, 0.75, 1],
                                            outputRange: [0, 70, 0, -70, 0],
                                        }),
                                    }, {
                                        translateY: heroOrbit.interpolate({
                                            inputRange: [0, 0.25, 0.5, 0.75, 1],
                                            outputRange: [-70, 0, 70, 0, -70],
                                        }),
                                    }],
                                }} />

                                {/* Orbiting body 2 (blue ♂) */}
                                <Animated.View style={{
                                    position: 'absolute',
                                    width: 18, height: 18, borderRadius: 9, backgroundColor: '#60A5FA',
                                    shadowColor: '#60A5FA', shadowRadius: 14, shadowOpacity: 0.8, shadowOffset: { width: 0, height: 0 }, elevation: 6,
                                    transform: [{
                                        translateX: heroOrbit.interpolate({
                                            inputRange: [0, 0.25, 0.5, 0.75, 1],
                                            outputRange: [0, -70, 0, 70, 0],
                                        }),
                                    }, {
                                        translateY: heroOrbit.interpolate({
                                            inputRange: [0, 0.25, 0.5, 0.75, 1],
                                            outputRange: [70, 0, -70, 0, 70],
                                        }),
                                    }],
                                }} />
                                {/* Trail glow 2 */}
                                <Animated.View style={{
                                    position: 'absolute',
                                    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(96,165,250,0.15)',
                                    transform: [{
                                        translateX: heroOrbit.interpolate({
                                            inputRange: [0, 0.25, 0.5, 0.75, 1],
                                            outputRange: [0, -70, 0, 70, 0],
                                        }),
                                    }, {
                                        translateY: heroOrbit.interpolate({
                                            inputRange: [0, 0.25, 0.5, 0.75, 1],
                                            outputRange: [70, 0, -70, 0, 70],
                                        }),
                                    }],
                                }} />

                                {/* Center glow */}
                                <View style={{
                                    width: 24, height: 24, borderRadius: 12,
                                    backgroundColor: isDark ? 'rgba(157,78,221,0.25)' : 'rgba(157,78,221,0.12)',
                                }} />
                                <View style={{
                                    position: 'absolute',
                                    width: 8, height: 8, borderRadius: 4,
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)',
                                }} />
                            </View>
                            <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 15, marginTop: 4, lineHeight: 22 }}>
                                Discover the cosmic dance{'\n'}between two souls
                            </Text>
                        </View>

                        {/* Two sign cards side by side */}
                        <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl }}>
                            {renderSignSelector(1, sign1)}
                            <View style={{ justifyContent: 'center', paddingTop: Spacing.xl }}>
                                <View style={{
                                    width: 36, height: 36, borderRadius: 18,
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                    borderWidth: StyleSheet.hairlineWidth,
                                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                    justifyContent: 'center', alignItems: 'center',
                                }}>
                                    <Text style={{ color: colors.textTertiary, fontSize: 18, fontWeight: '300' }}>+</Text>
                                </View>
                            </View>
                            {renderSignSelector(2, sign2)}
                        </View>

                        {/* Calculate button */}
                        <TouchableOpacity
                            style={{
                                backgroundColor: (!sign1 || !sign2) ? colors.surface : ACCENT,
                                opacity: (!sign1 || !sign2) ? 0.5 : 1,
                                paddingVertical: 16,
                                borderRadius: BorderRadius.full,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: Spacing.sm,
                            }}
                            disabled={!sign1 || !sign2}
                            onPress={calculateSynastry}
                        >
                            <Text style={{ color: '#FFFFFF', fontSize: FontSizes.lg, fontWeight: FontWeights.bold, letterSpacing: 0.5 }}>
                                Calculate Compatibility
                            </Text>
                            <View style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                paddingHorizontal: 10,
                                paddingVertical: 3,
                                borderRadius: BorderRadius.full,
                            }}>
                                <Text style={{ color: '#FFFFFF', fontSize: FontSizes.xs, fontWeight: FontWeights.semibold }}>{TOKEN_COST} tokens</Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.ScrollView>
                )}

                {result && renderResultView()}
                {renderLoading()}
            </SafeAreaView>

            {renderSignPickerModal()}
        </View>
    );
};
