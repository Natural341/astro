// Zodiac (sun sign) helpers — single source of truth.
// Parses the Y-M-D string directly (NOT `new Date(...)`) so the result is the
// same on every device regardless of timezone — `new Date('2006-06-20')` is
// UTC midnight and `.getDate()` reads local time, which shifts the day (and the
// sign at cusp dates) in negative-offset timezones.

export interface ZodiacInfo {
  sign: string;
  symbol: string;
  element: string;
}

const SIGNS: Array<ZodiacInfo & { check: (m: number, d: number) => boolean }> = [
  { sign: 'Aries', symbol: '♈', element: 'Fire', check: (m, d) => (m === 3 && d >= 21) || (m === 4 && d <= 19) },
  { sign: 'Taurus', symbol: '♉', element: 'Earth', check: (m, d) => (m === 4 && d >= 20) || (m === 5 && d <= 20) },
  { sign: 'Gemini', symbol: '♊', element: 'Air', check: (m, d) => (m === 5 && d >= 21) || (m === 6 && d <= 20) },
  { sign: 'Cancer', symbol: '♋', element: 'Water', check: (m, d) => (m === 6 && d >= 21) || (m === 7 && d <= 22) },
  { sign: 'Leo', symbol: '♌', element: 'Fire', check: (m, d) => (m === 7 && d >= 23) || (m === 8 && d <= 22) },
  { sign: 'Virgo', symbol: '♍', element: 'Earth', check: (m, d) => (m === 8 && d >= 23) || (m === 9 && d <= 22) },
  { sign: 'Libra', symbol: '♎', element: 'Air', check: (m, d) => (m === 9 && d >= 23) || (m === 10 && d <= 22) },
  { sign: 'Scorpio', symbol: '♏', element: 'Water', check: (m, d) => (m === 10 && d >= 23) || (m === 11 && d <= 21) },
  { sign: 'Sagittarius', symbol: '♐', element: 'Fire', check: (m, d) => (m === 11 && d >= 22) || (m === 12 && d <= 21) },
  { sign: 'Capricorn', symbol: '♑', element: 'Earth', check: (m, d) => (m === 12 && d >= 22) || (m === 1 && d <= 19) },
  { sign: 'Aquarius', symbol: '♒', element: 'Air', check: (m, d) => (m === 1 && d >= 20) || (m === 2 && d <= 18) },
  { sign: 'Pisces', symbol: '♓', element: 'Water', check: () => true },
];

/** Extract month (1-12) and day (1-31) from a 'YYYY-MM-DD' (or ISO) string. */
const parseMonthDay = (birthDate?: string): { month: number; day: number } | null => {
  if (!birthDate) return null;
  const parts = birthDate.split('T')[0].split('-');
  if (parts.length < 3) return null;
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
};

export const getZodiacInfo = (birthDate?: string): ZodiacInfo | null => {
  const md = parseMonthDay(birthDate);
  if (!md) return null;
  const found = SIGNS.find((s) => s.check(md.month, md.day));
  return found ? { sign: found.sign, symbol: found.symbol, element: found.element } : null;
};

/** Just the sign name (e.g. 'Gemini'), or '' when the date is missing/invalid. */
export const getZodiacSign = (birthDate?: string): string => getZodiacInfo(birthDate)?.sign ?? '';
