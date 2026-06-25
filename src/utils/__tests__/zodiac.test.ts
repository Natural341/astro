import { getZodiacInfo, getZodiacSign } from '../zodiac';

describe('zodiac', () => {
  it('returns null/empty for missing or malformed dates', () => {
    expect(getZodiacInfo(undefined)).toBeNull();
    expect(getZodiacInfo('')).toBeNull();
    expect(getZodiacInfo('not-a-date')).toBeNull();
    expect(getZodiacSign(undefined)).toBe('');
  });

  it('maps representative dates to the right sun sign', () => {
    expect(getZodiacSign('1990-04-10')).toBe('Aries');
    expect(getZodiacSign('1990-05-01')).toBe('Taurus');
    expect(getZodiacSign('1990-07-04')).toBe('Cancer');
    expect(getZodiacSign('1990-08-15')).toBe('Leo');
    expect(getZodiacSign('1990-11-10')).toBe('Scorpio');
    expect(getZodiacSign('1990-01-05')).toBe('Capricorn');
    expect(getZodiacSign('1990-03-01')).toBe('Pisces');
  });

  it('handles cusp dates without a timezone shift (the original off-by-one bug)', () => {
    // June 20 is the last day of Gemini; June 21 is the first of Cancer.
    expect(getZodiacSign('2006-06-20')).toBe('Gemini');
    expect(getZodiacSign('2006-06-21')).toBe('Cancer');
    // Year boundary: Capricorn straddles December → January.
    expect(getZodiacSign('2000-12-22')).toBe('Capricorn');
    expect(getZodiacSign('2000-01-19')).toBe('Capricorn');
    expect(getZodiacSign('2000-01-20')).toBe('Aquarius');
  });

  it('parses ISO timestamps the same as plain dates', () => {
    expect(getZodiacSign('1995-08-15T00:00:00.000Z')).toBe('Leo');
  });

  it('returns symbol and element alongside the sign', () => {
    const info = getZodiacInfo('1990-08-15');
    expect(info).toEqual({ sign: 'Leo', symbol: '♌', element: 'Fire' });
  });
});
