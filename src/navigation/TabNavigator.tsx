import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Animated,
  Text,
  Image,
  Dimensions,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { HomeScreen } from '../screens/HomeScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HoroscopeCalendarScreen } from '../screens/HoroscopeCalendarScreen';

import { useTheme } from '../hooks/useTheme';
import { getUnreadCount } from '../services/api';

import {
  HomeIcon,
  CalendarIcon,
  SparklesIcon,
  ChatBubbleIcon,
  UserIcon,
  PlusIcon,
} from '../components/icons';

const Tab = createBottomTabNavigator();

const ACCENT = '#9D4EDD';

// ─── Floating Glass Tab Bar ──────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation: tabNavigation }: any) {
  const rootNavigation = useNavigation<any>();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetch = () => {
        getUnreadCount().then(r => setUnreadCount(r.count)).catch(() => {});
      };
      fetch();
      const interval = setInterval(fetch, 30000);
      return () => clearInterval(interval);
    }, []),
  );

  // Per-tab pill opacity animations
  const pillAnims = useRef(
    state.routes.map((_: any, i: number) => new Animated.Value(i === state.index ? 1 : 0))
  ).current;
  const prevIndex = useRef(state.index);

  useEffect(() => {
    const idx = state.index;
    if (idx !== prevIndex.current) {
      Animated.parallel([
        Animated.timing(pillAnims[prevIndex.current], {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(pillAnims[idx], {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
      prevIndex.current = idx;
    }
  }, [state.index]);

  // Center AI button animation
  const fabRotation = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  const handleCenterPress = () => {
    Animated.sequence([
      Animated.spring(fabScale, { toValue: 0.85, useNativeDriver: true, damping: 10, stiffness: 300 }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 200 }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rootNavigation.navigate('AIChat');
  };

  const activeColor = isDark ? 'rgba(228,228,232,0.88)' : 'rgba(24,24,27,0.82)';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.32)';
  const pillBg = isDark ? 'rgba(157,78,221,0.12)' : 'rgba(157,78,221,0.08)';
  const pillBorder = isDark ? 'rgba(157,78,221,0.15)' : 'rgba(157,78,221,0.1)';

  // Tab config: index → icon component
  const tabs = [
    { key: 'Home', Icon: HomeIcon, isCenter: false },
    { key: 'Calendar', Icon: CalendarIcon, isCenter: false },
    { key: 'AIChatPlaceholder', Icon: SparklesIcon, isCenter: true },
    { key: 'Messages', Icon: ChatBubbleIcon, isCenter: false },
    { key: 'Profile', Icon: UserIcon, isCenter: false },
  ];

  const bottomPadding = Platform.OS === 'android'
    ? Math.max(insets.bottom, 10)
    : Math.max(insets.bottom - 6, 0);

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBarShadow}>
        <View
          style={[
            styles.tabBarGlass,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              backgroundColor: isDark ? 'rgba(12,12,18,0.95)' : 'rgba(255,255,255,0.97)',
            },
          ]}
        >
          <View style={styles.tabBar}>
            {tabs.map((tab, idx) => {
              const isFocused = state.index === idx;

              // Center AI button
              if (tab.isCenter) {
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.tabItemCenter}
                    onPress={handleCenterPress}
                    activeOpacity={0.8}
                  >
                    <Animated.View
                      style={[
                        styles.fab,
                        {
                          transform: [{ scale: fabScale }],
                        },
                      ]}
                    >
                      <Image
                        source={require('../../assets/images/start.png')}
                        style={{ width: 64, height: 64, borderRadius: 32 }}
                      />
                    </Animated.View>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => {
                    if (!isFocused) {
                      tabNavigation.navigate(tab.key);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabIconWrap}>
                    {/* Pill background */}
                    <Animated.View
                      style={[
                        styles.tabIconPill,
                        {
                          opacity: pillAnims[idx],
                          backgroundColor: pillBg,
                          borderColor: pillBorder,
                        },
                      ]}
                    />
                    <tab.Icon
                      size={24}
                      color={isFocused ? activeColor : inactiveColor}
                      strokeWidth={isFocused ? 2 : 1.5}
                    />
                    {/* Badge for messages */}
                    {tab.key === 'Messages' && unreadCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────
export const TabNavigator: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#09090F' : '#F2EEF8' }]}>
      {isDark && (
        <Image
          source={require('../../assets/images/bbg.png')}
          style={styles.darkBg}
          resizeMode="cover"
        />
      )}
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: { display: 'none' },
          sceneStyle: { backgroundColor: 'transparent' },
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Calendar" component={HoroscopeCalendarScreen} />
        <Tab.Screen
          name="AIChatPlaceholder"
          component={View}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('AIChat');
            },
          }}
        />
        <Tab.Screen name="Messages" component={MessagesScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  darkBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    zIndex: 0,
  },

  // Floating tab bar — absolute bottom with side margins
  tabBarOuter: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    zIndex: 1001,
  },
  tabBarShadow: {
    borderRadius: 22,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 14,
  },
  tabBarGlass: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
  },

  // Tab items
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  tabItemCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconPill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },

  // Center FAB — squircle style (not circle)
  fab: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Message badge
  badge: {
    position: 'absolute',
    top: 2,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
