// Settings Screen - Theme Aware
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MagicStarIcon, ArrowCircleLeftIcon, UserIcon, LogoutIcon, LoginIcon, VerifyIcon, ChevronRightIcon, CheckIcon, BellIcon, TrashIcon, ShieldTickIcon, DocumentTextIcon, MusicNoteIcon, LockIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';

import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/useStore';
import { Spacing, BorderRadius, FontSizes, Colors } from '../config/theme';
import { AppConfig } from '../config/appConfig';

const LANGUAGES = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export const SettingsScreen: React.FC = () => {
    const { t, language } = useTranslation();
    const { colors, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const { isAuthenticated, user, logout, setLanguage } = useStore();

    const [isMusicEnabled, setIsMusicEnabled] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState<string>(language);

    const handleLogout = () => {
        Alert.alert(
            t('signOut'),
            t('signOutConfirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('signOut'),
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
                    }
                },
            ]
        );
    };

    const handleClearHistory = () => {
        Alert.alert(
            'Clear History',
            'All your history will be deleted. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        // Clear history logic
                        Alert.alert('History cleared');
                    }
                },
            ]
        );
    };

    const handleLanguageChange = (langCode: string) => {
        setSelectedLanguage(langCode);
        setLanguage(langCode);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const currentLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backButton, { backgroundColor: colors.surface }]}
                    >
                        <ArrowCircleLeftIcon size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Account Section */}
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {isAuthenticated ? (
                            <>
                                <View style={styles.settingItem}>
                                    <View style={[styles.itemIcon, { backgroundColor: `${Colors.accent.purple}15` }]}>
                                        <UserIcon size={20} color={Colors.accent.purple} />
                                    </View>
                                    <View style={styles.itemContent}>
                                        <Text style={[styles.itemTitle, { color: colors.text }]}>{user?.email?.split('@')[0] || 'User'}</Text>
                                        <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                                            {user?.email || 'example@email.com'}
                                            {user?.zodiacSign ? ` • ${user.zodiacSign}` : ''}
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                                <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('ChangePassword' as never)}>
                                    <View style={[styles.itemIcon, { backgroundColor: `${Colors.accent.purple}15` }]}>
                                        <LockIcon size={20} color={Colors.accent.purple} />
                                    </View>
                                    <View style={styles.itemContent}>
                                        <Text style={[styles.itemTitle, { color: colors.text }]}>Change Password</Text>
                                        <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>Update your password</Text>
                                    </View>
                                    <ChevronRightIcon size={20} color={colors.textTertiary} />
                                </TouchableOpacity>
                                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                                <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
                                    <View style={[styles.itemIcon, { backgroundColor: `${colors.error}15` }]}>
                                        <LogoutIcon size={20} color={colors.error} />
                                    </View>
                                    <View style={styles.itemContent}>
                                        <Text style={[styles.itemTitle, { color: colors.text }]}>Sign Out</Text>
                                        <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>Sign out of your account</Text>
                                    </View>
                                    <ChevronRightIcon size={20} color={colors.textTertiary} />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => navigation.navigate('Auth' as never)}
                            >
                                <View style={[styles.itemIcon, { backgroundColor: `${Colors.accent.purple}15` }]}>
                                    <LoginIcon size={20} color={Colors.accent.purple} />
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={[styles.itemTitle, { color: colors.text }]}>Sign In</Text>
                                    <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>Sign in to your account</Text>
                                </View>
                                <ChevronRightIcon size={20} color={colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Language Section */}
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Language</Text>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.languageGrid}>
                            {LANGUAGES.map((lang) => (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={[
                                        styles.languageItem,
                                        { backgroundColor: colors.surface, borderColor: colors.border },
                                        selectedLanguage === lang.code && { backgroundColor: `${Colors.accent.purple}15`, borderColor: Colors.accent.purple }
                                    ]}
                                    onPress={() => handleLanguageChange(lang.code)}
                                >
                                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                                    <Text style={[
                                        styles.languageName,
                                        { color: colors.text },
                                        selectedLanguage === lang.code && { color: Colors.accent.purple, fontWeight: '600' }
                                    ]}>{lang.name}</Text>
                                    {selectedLanguage === lang.code && (
                                        <View style={[styles.checkBadge, { backgroundColor: Colors.accent.purple }]}>
                                            <CheckIcon size={12} color="#FFFFFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Preferences Section */}
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.settingItem}>
                            <View style={[styles.itemIcon, { backgroundColor: `${Colors.accent.purple}15` }]}>
                                <MusicNoteIcon size={20} color={Colors.accent.purple} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemTitle, { color: colors.text }]}>Background Music</Text>
                                <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>{isMusicEnabled ? 'On' : 'Off'}</Text>
                            </View>
                            <Switch
                                value={isMusicEnabled}
                                onValueChange={setIsMusicEnabled}
                                trackColor={{ false: colors.border, true: `${Colors.accent.purple}50` }}
                                thumbColor={isMusicEnabled ? Colors.accent.purple : colors.surface}
                            />
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                        <View style={styles.settingItem}>
                            <View style={[styles.itemIcon, { backgroundColor: `${colors.success}15` }]}>
                                <BellIcon size={20} color={colors.success} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemTitle, { color: colors.text }]}>Notifications</Text>
                                <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>{notificationsEnabled ? 'On' : 'Off'}</Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: colors.border, true: `${colors.success}50` }}
                                thumbColor={notificationsEnabled ? colors.success : colors.surface}
                            />
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                        <TouchableOpacity style={styles.settingItem} onPress={handleClearHistory}>
                            <View style={[styles.itemIcon, { backgroundColor: `${colors.error}15` }]}>
                                <TrashIcon size={20} color={colors.error} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemTitle, { color: colors.text }]}>Clear History</Text>
                                <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>Delete all your readings</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* About Section */}
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>App</Text>
                    <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.aboutIconContainer, { backgroundColor: colors.surface, borderColor: `${Colors.accent.purple}50` }]}>
                            <MagicStarIcon size={28} color={Colors.accent.purple} />
                        </View>
                        <Text style={[styles.aboutAppName, { color: colors.text }]}>Kosmos</Text>
                        <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>v1.0.0</Text>
                        <Text style={[styles.aboutDescription, { color: colors.textSecondary }]}>
                            Your mystical guide: Discover your future with horoscopes, tarot, coffee readings, and more.
                        </Text>
                    </View>

                    {/* Legal Section */}
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Legal</Text>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={() => WebBrowser.openBrowserAsync(AppConfig.privacyPolicyUrl)}
                        >
                            <View style={[styles.itemIcon, { backgroundColor: `${colors.success}15` }]}>
                                <ShieldTickIcon size={20} color={colors.success} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemTitle, { color: colors.text }]}>Privacy Policy</Text>
                            </View>
                            <ChevronRightIcon size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={() => WebBrowser.openBrowserAsync(AppConfig.termsOfServiceUrl)}
                        >
                            <View style={[styles.itemIcon, { backgroundColor: `${Colors.accent.blue}15` }]}>
                                <DocumentTextIcon size={20} color={Colors.accent.blue} />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemTitle, { color: colors.text }]}>Terms of Service</Text>
                            </View>
                            <ChevronRightIcon size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomSpacer} />
                </ScrollView>
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
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    backButton: {
        padding: 12,
        borderRadius: 14,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    headerSpacer: {
        width: 48,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    itemIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    itemSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
    languageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
        gap: 8,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    languageFlag: {
        fontSize: 18,
    },
    languageName: {
        fontSize: 13,
        fontWeight: '500',
    },
    checkBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aboutCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 24,
    },
    aboutIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        marginBottom: 16,
    },
    aboutAppName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    aboutVersion: {
        fontSize: 13,
        marginBottom: 16,
    },
    aboutDescription: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 21,
    },
    bottomSpacer: {
        height: 100,
    },
});
