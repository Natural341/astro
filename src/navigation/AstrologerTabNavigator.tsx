import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AstrologerRequestsScreen } from '../screens/AstrologerRequestsScreen';
import { AstrologerEarningsScreen } from '../screens/AstrologerEarningsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import { useTheme } from '../hooks/useTheme';
import { ChatBubbleIcon, WalletIcon, UserIcon, type IconProps } from '../components/icons';

const Tab = createBottomTabNavigator();
const ACCENT = '#9D4EDD';

function CustomAstrologerTabBar({ state, navigation }: any) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const pillAnims = useRef(
    state.routes.map((_: any, i: number) => new Animated.Value(i === state.index ? 1 : 0))
  ).current;
  const prevIndex = useRef(state.index);

  useEffect(() => {
    const idx = state.index;
    if (idx !== prevIndex.current) {
      Animated.parallel([
        Animated.timing(pillAnims[prevIndex.current], { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.spring(pillAnims[idx], { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
      ]).start();
      prevIndex.current = idx;
    }
  }, [state.index]);

  const tabs: { key: string; Icon: React.FC<IconProps> }[] = [
    { key: 'Requests', Icon: ChatBubbleIcon },
    { key: 'Earnings', Icon: WalletIcon },
    { key: 'AstroProfile', Icon: UserIcon },
  ];

  const activeColor = isDark ? 'rgba(228,228,232,0.88)' : 'rgba(24,24,27,0.82)';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.32)';
  const pillBg = isDark ? 'rgba(157,78,221,0.12)' : 'rgba(157,78,221,0.08)';
  const pillBorder = isDark ? 'rgba(157,78,221,0.15)' : 'rgba(157,78,221,0.1)';

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
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => { if (!isFocused) navigation.navigate(tab.key); }}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabIconWrap}>
                    <Animated.View
                      style={[
                        styles.tabIconPill,
                        { opacity: pillAnims[idx], backgroundColor: pillBg, borderColor: pillBorder },
                      ]}
                    />
                    <tab.Icon
                      size={24}
                      color={isFocused ? activeColor : inactiveColor}
                      strokeWidth={isFocused ? 2 : 1.5}
                    />
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

export const AstrologerTabNavigator: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#09090F' : '#F2EEF8' }]}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: { display: 'none' },
        }}
        tabBar={(props) => <CustomAstrologerTabBar {...props} />}
      >
        <Tab.Screen name="Requests" component={AstrologerRequestsScreen} />
        <Tab.Screen name="Earnings" component={AstrologerEarningsScreen} />
        <Tab.Screen name="AstroProfile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
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
});
