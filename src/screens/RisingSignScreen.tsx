// Rising Sign Calculation Screen - Theme Aware
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ArrowCircleLeftIcon, ChevronRightIcon, RefreshIcon, SparklesIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../hooks/useTheme';
import { Spacing, BorderRadius, FontSizes, Colors } from '../config/theme';

const ZODIAC_SIGNS = [
    { name: 'Aries', symbol: '♈', color: '#FF5252', element: 'Fire', rising: 'Energetic, brave, and outgoing appearance.' },
    { name: 'Taurus', symbol: '♉', color: '#4CAF50', element: 'Earth', rising: 'Calm, reliable, and aesthetically minded.' },
    { name: 'Gemini', symbol: '♊', color: '#00BCD4', element: 'Air', rising: 'Curious, talkative, and adaptable.' },
    { name: 'Cancer', symbol: '♋', color: '#2196F3', element: 'Water', rising: 'Protective, compassionate, and sensitive.' },
    { name: 'Leo', symbol: '♌', color: '#FF9800', element: 'Fire', rising: 'Charismatic, proud, and eye-catching.' },
    { name: 'Virgo', symbol: '♍', color: '#8BC34A', element: 'Earth', rising: 'Organized, analytical, and perfectionist.' },
    { name: 'Libra', symbol: '♎', color: '#E91E63', element: 'Air', rising: 'Elegant, diplomatic, and attractive.' },
    { name: 'Scorpio', symbol: '♏', color: '#9C27B0', element: 'Water', rising: 'Mysterious, intense, and magnetic.' },
    { name: 'Sagittarius', symbol: '♐', color: '#FF5722', element: 'Fire', rising: 'Optimistic, adventurous, and free-spirited.' },
    { name: 'Capricorn', symbol: '♑', color: '#795548', element: 'Earth', rising: 'Serious, ambitious, and responsible.' },
    { name: 'Aquarius', symbol: '♒', color: '#03A9F4', element: 'Air', rising: 'Original, innovative, and independent.' },
    { name: 'Pisces', symbol: '♓', color: '#673AB7', element: 'Water', rising: 'Dreamy, empathetic, and artistic.' },
];

const CITIES = ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Eskisehir', 'Konya', 'Adana'];

