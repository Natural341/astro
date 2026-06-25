// Astrologer Avatar Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { VerifyIcon } from '../components/icons';
import { Astrologer } from '../types';
import { useTheme } from '../hooks/useTheme';

interface AstrologerAvatarProps {
  astrologer: Astrologer;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const AstrologerAvatar: React.FC<AstrologerAvatarProps> = ({
  astrologer,
  onPress,
  size = 'medium',
}) => {
  const { isDark } = useTheme();

  const dimensions = {
    small: { outer: 50, inner: 44 },
    medium: { outer: 70, inner: 64 },
    large: { outer: 90, inner: 82 },
  };

  const { outer, inner } = dimensions[size];
  const bgColor = isDark ? '#0D0D1A' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.avatarWrapper}>
        {/* Gradient border */}
        <LinearGradient
          colors={[astrologer.primaryColor, astrologer.secondaryColor]}
          style={[styles.gradientBorder, { width: outer, height: outer, borderRadius: outer / 2 }]}
        >
          {/* Inner white/dark circle */}
          <View
            style={[
              styles.innerCircle,
              {
                width: inner,
                height: inner,
                borderRadius: inner / 2,
                backgroundColor: bgColor,
              },
            ]}
          >
            {/* Avatar image */}
            <Image
              source={{ uri: astrologer.imageUrl }}
              style={[
                styles.avatar,
                {
                  width: inner - 4,
                  height: inner - 4,
                  borderRadius: (inner - 4) / 2,
                },
              ]}
            />
          </View>
        </LinearGradient>

        {/* Verified badge */}
        <View style={styles.verifiedBadge}>
          <VerifyIcon size={16} color="#1DA1F2" />
        </View>
      </View>

      {/* Name */}
      <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
        {astrologer.name.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  gradientBorder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#E0E0E0',
  },
  verifiedBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  name: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
});
