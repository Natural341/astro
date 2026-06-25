// Tarot Card Image Registry — static require() for all 78 cards
// Metro bundler requires static paths, no dynamic require()

import { ImageSourcePropType } from 'react-native';

// Major Arcana (0-21)
const MAJOR: Record<number, ImageSourcePropType> = {
  0: require('../assets/tarot/major/00_fool.jpg'),
  1: require('../assets/tarot/major/01_magician.jpg'),
  2: require('../assets/tarot/major/02_high_priestess.jpg'),
  3: require('../assets/tarot/major/03_empress.jpg'),
  4: require('../assets/tarot/major/04_emperor.jpg'),
  5: require('../assets/tarot/major/05_hierophant.jpg'),
  6: require('../assets/tarot/major/06_lovers.jpg'),
  7: require('../assets/tarot/major/07_chariot.jpg'),
  8: require('../assets/tarot/major/08_strength.jpg'),
  9: require('../assets/tarot/major/09_hermit.jpg'),
  10: require('../assets/tarot/major/10_wheel_of_fortune.jpg'),
  11: require('../assets/tarot/major/11_justice.jpg'),
  12: require('../assets/tarot/major/12_hanged_man.jpg'),
  13: require('../assets/tarot/major/13_death.jpg'),
  14: require('../assets/tarot/major/14_temperance.jpg'),
  15: require('../assets/tarot/major/15_devil.jpg'),
  16: require('../assets/tarot/major/16_tower.jpg'),
  17: require('../assets/tarot/major/17_star.jpg'),
  18: require('../assets/tarot/major/18_moon.jpg'),
  19: require('../assets/tarot/major/19_sun.jpg'),
  20: require('../assets/tarot/major/20_judgement.jpg'),
  21: require('../assets/tarot/major/21_world.jpg'),
};

// Cups (1-14: Ace=1, 2-10, Page=11, Knight=12, Queen=13, King=14)
const CUPS: Record<number, ImageSourcePropType> = {
  1: require('../assets/tarot/cups/01_ace.jpg'),
  2: require('../assets/tarot/cups/02.jpg'),
  3: require('../assets/tarot/cups/03.jpg'),
  4: require('../assets/tarot/cups/04.jpg'),
  5: require('../assets/tarot/cups/05.jpg'),
  6: require('../assets/tarot/cups/06.jpg'),
  7: require('../assets/tarot/cups/07.jpg'),
  8: require('../assets/tarot/cups/08.jpg'),
  9: require('../assets/tarot/cups/09.jpg'),
  10: require('../assets/tarot/cups/10.jpg'),
  11: require('../assets/tarot/cups/11_page.jpg'),
  12: require('../assets/tarot/cups/12_knight.jpg'),
  13: require('../assets/tarot/cups/13_queen.jpg'),
  14: require('../assets/tarot/cups/14_king.jpg'),
};

// Pentacles (1-14)
const PENTACLES: Record<number, ImageSourcePropType> = {
  1: require('../assets/tarot/pentacles/01_ace.jpg'),
  2: require('../assets/tarot/pentacles/02.jpg'),
  3: require('../assets/tarot/pentacles/03.jpg'),
  4: require('../assets/tarot/pentacles/04.jpg'),
  5: require('../assets/tarot/pentacles/05.jpg'),
  6: require('../assets/tarot/pentacles/06.jpg'),
  7: require('../assets/tarot/pentacles/07.jpg'),
  8: require('../assets/tarot/pentacles/08.jpg'),
  9: require('../assets/tarot/pentacles/09.jpg'),
  10: require('../assets/tarot/pentacles/10.jpg'),
  11: require('../assets/tarot/pentacles/11_page.jpg'),
  12: require('../assets/tarot/pentacles/12_knight.jpg'),
  13: require('../assets/tarot/pentacles/13_queen.jpg'),
  14: require('../assets/tarot/pentacles/14_king.jpg'),
};

// Swords (1-14)
const SWORDS: Record<number, ImageSourcePropType> = {
  1: require('../assets/tarot/swords/01_ace.jpg'),
  2: require('../assets/tarot/swords/02.jpg'),
  3: require('../assets/tarot/swords/03.jpg'),
  4: require('../assets/tarot/swords/04.jpg'),
  5: require('../assets/tarot/swords/05.jpg'),
  6: require('../assets/tarot/swords/06.jpg'),
  7: require('../assets/tarot/swords/07.jpg'),
  8: require('../assets/tarot/swords/08.jpg'),
  9: require('../assets/tarot/swords/09.jpg'),
  10: require('../assets/tarot/swords/10.jpg'),
  11: require('../assets/tarot/swords/11_page.jpg'),
  12: require('../assets/tarot/swords/12_knight.jpg'),
  13: require('../assets/tarot/swords/13_queen.jpg'),
  14: require('../assets/tarot/swords/14_king.jpg'),
};

// Wands (1-14)
const WANDS: Record<number, ImageSourcePropType> = {
  1: require('../assets/tarot/wands/01_ace.jpg'),
  2: require('../assets/tarot/wands/02.jpg'),
  3: require('../assets/tarot/wands/03.jpg'),
  4: require('../assets/tarot/wands/04.jpg'),
  5: require('../assets/tarot/wands/05.jpg'),
  6: require('../assets/tarot/wands/06.jpg'),
  7: require('../assets/tarot/wands/07.jpg'),
  8: require('../assets/tarot/wands/08.jpg'),
  9: require('../assets/tarot/wands/09.jpg'),
  10: require('../assets/tarot/wands/10.jpg'),
  11: require('../assets/tarot/wands/11_page.jpg'),
  12: require('../assets/tarot/wands/12_knight.jpg'),
  13: require('../assets/tarot/wands/13_queen.jpg'),
  14: require('../assets/tarot/wands/14_king.jpg'),
};

const SUIT_MAP: Record<string, Record<number, ImageSourcePropType>> = {
  cups: CUPS,
  pentacles: PENTACLES,
  swords: SWORDS,
  wands: WANDS,
};

/**
 * Get tarot card image source.
 * Major Arcana: getTarotImage('major', undefined, 0-21)
 * Minor Arcana: getTarotImage('minor', 'cups', 1-14)
 */
export function getTarotImage(
  arcana: 'major' | 'minor',
  suit: string | undefined,
  number: number
): ImageSourcePropType | undefined {
  if (arcana === 'major') return MAJOR[number];
  if (suit && SUIT_MAP[suit]) return SUIT_MAP[suit][number];
  return undefined;
}

/**
 * Get image for a TarotCard object directly.
 */
export function getCardImage(card: { arcana: 'major' | 'minor'; suit?: string; number?: number }): ImageSourcePropType | undefined {
  if (card.arcana === 'major') return MAJOR[card.number ?? 0];
  return getTarotImage('minor', card.suit, card.number ?? 1);
}