export const RisingSignScreen: React.FC = () => {
    const { t } = useTranslation();
    const { colors, isDark } = useTheme();
    const navigation = useNavigation();

    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showPicker, setShowPicker] = useState<'year' | 'hour' | 'city' | null>(null);

    const calculate = async () => {
        if (selectedYear === null || selectedHour === null || !selectedCity) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        setIsCalculating(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        const index = (selectedHour + (selectedYear % 12)) % 12;
        setResult(ZODIAC_SIGNS[index]);
        setIsCalculating(false);
        setShowResult(true);
    };

    const reset = () => {
        setShowResult(false);
        setResult(null);
        setSelectedYear(null);
        setSelectedHour(null);
        setSelectedCity(null);
    };

    const renderInputView = () => (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Intro */}
            <View style={[styles.introCard, { backgroundColor: `${Colors.accent.purple}15` }]}>
                <View style={{ marginRight: 12 }}><SparklesIcon size={24} color={Colors.accent.purple} /></View>
                <Text style={[styles.introText, { color: colors.text }]}>{t('faceYouShow')}</Text>
            </View>

            {/* Date Input */}
            <TouchableOpacity
                style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }, selectedYear !== null && { borderColor: `${Colors.accent.purple}50` }]}
                onPress={() => setShowPicker('year')}
            >
                <Ionicons name="calendar" size={22} color={selectedYear ? Colors.accent.purple : colors.textSecondary} />
                <View style={styles.inputContent}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('birthYear')}</Text>
                    <Text style={[styles.inputValue, { color: colors.textSecondary }, selectedYear !== null && { color: colors.text, fontWeight: '600' }]}>
                        {selectedYear ? String(selectedYear) : 'Select year'}
                    </Text>
                </View>
                <ChevronRightIcon size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            {/* Time Input */}
            <TouchableOpacity
                style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }, selectedHour !== null && { borderColor: `${Colors.accent.purple}50` }]}
                onPress={() => setShowPicker('hour')}
            >
                <Ionicons name="time" size={22} color={selectedHour !== null ? Colors.accent.purple : colors.textSecondary} />
                <View style={styles.inputContent}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('birthTime')}</Text>
                    <Text style={[styles.inputValue, { color: colors.textSecondary }, selectedHour !== null && { color: colors.text, fontWeight: '600' }]}>
                        {selectedHour !== null ? `${selectedHour.toString().padStart(2, '0')}:00` : 'Select time'}
                    </Text>
                </View>
                <ChevronRightIcon size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            {/* City Input */}
            <TouchableOpacity
                style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }, selectedCity && { borderColor: `${Colors.accent.purple}50` }]}
                onPress={() => setShowPicker('city')}
            >
                <Ionicons name="location" size={22} color={selectedCity ? Colors.accent.purple : colors.textSecondary} />
                <View style={styles.inputContent}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('birthPlace')}</Text>
                    <Text style={[styles.inputValue, { color: colors.textSecondary }, selectedCity && { color: colors.text, fontWeight: '600' }]}>
                        {selectedCity || 'Select city'}
                    </Text>
                </View>
                <ChevronRightIcon size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            {/* Calculate Button */}
            <TouchableOpacity
                style={[styles.calculateButton, { backgroundColor: (!selectedYear || selectedHour === null || !selectedCity) ? colors.surfaceVariant : Colors.accent.purple }, (!selectedYear || selectedHour === null || !selectedCity) && styles.calculateButtonDisabled]}
                onPress={calculate}
                disabled={!selectedYear || selectedHour === null || !selectedCity || isCalculating}
            >
                <View style={styles.calculateButtonGradient}>
                    {isCalculating ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.calculateButtonText}>{t('discoverRisingSign')}</Text>
                    )}
                </View>
            </TouchableOpacity>

            {/* Pickers */}
            <Modal visible={showPicker === 'year'} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('selectBirthYear')}</Text>
                        <ScrollView style={styles.pickerList}>
                            {Array.from({ length: 80 }, (_, i) => 2010 - i).map(year => (
                                <TouchableOpacity
                                    key={year}
                                    style={[styles.pickerItem, { borderBottomColor: colors.divider }]}
                                    onPress={() => { setSelectedYear(year); setShowPicker(null); }}
                                >
                                    <Text style={[styles.pickerItemText, { color: colors.text }]}>{year}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]} onPress={() => setShowPicker(null)}>
                            <Text style={[styles.modalCloseBtnText, { color: Colors.accent.purple }]}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showPicker === 'hour'} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('selectBirthTime')}</Text>
                        <ScrollView style={styles.pickerList}>
                            {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                                <TouchableOpacity
                                    key={hour}
                                    style={[styles.pickerItem, { borderBottomColor: colors.divider }]}
                                    onPress={() => { setSelectedHour(hour); setShowPicker(null); }}
                                >
                                    <Text style={[styles.pickerItemText, { color: colors.text }]}>{hour.toString().padStart(2, '0')}:00</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]} onPress={() => setShowPicker(null)}>
                            <Text style={[styles.modalCloseBtnText, { color: Colors.accent.purple }]}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showPicker === 'city'} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('selectBirthPlace')}</Text>
                        <ScrollView style={styles.pickerList}>
                            {CITIES.map(city => (
                                <TouchableOpacity
                                    key={city}
                                    style={[styles.pickerItem, { borderBottomColor: colors.divider }]}
                                    onPress={() => { setSelectedCity(city); setShowPicker(null); }}
                                >
                                    <Text style={[styles.pickerItemText, { color: colors.text }]}>{city}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]} onPress={() => setShowPicker(null)}>
                            <Text style={[styles.modalCloseBtnText, { color: Colors.accent.purple }]}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );

    const renderResultView = () => {
        if (!result) return null;

        return (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: `${result.color}40` }]}>
                    <Text style={[styles.resultLabel, { color: colors.text }]}>{t('yourRisingSign')}</Text>

                    <View style={[styles.symbolCircle, { backgroundColor: `${result.color}20`, borderColor: result.color }]}>
                        <Text style={styles.symbolText}>{result.symbol}</Text>
                    </View>

                    <Text style={[styles.resultName, { color: colors.text }]}>{result.name}</Text>

                    <View style={[styles.elementBadge, { backgroundColor: `${result.color}15` }]}>
                        <Text style={[styles.elementText, { color: result.color }]}>{result.element} Element</Text>
                    </View>

                    <Text style={[styles.risingDesc, { color: colors.textSecondary }]}>{result.rising}</Text>
                </View>

                <TouchableOpacity style={[styles.resetButton, { borderColor: Colors.accent.purple }]} onPress={reset}>
                    <RefreshIcon size={20} color={Colors.accent.purple} />
                    <Text style={[styles.resetButtonText, { color: Colors.accent.purple }]}>{t('newCalculation')}</Text>
                </TouchableOpacity>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backButton, { backgroundColor: colors.surface }]}
                    >
                        <ArrowCircleLeftIcon size={18} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('risingSign')}</Text>
                    <View style={[styles.proBadge, { backgroundColor: Colors.accent.gold }]}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                </View>

                {showResult ? renderResultView() : renderInputView()}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    backButton: {
        padding: 10,
        borderRadius: 12,
    },
    headerTitle: {
        flex: 1,
        fontSize: 22,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    proBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    proBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000000',
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    introCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    introText: {
        flex: 1,
        fontSize: 14,
    },
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 12,
    },
    inputContent: {
        flex: 1,
        marginLeft: 14,
    },
    inputLabel: {
        fontSize: 11,
    },
    inputValue: {
        fontSize: 14,
        marginTop: 2,
    },
    calculateButton: {
        marginTop: 24,
        borderRadius: 14,
        overflow: 'hidden',
    },
    calculateButtonDisabled: {
        opacity: 0.6,
    },
    calculateButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    calculateButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 20,
        padding: 20,
        width: '80%',
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    pickerList: {
        maxHeight: 300,
    },
    pickerItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    pickerItemText: {
        fontSize: 16,
        textAlign: 'center',
    },
    modalCloseBtn: {
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 12,
    },
    modalCloseBtnText: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    // Result
    resultCard: {
        padding: 28,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
    },
    resultLabel: {
        fontSize: 16,
        marginBottom: 20,
    },
    symbolCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    symbolText: {
        fontSize: 50,
    },
    resultName: {
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 16,
    },
    elementBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8,
    },
    elementText: {
        fontSize: 12,
        fontWeight: '600',
    },
    risingDesc: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 21,
    },
    resetButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        paddingVertical: 16,
        borderWidth: 2,
        borderRadius: 14,
        gap: 8,
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 100,
    },
});
