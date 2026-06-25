// Drum Roller Picker — shared iOS-style wheel picker.
// Used by the onboarding flow and the profile editor.
import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

export const ITEM_HEIGHT = 44;
export const VISIBLE_ITEMS = 5;
export const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DrumPickerProps {
  data: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  textSecondary: string;
  bg: string;
  /** Color of the highlighted (selected) item. Defaults to white for dark backgrounds. */
  textColor?: string;
}

export const DrumPicker: React.FC<DrumPickerProps> = React.memo(
  ({ data, selectedIndex, onSelect, textSecondary, bg, textColor = '#FFFFFF' }) => {
    const flatListRef = useRef<FlatList>(null);
    const paddedData = useMemo(() => ['', '', ...data, '', ''], [data]);

    useEffect(() => {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: selectedIndex * ITEM_HEIGHT, animated: false });
      }, 100);
      return () => clearTimeout(timer);
    }, []);

    const handleMomentumScrollEnd = useCallback((e: any) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      if (clamped !== selectedIndex) {
        onSelect(clamped);
        Haptics.selectionAsync();
      }
      flatListRef.current?.scrollToOffset({ offset: clamped * ITEM_HEIGHT, animated: true });
    }, [data.length, selectedIndex, onSelect]);

    const renderItem = useCallback(({ item, index }: { item: string; index: number }) => {
      const realIndex = index - 2;
      const isSelected = realIndex === selectedIndex;
      return (
        <View style={[dStyles.drumItem, { height: ITEM_HEIGHT }]}>
          <Text style={[
            dStyles.drumItemText,
            isSelected && dStyles.drumItemTextSelected,
            { color: isSelected ? textColor : textSecondary },
            !item && { color: 'transparent' },
          ]}>
            {item}
          </Text>
        </View>
      );
    }, [selectedIndex, textSecondary]);

    const getItemLayout = useCallback((_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }), []);

    return (
      <View style={[dStyles.drumContainer, { height: PICKER_HEIGHT }]}>
        <View style={[dStyles.drumHighlight, { top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT }]} />
        <View style={[dStyles.drumFadeTop, { backgroundColor: bg }]} pointerEvents="none" />
        <View style={[dStyles.drumFadeBottom, { backgroundColor: bg }]} pointerEvents="none" />
        <FlatList
          ref={flatListRef}
          data={paddedData}
          renderItem={renderItem}
          keyExtractor={(_, i) => String(i)}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleMomentumScrollEnd}
          getItemLayout={getItemLayout}
          bounces={false}
          nestedScrollEnabled
        />
      </View>
    );
  }
);

const dStyles = StyleSheet.create({
  drumContainer: { overflow: 'hidden', borderRadius: 14 },
  drumHighlight: {
    position: 'absolute', left: 4, right: 4, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#9D4EDD', backgroundColor: 'rgba(157,78,221,0.15)', zIndex: 1,
  },
  drumFadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_HEIGHT * 1.5, zIndex: 2, opacity: 0.7 },
  drumFadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_HEIGHT * 1.5, zIndex: 2, opacity: 0.7 },
  drumItem: { justifyContent: 'center', alignItems: 'center' },
  drumItemText: { fontSize: 16 },
  drumItemTextSelected: { fontWeight: '700', fontSize: 18 },
});
