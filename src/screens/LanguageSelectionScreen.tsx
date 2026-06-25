// Language Selection Screen — Modern dark-first, matte cards
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CheckIcon, LanguageIcon, ChevronRightIcon, ArrowCircleLeftIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { Spacing } from '../config/theme';

interface Language {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
}

// App ships with full Turkish + English translations only.
const LANGUAGES: Language[] = [
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
];

export const LanguageSelectionScreen: React.FC<{ route?: any }> = ({ route }) => {
    const navigation = useNavigation<any>();
    const { language, setLanguage } = useStore();
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const [selectedCode, setSelectedCode] = useState(language || 'tr');
    const fromProfile = route?.params?.fromProfile === true;

    const bg = isDark ? 'transparent' : '#F8F9FA';
    const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
    const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
    const subText = isDark ? 'rgba(255,255,255,0.55)' : '#8E8E93';
    const borderColor = isDark ? 'rgba(255,255,255,0.07)' : '#E5E5EA';

    useEffect(() => {
        if (language) setSelectedCode(language);
    }, [language]);

    const handleSelectLanguage = (code: string) => {
        Haptics.selectionAsync();
        setSelectedCode(code);
    };

    const handleContinue = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await AsyncStorage.setItem('selectedLanguage', selectedCode);
        setLanguage(selectedCode);
        if (fromProfile) {
            navigation.goBack();
            return;
        }
        // First launch: language → intro tour. The intro marks onboarding seen and
        // routes to Auth. (Profile form only after registration.)
        navigation.navigate('Intro');
    };

    const renderLanguageItem = ({ item }: { item: Language }) => {
        const isSelected = selectedCode === item.code;

        return (
            <TouchableOpacity
                style={[
                    styles.languageItem,
                    { backgroundColor: cardBg, borderColor },
                    isSelected && styles.languageItemSelected,
                ]}
                onPress={() => handleSelectLanguage(item.code)}
                activeOpacity={0.7}
            >
                <View style={styles.itemLeft}>
                    <Text style={styles.flag}>{item.flag}</Text>
                    <View>
                        <Text style={[styles.languageName, { color: isSelected ? '#9D4EDD' : textColor }]}>
                            {item.nativeName}
                        </Text>
                        <Text style={[styles.languageSub, { color: subText }]}>
                            {item.name}
                        </Text>
                    </View>
                </View>
                {isSelected && (
                    <View style={styles.checkCircle}>
                        <CheckIcon size={16} color="#FFFFFF" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Back button (only when from Profile) */}
                    {fromProfile && (
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0F0F0' }]}
                        >
                            <ArrowCircleLeftIcon size={24} color={textColor} />
                        </TouchableOpacity>
                    )}

                    {/* Header */}
                    <View style={[styles.header, fromProfile && { paddingTop: 8 }]}>
                        <LanguageIcon size={36} color="#9D4EDD" />
                        <Text style={[styles.title, { color: textColor }]}>
                            {fromProfile ? t('changeLanguage') : t('chooseLanguage')}
                        </Text>
                        <Text style={[styles.subtitle, { color: subText }]}>
                            {fromProfile ? t('changeLanguageSub') : t('chooseLanguageSub')}
                        </Text>
                    </View>

                    {/* Language List */}
                    <FlatList
                        data={LANGUAGES}
                        renderItem={renderLanguageItem}
                        keyExtractor={(item) => item.code}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />

                    {/* Continue Button */}
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueText}>{fromProfile ? t('save') : t('continueButton')}</Text>
                        <ChevronRightIcon size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
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
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    header: {
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 32,
        gap: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        marginTop: 12,
    },
    subtitle: {
        fontSize: 14,
    },
    listContainer: {
        paddingBottom: 16,
    },
    separator: {
        height: 10,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    languageItemSelected: {
        borderColor: '#9D4EDD',
        borderWidth: 2,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    flag: {
        fontSize: 28,
    },
    languageName: {
        fontSize: 16,
        fontWeight: '600',
    },
    languageSub: {
        fontSize: 12,
        marginTop: 2,
    },
    checkCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#9D4EDD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    continueButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#9D4EDD',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#9D4EDD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    continueText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    backButton: {
        padding: 12,
        borderRadius: 14,
        alignSelf: 'flex-start',
    },
});
