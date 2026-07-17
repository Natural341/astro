// Banner ad — renders nothing for premium users or when no ad unit is configured
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd } from 'react-native-google-mobile-ads';
import { getBannerAdUnitId, BannerAdSize } from '../services/adMob';
import { useStore } from '../store/useStore';

export const AppBannerAd: React.FC = () => {
  const { user } = useStore();
  const unitId = getBannerAdUnitId();

  if (!unitId || user?.isPremium) return null;

  return (
    <View style={styles.container}>
      <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
});
