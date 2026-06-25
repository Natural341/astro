// Astrologers Screen — live data from Go backend
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MagicStarIcon, ArrowCircleLeftIcon, StarIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useTranslation } from '../hooks/useTranslation';
import { Spacing } from '../config/theme';
import { getAstrologers, ApiAstrologer } from '../services/api';
import { ASTROLOGERS } from '../data/astrologers';

// ─── Local avatar fallback by name ───────────────────────────────────────────
const LOCAL_AVATARS: Record<string, ImageSourcePropType> = {
  'Elara Moonstone':  require('../../assets/images/real_elara.jpg'),
  'Aamon Darkfire':   require('../../assets/images/real_aamon.jpg'),
  'Seraphina Vale':   require('../../assets/images/real_seraphina.jpg'),
  'Orion Stargazer':  require('../../assets/images/real_orion.jpg'),
  'Lyra Celestine':   require('../../assets/images/real_lyra.jpg'),
  'Zara Nightshade':  require('../../assets/images/real_lyra.jpg'),
  'Phoenix Drake':    require('../../assets/images/real_orion.jpg'),
};

// Accent colors by name (fallback palette)
const ACCENT_COLORS: Record<string, string> = {
  'Elara Moonstone': '#9D4EDD',
  'Aamon Darkfire':  '#E63946',
  'Seraphina Vale':  '#2EC4B6',
  'Orion Stargazer': '#F4A261',
  'Lyra Celestine':  '#E9C46A',
  'Zara Nightshade': '#7C3AED',
  'Phoenix Drake':   '#F97316',
};
const DEFAULT_COLOR = '#9D4EDD';

const getAvatar = (a: ApiAstrologer): ImageSourcePropType =>
  a.photo_url ? { uri: a.photo_url } : (LOCAL_AVATARS[a.name] ?? LOCAL_AVATARS['Elara Moonstone']);

const getColor = (name: string) => ACCENT_COLORS[name] ?? DEFAULT_COLOR;

// ─── Filter chips ─────────────────────────────────────────────────────────────
const FILTERS = [
  { label: 'All',      value: null,       icon: 'grid' },
  { label: 'Love',     value: 'Love',     icon: 'heart' },
  { label: 'Career',   value: 'Career',   icon: 'briefcase' },
  { label: 'Spiritual',value: 'Spiritual',icon: 'sparkles' },
];

