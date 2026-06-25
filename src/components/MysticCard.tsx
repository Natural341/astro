// Mystic Card Component — gradient backgrounds, no SVG patterns
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { BorderRadius, FontSizes, Spacing } from '../config/theme';
import { ChevronRightIcon, LockIcon, type IconProps } from './icons';

interface MysticCardProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  SvgIcon?: React.FC<IconProps>;
  imageIcon?: ImageSourcePropType;
  iconColor?: string;
  bgColors?: string[];
  rightContent?: React.ReactNode;
  onPress?: () => void;
  isNew?: boolean;
  isPremium?: boolean;
  style?: ViewStyle;
}

export const MysticCard: React.FC<MysticCardProps> = ({
  title,
  subtitle,
  icon,
  SvgIcon,
  imageIcon,
  iconColor = '#9D4EDD',
  bgColors,
  rightContent,
  onPress,
  isNew = false,
  isPremium = false,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const hasBg = !!bgColors;
  const textColor = hasBg ? '#FFFFFF' : isDark ? '#FFFFFF' : '#1C1C1E';
  const subtitleColor = hasBg ? 'rgba(255,255,255,0.7)' : isDark ? 'rgba(255,255,255,0.6)' : '#8E8E93';
  const fallbackBg = isDark ? '#1E1E2C' : '#FFFFFF';

  const inner = (
    <>
      {/* Icon */}
      {(SvgIcon || icon || imageIcon) && (
        <View style={[
          styles.iconContainer,
          hasBg && styles.iconContainerBg,
          imageIcon ? styles.imageIconContainer : undefined,
        ]}>
          {imageIcon ? (
            <Image source={imageIcon} style={styles.iconImage} resizeMode="contain" />
          ) : SvgIcon ? (
            <SvgIcon size={30} color={hasBg ? '#FFFFFF' : iconColor} strokeWidth={1.6} />
          ) : icon ? (
            <Ionicons name={icon} size={30} color={hasBg ? '#FFFFFF' : iconColor} />
          ) : null}
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
        )}
      </View>

      {/* Badge, Arrow, or Custom Right Content */}
      <View style={styles.rightSection}>
        {rightContent ? rightContent : isNew ? (
          <View style={[styles.newBadge, hasBg && styles.newBadgeBg]}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        ) : isPremium ? (
          <View style={[styles.proBadge, { backgroundColor: hasBg ? 'rgba(255,255,255,0.15)' : isDark ? '#2F2F40' : '#F2F2F7' }]}>
            <LockIcon size={10} color={hasBg ? 'rgba(255,255,255,0.8)' : isDark ? 'rgba(255,255,255,0.6)' : '#666666'} strokeWidth={2} />
            <Text style={[styles.proBadgeText, { color: hasBg ? 'rgba(255,255,255,0.8)' : isDark ? 'rgba(255,255,255,0.6)' : '#666666' }]}>
              PRO
            </Text>
          </View>
        ) : (
          <ChevronRightIcon
            size={16}
            color={hasBg ? 'rgba(255,255,255,0.5)' : isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC'}
          />
        )}
      </View>
    </>
  );

  if (hasBg) {
    const locs = bgColors!.length === 5 ? [0, 0.25, 0.5, 0.75, 1]
      : bgColors!.length === 4 ? [0, 0.33, 0.66, 1]
      : bgColors!.length === 3 ? [0, 0.5, 1]
      : [0, 1];

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.outerWrap, style]}>
        <LinearGradient
          colors={bgColors! as [string, string, ...string[]]}
          locations={locs as [number, number, ...number[]]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradientContainer}
        >
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, { backgroundColor: fallbackBg }, style]}
    >
      {inner}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  gradientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconContainerBg: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
  },
  imageIconContainer: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  iconImage: {
    width: 44,
    height: 44,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginTop: 4,
  },
  rightSection: {
    marginLeft: Spacing.sm,
  },
  newBadge: {
    backgroundColor: '#FF4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeBg: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});
