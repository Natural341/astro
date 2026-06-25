// Thin banner shown while the device is offline.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTranslation } from '../hooks/useTranslation';

export const OfflineBanner: React.FC = () => {
  const online = useNetworkStatus();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]}>
      <Text style={styles.text}>{t('offline')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    backgroundColor: '#EF4444', paddingBottom: 6, alignItems: 'center',
  },
  text: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