export const AstrologersScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [astrologers, setAstrologers] = useState<ApiAstrologer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    loadAstrologers();
  }, []));

  const loadAstrologers = async () => {
    try {
      const data = await getAstrologers();
      setAstrologers(data.length > 0 ? data : fallbackData());
    } catch {
      setAstrologers(fallbackData());
    } finally {
      setLoading(false);
    }
  };

  // Fallback: convert local ASTROLOGERS to ApiAstrologer shape
  const fallbackData = (): ApiAstrologer[] =>
    ASTROLOGERS.map(a => ({
      id: a.id,
      name: a.name,
      title: a.title,
      bio: a.bio,
      photo_url: '',
      specialties: a.specializations,
      rating: a.rating,
      review_count: a.reviewCount,
      price: a.price,
      is_online: a.isOnline,
      is_ai: true,
    }));

  const filtered = selectedFilter
    ? astrologers.filter(a => a.specialties?.some(s => s.toLowerCase().includes(selectedFilter.toLowerCase())))
    : astrologers;

  const popular = astrologers.filter(a => a.rating >= 4.8).slice(0, 3);

  const goToChat = (a: ApiAstrologer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const localData = ASTROLOGERS.find(la => la.name === a.name);
    navigation.navigate('AstrologerChat', {
      astrologer: {
        name:         a.name,
        title:        a.title,
        avatar:       getAvatar(a),
        primaryColor: getColor(a.name),
        systemPrompt: localData?.systemPrompt,
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#9D4EDD" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowCircleLeftIcon size={18} color="#1C1C1E" />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>{t('cosmicGuides')}</Text>
              <Text style={styles.headerSubtitle}>
                {astrologers.length} expert advisors available
              </Text>
            </View>
          </View>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
            {FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.label}
                style={[styles.filterChip, selectedFilter === filter.value && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter.value)}
              >
                {filter.icon === 'sparkles' ? (
                  <MagicStarIcon size={16} color={selectedFilter === filter.value ? '#FFFFFF' : '#666666'} />
                ) : (
                  <Ionicons
                    name={filter.icon as any}
                    size={16}
                    color={selectedFilter === filter.value ? '#FFFFFF' : '#666666'}
                  />
                )}
                <Text style={[styles.filterText, selectedFilter === filter.value && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Featured */}
          {!selectedFilter && popular.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <StarIcon size={18} color="#FFD700" />
                <Text style={styles.sectionTitle}>{t('mostPopular')}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
                {popular.map(a => {
                  const color = getColor(a.name);
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.featuredCard, { borderColor: `${color}30` }]}
                      onPress={() => goToChat(a)}
                    >
                      <LinearGradient
                        colors={[`${color}20`, `${color}05`]}
                        style={styles.featuredGradient}
                      >
                        <View style={[styles.featuredAvatar, { borderColor: color }]}>
                          <Image source={getAvatar(a)} style={styles.avatarImage} />
                        </View>
                        <Text style={styles.featuredName}>{a.name.split(' ')[0]}</Text>
                        <Text style={styles.featuredTitle}>{a.title}</Text>
                        <View style={styles.ratingRow}>
                          <StarIcon size={14} color="#FFD700" />
                          <Text style={styles.ratingText}>{a.rating.toFixed(1)}</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* All */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedFilter ? `${selectedFilter} Specialists` : 'All Advisors'}
            </Text>
          </View>
          <View style={styles.astrologersList}>
            {filtered.map(a => {
              const color = getColor(a.name);
              return (
                <TouchableOpacity key={a.id} style={styles.astrologerCard} onPress={() => goToChat(a)}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.avatar, { borderColor: `${color}50` }]}>
                      <Image source={getAvatar(a)} style={styles.avatarImage} />
                      {a.is_online && <View style={styles.onlineIndicator} />}
                    </View>
                  </View>
                  <View style={styles.cardCenter}>
                    <View style={styles.nameRow}>
                      <Text style={styles.astrologerName}>{a.name}</Text>
                      <View style={styles.ratingBadge}>
                        <StarIcon size={12} color="#FFD700" />
                        <Text style={styles.ratingSmall}>{a.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    <Text style={[styles.astrologerTitle, { color }]}>{a.title}</Text>
                    <View style={styles.specialtiesRow}>
                      {(a.specialties || []).slice(0, 3).map((s, i) => (
                        <View key={i} style={styles.specialtyChip}>
                          <Text style={styles.specialtyText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.chatButton, { backgroundColor: color }]}
                    onPress={() => goToChat(a)}
                  >
                    <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.lg, paddingVertical: 16 },
  backButton: { padding: 10, backgroundColor: '#F0F0F0', borderRadius: 12, marginRight: 16 },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E' },
  headerSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  filtersContainer: { paddingHorizontal: Spacing.lg, paddingVertical: 12, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0', gap: 6 },
  filterChipActive: { backgroundColor: '#9D4EDD', borderColor: '#9D4EDD' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#666666' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: 16, paddingBottom: 12, gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  featuredList: { paddingHorizontal: Spacing.lg, gap: 12 },
  featuredCard: { width: 140, borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginRight: 12 },
  featuredGradient: { padding: 14, alignItems: 'center' },
  featuredAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, overflow: 'hidden', marginBottom: 10 },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', textAlign: 'center' },
  featuredTitle: { fontSize: 10, color: '#8E8E93', textAlign: 'center', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#1C1C1E' },
  astrologersList: { paddingHorizontal: Spacing.lg },
  astrologerCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  cardLeft: { marginRight: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, overflow: 'hidden' },
  onlineIndicator: { position: 'absolute', right: 2, bottom: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4ADE80', borderWidth: 2, borderColor: '#FFFFFF' },
  cardCenter: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  astrologerName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingSmall: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  astrologerTitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  specialtiesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 },
  specialtyChip: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#F0F0F0', borderRadius: 6 },
  specialtyText: { fontSize: 10, color: '#666666' },
  chatButton: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  bottomSpacer: { height: 100 },
});
