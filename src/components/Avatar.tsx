// Shared avatar with on-disk image caching (expo-image) and an initial-letter
// fallback. Replaces the per-screen avatar copies so user photos are cached
// locally and load instantly on repeat views.
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  online?: boolean;
  /** Fallback circle background (defaults to brand purple). */
  color?: string;
  /** Border color of the online dot (match the surface behind the avatar). */
  ringColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 48,
  online,
  color = '#9D4EDD',
  ringColor = '#FFFFFF',
}) => {
  const [failed, setFailed] = useState(false);
  const initial = (name || '?').charAt(0).toUpperCase();
  const dot = Math.max(10, size * 0.28);

  return (
    <View>
      {uri && !failed ? (
        <Image
          source={uri}
          onError={() => setFailed(true)}
          cachePolicy="memory-disk"
          contentFit="cover"
          transition={150}
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(0,0,0,0.06)' }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFF', fontSize: size / 2.4, fontWeight: '700' }}>{initial}</Text>
        </View>
      )}
      {online && (
        <View
          style={[
            styles.onlineDot,
            { width: dot, height: dot, borderRadius: dot / 2, borderColor: ringColor },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#22C55E',
    borderWidth: 2,
  },
});
