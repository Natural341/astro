// History Screen - Theme Aware
import React, { useState, useEffect } from 'react';
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
import { MagicStarIcon, ArrowCircleLeftIcon, CalendarIcon, ChevronRightIcon, StarIcon, PeopleIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../hooks/useTheme';
import { Spacing, BorderRadius, FontSizes, Colors } from '../config/theme';

interface AnswerRecord {
    id: string;
    answer: string;
    question?: string;
    timestamp: Date;
    lineNumber?: number;
    isFavorite: boolean;
}

export const HistoryScreen: React.FC = () => {
    const { t } = useTranslation();
    const { colors, isDark } = useTheme();
    const navigation = useNavigation();

    const [history, setHistory] = useState<AnswerRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState(0);
    const [selectedRecord, setSelectedRecord] = useState<AnswerRecord | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const storedHistory = await AsyncStorage.getItem('answer_history');
            if (storedHistory) {
                const parsed = JSON.parse(storedHistory).map((item: any) => ({
                    ...item,
                    timestamp: new Date(item.timestamp),
                }));
                setHistory(parsed);
            } else {
                // Demo data
                setHistory([
                    { id: '1', answer: 'The stars are shining for you today. It is the perfect time to take bold steps.', question: 'How will today be?', timestamp: new Date(), lineNumber: 42, isFavorite: true },
                    { id: '2', answer: 'With Venus in effect, beautiful developments may occur in your love life.', question: 'How is my love life?', timestamp: new Date(Date.now() - 86400000), lineNumber: 17, isFavorite: false },
                    { id: '3', answer: 'Be patient about your career; opportunities will knock on your door soon.', timestamp: new Date(Date.now() - 172800000), lineNumber: 88, isFavorite: false },
                ]);
            }
        } catch (e) {
            console.error('Error loading history:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFavorite = async (id: string) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const updated = history.map(item =>
            item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
        );
        setHistory(updated);
        await AsyncStorage.setItem('answer_history', JSON.stringify(updated));
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return `Today ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    const filteredHistory = selectedTab === 0 ? history : selectedTab === 1 ? history.filter(item => item.isFavorite) : [];

    // Demo consultant history
    const consultantHistory = [
        { id: 'c1', name: 'Elara Moonstone', avatar: '🌙', topic: 'Birth Chart Reading', date: new Date(Date.now() - 86400000), rating: 5, color: Colors.accent.purple },
        { id: 'c2', name: 'Orion Stargazer', avatar: '🔮', topic: 'Tarot Session', date: new Date(Date.now() - 172800000), rating: 4, color: Colors.accent.red },
        { id: 'c3', name: 'Lyra Celestine', avatar: '🌸', topic: 'Love Compatibility', date: new Date(Date.now() - 432000000), rating: 5, color: Colors.accent.cyan },
    ];

    const renderConsultantCard = (consultant: typeof consultantHistory[0]) => (
        <TouchableOpacity key={consultant.id} style={[styles.consultantCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.consultantAvatar, { backgroundColor: `${consultant.color}20` }]}>
                <Text style={styles.consultantAvatarText}>{consultant.avatar}</Text>
            </View>
            <View style={styles.consultantInfo}>
                <Text style={[styles.consultantName, { color: colors.text }]}>{consultant.name}</Text>
                <Text style={[styles.consultantTopic, { color: colors.textSecondary }]}>{consultant.topic}</Text>
                <View style={styles.consultantMeta}>
                    <CalendarIcon size={12} color={colors.textSecondary} />
                    <Text style={[styles.consultantDate, { color: colors.textSecondary }]}>{formatDate(consultant.date)}</Text>
                    <View style={styles.ratingContainer}>
                        {[...Array(consultant.rating)].map((_, i) => (
                            <Ionicons key={i} name="star" size={12} color={Colors.accent.gold} />
                        ))}
                    </View>
                </View>
            </View>
            <ChevronRightIcon size={18} color={colors.textTertiary} />
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: `${Colors.accent.purple}15` }]}>
                {selectedTab === 0 ? (
                    <MagicStarIcon size={36} color={`${Colors.accent.purple}80`} />
                ) : (
                    <Ionicons
                        name={selectedTab === 1 ? 'star' : 'people'}
                        size={36}
                        color={`${Colors.accent.purple}80`}
                    />
                )}
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {selectedTab === 0 ? 'No answers yet' : selectedTab === 1 ? 'No favorite answers' : 'No consultation history'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {selectedTab === 0 ? 'Start receiving your cosmic messages' : 'Star the answers you like'}
            </Text>
        </View>
    );

    const renderAnswerCard = (record: AnswerRecord, index: number) => (
        <TouchableOpacity
            key={record.id}
            style={[styles.answerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setSelectedRecord(record)}
        >
            <View style={styles.answerHeader}>
                <View style={[styles.numberBadge, { backgroundColor: Colors.accent.purple }]}>
                    <Text style={styles.numberText}>#{record.lineNumber || index + 1}</Text>
                </View>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(record.timestamp)}</Text>
                <TouchableOpacity
                    style={[styles.favoriteButton, { backgroundColor: colors.surface }, record.isFavorite && { backgroundColor: `${Colors.accent.gold}20` }]}
                    onPress={() => toggleFavorite(record.id)}
                >
                    <Ionicons
                        name={record.isFavorite ? 'star' : 'star-outline'}
                        size={20}
                        color={record.isFavorite ? Colors.accent.gold : colors.textTertiary}
                    />
                </TouchableOpacity>
            </View>

            <Text style={[styles.answerText, { color: colors.text }]} numberOfLines={3}>{record.answer}</Text>

            {record.question && (
                <View style={[styles.questionBadge, { backgroundColor: colors.surface }]}>
                    <Ionicons name="help-circle-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.questionText, { color: colors.textSecondary }]} numberOfLines={1}>{record.question}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backButton, { backgroundColor: colors.surface }]}
                    >
                        <ArrowCircleLeftIcon size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('historyTitle')}</Text>
                    <View style={[styles.countBadge, { backgroundColor: `${Colors.accent.purple}15` }]}>
                        <Text style={[styles.countText, { color: Colors.accent.purple }]}>{history.length} answers</Text>
                    </View>
                </View>

                {/* Tab Bar */}
                <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 0 && { backgroundColor: Colors.accent.purple }]}
                        onPress={() => setSelectedTab(0)}
                    >
                        <Ionicons name="time" size={18} color={selectedTab === 0 ? '#FFFFFF' : colors.textSecondary} />
                        <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 0 && styles.tabTextActive]}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 1 && { backgroundColor: Colors.accent.purple }]}
                        onPress={() => setSelectedTab(1)}
                    >
                        <StarIcon size={18} color={selectedTab === 1 ? '#FFFFFF' : colors.textSecondary} />
                        <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 1 && styles.tabTextActive]}>{t('favorites')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 2 && { backgroundColor: Colors.accent.purple }]}
                        onPress={() => setSelectedTab(2)}
                    >
                        <PeopleIcon size={18} color={selectedTab === 2 ? '#FFFFFF' : colors.textSecondary} />
                        <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 2 && styles.tabTextActive]}>{t('consultants')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <View style={[styles.loadingBox, { backgroundColor: `${Colors.accent.purple}15` }]}>
                            <ActivityIndicator color={Colors.accent.purple} />
                        </View>
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading')}</Text>
                    </View>
                ) : selectedTab === 2 ? (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    >
                        {consultantHistory.length > 0 ? (
                            consultantHistory.map(renderConsultantCard)
                        ) : (
                            renderEmptyState()
                        )}
                        <View style={styles.bottomSpacer} />
                    </ScrollView>
                ) : filteredHistory.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    >
                        {filteredHistory.map((record, index) => renderAnswerCard(record, index))}
                        <View style={styles.bottomSpacer} />
                    </ScrollView>
                )}

                {/* Detail Modal */}
                <Modal visible={!!selectedRecord} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {selectedRecord && (
                                    <>
                                        <View style={styles.modalHeader}>
                                            <View style={[styles.modalBadge, { backgroundColor: Colors.accent.purple }]}>
                                                <Text style={styles.modalBadgeText}>#{selectedRecord.lineNumber}</Text>
                                            </View>
                                            <View style={styles.modalTitles}>
                                                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('cosmicMessage')}</Text>
                                                <Text style={[styles.modalDate, { color: colors.textSecondary }]}>{formatDate(selectedRecord.timestamp)}</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.modalFavorite, { backgroundColor: colors.surface }, selectedRecord.isFavorite && { backgroundColor: `${Colors.accent.gold}20` }]}
                                                onPress={() => {
                                                    toggleFavorite(selectedRecord.id);
                                                    setSelectedRecord({ ...selectedRecord, isFavorite: !selectedRecord.isFavorite });
                                                }}
                                            >
                                                <Ionicons
                                                    name={selectedRecord.isFavorite ? 'star' : 'star-outline'}
                                                    size={24}
                                                    color={selectedRecord.isFavorite ? Colors.accent.gold : colors.textSecondary}
                                                />
                                            </TouchableOpacity>
                                        </View>

                                        {selectedRecord.question && (
                                            <>
                                                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('question')}</Text>
                                                <View style={[styles.questionBox, { backgroundColor: colors.surface }]}>
                                                    <Text style={[styles.questionBoxText, { color: colors.text }]}>{selectedRecord.question}</Text>
                                                </View>
                                            </>
                                        )}

                                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('answer')}</Text>
                                        <View
                                            style={[styles.answerBox, { backgroundColor: `${Colors.accent.purple}10`, borderColor: `${Colors.accent.purple}30` }]}
                                        >
                                            <Text style={[styles.answerBoxText, { color: colors.text }]}>{selectedRecord.answer}</Text>
                                        </View>
                                    </>
                                )}
                            </ScrollView>
                            <TouchableOpacity
                                style={[styles.closeButton, { backgroundColor: Colors.accent.purple }]}
                                onPress={() => setSelectedRecord(null)}
                            >
                                <Text style={styles.closeButtonText}>{t('close')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
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
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 28,
        fontWeight: '800',
        marginLeft: 16,
    },
    countBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    countText: {
        fontSize: 13,
        fontWeight: '600',
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        marginTop: 16,
        marginBottom: 8,
        padding: 4,
        borderRadius: 14,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    listContent: {
        padding: Spacing.lg,
    },
    answerCard: {
        padding: 18,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
    },
    answerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    numberBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    numberText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    dateText: {
        flex: 1,
        fontSize: 13,
        marginLeft: 12,
    },
    favoriteButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    answerText: {
        fontSize: 15,
        lineHeight: 22,
    },
    questionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        gap: 6,
    },
    questionText: {
        fontSize: 12,
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    bottomSpacer: {
        height: 100,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '75%',
        padding: 24,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalBadge: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalTitles: {
        flex: 1,
        marginLeft: 14,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    modalDate: {
        fontSize: 13,
        marginTop: 2,
    },
    modalFavorite: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    questionBox: {
        padding: 16,
        borderRadius: 14,
        marginBottom: 20,
    },
    questionBoxText: {
        fontSize: 15,
        lineHeight: 22,
    },
    answerBox: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    answerBoxText: {
        fontSize: 17,
        lineHeight: 26,
        fontWeight: '500',
    },
    closeButton: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    // Consultant styles
    consultantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    consultantAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    consultantAvatarText: {
        fontSize: 24,
    },
    consultantInfo: {
        flex: 1,
        marginLeft: 14,
    },
    consultantName: {
        fontSize: 15,
        fontWeight: '600',
    },
    consultantTopic: {
        fontSize: 13,
        marginTop: 2,
    },
    consultantMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
    },
    consultantDate: {
        fontSize: 11,
    },
    ratingContainer: {
        flexDirection: 'row',
        marginLeft: 8,
    },
});
