export type ZodiacSignName = 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';
export type Gender = 'Male' | 'Female';

export interface ZodiacSignData {
    id: ZodiacSignName;
    name: string;
    symbol: string;
    element: 'Fire' | 'Earth' | 'Air' | 'Water';
    quality: 'Cardinal' | 'Fixed' | 'Mutable';
    ruler: string;
    path: string;
    color: string;
    dates: string;
}

export interface CompatibilityResult {
    score: number;
    title: string;
    description: string;
    keywords: string[];
    loveScore: number;
    communicationScore: number;
    emotionalScore: number;
    challenge: string;
}

export const ZODIAC_SIGNS: Record<ZodiacSignName, ZodiacSignData> = {
    Aries: {
        id: 'Aries', name: 'Aries', symbol: '\u2648', element: 'Fire', quality: 'Cardinal', ruler: 'Mars', color: '#FF453A', dates: 'Mar 21 - Apr 19',
        path: "M12 21a9 9 0 0 0 9-9c0-3.31-2.69-6-6-6-.9 0-1.72.33-2.34.86C11.54 4.54 11 2 12 2c1 0 .46 2.54-.66 4.86-.62-.53-1.44-.86-2.34-.86-3.31 0-6 2.69-6 6a9 9 0 0 0 9 9z"
    },
    Taurus: {
        id: 'Taurus', name: 'Taurus', symbol: '\u2649', element: 'Earth', quality: 'Fixed', ruler: 'Venus', color: '#30D158', dates: 'Apr 20 - May 20',
        path: "M12 2a7 7 0 0 1 7 7c0 2.2-1.8 3.5-3.5 3.5-.9 0-1.5-.7-1.5-1.5 0-1.1.9-2 2-2 1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2H8c0-1.1-.9-2-2-2s-2 .9-2 2 1 2 2 2 2 .9 2 2c0 .8-.6 1.5-1.5 1.5C4.8 12.5 3 11.2 3 9a7 7 0 0 1 9-7zm0 13a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"
    },
    Gemini: {
        id: 'Gemini', name: 'Gemini', symbol: '\u264A', element: 'Air', quality: 'Mutable', ruler: 'Mercury', color: '#FFD60A', dates: 'May 21 - Jun 20',
        path: "M16 2a2 2 0 0 1 2 2v1h1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1V4a2 2 0 0 1 2-2h8m-1 4H9v12h6V6m-5.5 2a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 1 0v-9a.5.5 0 0 0-.5-.5m3 0a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 1 0v-9a.5.5 0 0 0-.5-.5"
    },
    Cancer: {
        id: 'Cancer', name: 'Cancer', symbol: '\u264B', element: 'Water', quality: 'Cardinal', ruler: 'Moon', color: '#0A84FF', dates: 'Jun 21 - Jul 22',
        path: "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m-3 4a4 4 0 0 0-4 4 4 4 0 0 0 6.64 3A4 4 0 1 0 9 6m6 12a4 4 0 0 0 4-4 4 4 0 0 0-6.64-3 4 4 0 1 0 2.64 7"
    },
    Leo: {
        id: 'Leo', name: 'Leo', symbol: '\u264C', element: 'Fire', quality: 'Fixed', ruler: 'Sun', color: '#FF9F0A', dates: 'Jul 23 - Aug 22',
        path: "M12 2c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4m0 10c3.3 0 6 2.7 6 6v2H6v-2c0-3.3 2.7-6 6-6"
    },
    Virgo: {
        id: 'Virgo', name: 'Virgo', symbol: '\u264D', element: 'Earth', quality: 'Mutable', ruler: 'Mercury', color: '#32D74B', dates: 'Aug 23 - Sep 22',
        path: "M5 4v2h2v4a2 2 0 0 1 2 2v6h2v-6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v6h2v-6c0-2.2-1.8-4-4-4h-1a4 4 0 0 0-4 4V6H7V4H5m11 12a3 3 0 0 1-3 3 3 3 0 0 1-3-3v-1H8v1a5 5 0 0 0 5 5 5 5 0 0 0 5-5v-4h-2v4"
    },
    Libra: {
        id: 'Libra', name: 'Libra', symbol: '\u264E', element: 'Air', quality: 'Cardinal', ruler: 'Venus', color: '#FF375F', dates: 'Sep 23 - Oct 22',
        path: "M12 3a4 4 0 0 1 4 4h-2a2 2 0 0 0-4 0H8a4 4 0 0 1 4-4m-7 8v2h14v-2H5m0 5v2h14v-2H5"
    },
    Scorpio: {
        id: 'Scorpio', name: 'Scorpio', symbol: '\u264F', element: 'Water', quality: 'Fixed', ruler: 'Pluto', color: '#BF5AF2', dates: 'Oct 23 - Nov 21',
        path: "M17 4c2.2 0 4 1.8 4 4v2h2v2h-2v6l1 1 1-1v2l-2 2-2-2v-2l1-1 1 1V8a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v6h-2V8a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v6h-2V8a4 4 0 0 1 4-4h1a4 4 0 0 1 4 4h1a4 4 0 0 1 4-4h1"
    },
    Sagittarius: {
        id: 'Sagittarius', name: 'Sagittarius', symbol: '\u2650', element: 'Fire', quality: 'Mutable', ruler: 'Jupiter', color: '#5E5CE6', dates: 'Nov 22 - Dec 21',
        path: "M18.5 2l-3 3 1.5 1.5-3.3 3.3A8.9 8.9 0 0 0 4.2 21 8.9 8.9 0 0 0 14 16.3l3.3-3.3 1.5 1.5 3-3L18.5 2M6 19a7 7 0 0 1 6.8-5.3l-5.3 5.3H6"
    },
    Capricorn: {
        id: 'Capricorn', name: 'Capricorn', symbol: '\u2651', element: 'Earth', quality: 'Cardinal', ruler: 'Saturn', color: '#AC8E68', dates: 'Dec 22 - Jan 19',
        path: "M17.5 3c-2.3 0-3.9 1.4-4.5 2.5-.6-1.1-2.2-2.5-4.5-2.5C5.8 3 3 5.6 3 9.5c0 3.3 1.6 6 5.5 6 1.5 0 2.9-.6 3.5-1.5.6.9 2 1.5 3.5 1.5h1v4.3c0 .9-.8 1.7-1.7 1.7-.6 0-1.1-.3-1.4-.7l-1.3 1.4c.7.9 1.7 1.3 2.7 1.3 2.2 0 3.7-1.8 3.7-3.7v-7c2 0 3.5-1.5 3.5-3.5S20.3 3 17.5 3m-9 10.5c-2.3 0-3.5-2-3.5-4 0-1.5.8-3.5 3.5-3.5 2.3 0 3.5 2 3.5 3.5 0 2-1.2 4-3.5 4m9-1c-1.3 0-2.3-.9-2.3-2 0-1.6 1.4-2.5 2.3-2.5s2.3.9 2.3 2.5c0 1.1-1 2-2.3 2"
    },
    Aquarius: {
        id: 'Aquarius', name: 'Aquarius', symbol: '\u2652', element: 'Air', quality: 'Fixed', ruler: 'Uranus', color: '#64D2FF', dates: 'Jan 20 - Feb 18',
        path: "M2 13.5l2.5-2.5 3 3 3-3 3 3 3-3 4.5 4.5-1.5 1.5-3-3-3 3-3-3-3 3L2 13.5m0-6 2.5-2.5 3 3 3-3 3 3 3-3 4.5 4.5-1.5 1.5-3-3-3 3-3-3-3 3L2 7.5"
    },
    Pisces: {
        id: 'Pisces', name: 'Pisces', symbol: '\u2653', element: 'Water', quality: 'Mutable', ruler: 'Neptune', color: '#40C8E0', dates: 'Feb 19 - Mar 20',
        path: "M12 2a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9m-7 9a7 7 0 0 1 5.3-6.8v13.6A7 7 0 0 1 5 11m7 7V4a7 7 0 0 1 0 14"
    }
};

// ── Real astrological compatibility matrix (12x12) ────────────────────────────
// Based on traditional astrology: element harmony, aspect angles, ruler synergy
// Scores: 0-100 for each of 4 dimensions

interface DetailedCompatibility {
    general: number;
    romantic: number;
    communication: number;
    emotional: number;
}

// Aspect-based scoring:
// Conjunction (same sign): 75-80 — intense, can be too much alike
// Sextile (2 apart): 80-88 — easy flow, natural support
// Trine (4 apart): 88-95 — effortless harmony, same element
// Square (3 apart): 40-55 — tension and growth
// Opposition (6 apart): 65-78 — magnetic attraction, balancing act
// Semi-sextile (1 apart): 50-65 — different worlds, mild friction
// Quincunx (5 apart): 45-58 — adjustment needed, no common ground

const PAIR_SCORES: Record<string, DetailedCompatibility> = {
    // Aries combinations
    'Aries-Aries':       { general: 76, romantic: 82, communication: 72, emotional: 68 },
    'Aries-Taurus':      { general: 55, romantic: 60, communication: 48, emotional: 52 },
    'Aries-Gemini':      { general: 83, romantic: 78, communication: 90, emotional: 72 },
    'Aries-Cancer':      { general: 47, romantic: 55, communication: 42, emotional: 50 },
    'Aries-Leo':         { general: 93, romantic: 95, communication: 88, emotional: 85 },
    'Aries-Virgo':       { general: 48, romantic: 45, communication: 52, emotional: 40 },
    'Aries-Libra':       { general: 72, romantic: 82, communication: 68, emotional: 65 },
    'Aries-Scorpio':     { general: 50, romantic: 72, communication: 45, emotional: 55 },
    'Aries-Sagittarius': { general: 93, romantic: 90, communication: 92, emotional: 88 },
    'Aries-Capricorn':   { general: 47, romantic: 50, communication: 45, emotional: 42 },
    'Aries-Aquarius':    { general: 85, romantic: 80, communication: 88, emotional: 75 },
    'Aries-Pisces':      { general: 52, romantic: 58, communication: 45, emotional: 62 },

    // Taurus combinations
    'Taurus-Taurus':      { general: 78, romantic: 85, communication: 72, emotional: 80 },
    'Taurus-Gemini':      { general: 52, romantic: 48, communication: 55, emotional: 45 },
    'Taurus-Cancer':      { general: 88, romantic: 92, communication: 82, emotional: 90 },
    'Taurus-Leo':         { general: 48, romantic: 55, communication: 45, emotional: 50 },
    'Taurus-Virgo':       { general: 90, romantic: 88, communication: 85, emotional: 88 },
    'Taurus-Libra':       { general: 58, romantic: 65, communication: 55, emotional: 52 },
    'Taurus-Scorpio':     { general: 75, romantic: 88, communication: 62, emotional: 72 },
    'Taurus-Sagittarius': { general: 45, romantic: 48, communication: 42, emotional: 40 },
    'Taurus-Capricorn':   { general: 92, romantic: 90, communication: 88, emotional: 90 },
    'Taurus-Aquarius':    { general: 42, romantic: 45, communication: 48, emotional: 38 },
    'Taurus-Pisces':      { general: 85, romantic: 88, communication: 78, emotional: 90 },

    // Gemini combinations
    'Gemini-Gemini':       { general: 78, romantic: 72, communication: 92, emotional: 62 },
    'Gemini-Cancer':       { general: 52, romantic: 55, communication: 50, emotional: 58 },
    'Gemini-Leo':          { general: 82, romantic: 80, communication: 88, emotional: 72 },
    'Gemini-Virgo':        { general: 50, romantic: 48, communication: 62, emotional: 42 },
    'Gemini-Libra':        { general: 90, romantic: 85, communication: 95, emotional: 78 },
    'Gemini-Scorpio':      { general: 45, romantic: 52, communication: 40, emotional: 48 },
    'Gemini-Sagittarius':  { general: 72, romantic: 78, communication: 75, emotional: 65 },
    'Gemini-Capricorn':    { general: 48, romantic: 42, communication: 52, emotional: 40 },
    'Gemini-Aquarius':     { general: 92, romantic: 85, communication: 95, emotional: 80 },
    'Gemini-Pisces':       { general: 50, romantic: 55, communication: 48, emotional: 58 },

    // Cancer combinations
    'Cancer-Cancer':       { general: 80, romantic: 88, communication: 72, emotional: 92 },
    'Cancer-Leo':          { general: 55, romantic: 62, communication: 50, emotional: 58 },
    'Cancer-Virgo':        { general: 82, romantic: 80, communication: 78, emotional: 85 },
    'Cancer-Libra':        { general: 48, romantic: 52, communication: 50, emotional: 45 },
    'Cancer-Scorpio':      { general: 92, romantic: 95, communication: 85, emotional: 95 },
    'Cancer-Sagittarius':  { general: 42, romantic: 48, communication: 40, emotional: 45 },
    'Cancer-Capricorn':    { general: 72, romantic: 78, communication: 65, emotional: 75 },
    'Cancer-Aquarius':     { general: 45, romantic: 42, communication: 48, emotional: 40 },
    'Cancer-Pisces':       { general: 93, romantic: 95, communication: 85, emotional: 95 },

    // Leo combinations
    'Leo-Leo':            { general: 78, romantic: 85, communication: 75, emotional: 72 },
    'Leo-Virgo':          { general: 52, romantic: 48, communication: 55, emotional: 45 },
    'Leo-Libra':          { general: 82, romantic: 85, communication: 80, emotional: 75 },
    'Leo-Scorpio':        { general: 50, romantic: 62, communication: 45, emotional: 52 },
    'Leo-Sagittarius':    { general: 92, romantic: 90, communication: 88, emotional: 85 },
    'Leo-Capricorn':      { general: 48, romantic: 50, communication: 45, emotional: 42 },
    'Leo-Aquarius':       { general: 70, romantic: 75, communication: 68, emotional: 62 },
    'Leo-Pisces':         { general: 52, romantic: 58, communication: 48, emotional: 55 },

    // Virgo combinations
    'Virgo-Virgo':        { general: 78, romantic: 72, communication: 82, emotional: 75 },
    'Virgo-Libra':        { general: 55, romantic: 52, communication: 58, emotional: 48 },
    'Virgo-Scorpio':      { general: 82, romantic: 80, communication: 78, emotional: 82 },
    'Virgo-Sagittarius':  { general: 48, romantic: 45, communication: 52, emotional: 42 },
    'Virgo-Capricorn':    { general: 92, romantic: 88, communication: 90, emotional: 88 },
    'Virgo-Aquarius':     { general: 45, romantic: 42, communication: 52, emotional: 38 },
    'Virgo-Pisces':       { general: 68, romantic: 72, communication: 60, emotional: 72 },

    // Libra combinations
    'Libra-Libra':        { general: 78, romantic: 82, communication: 85, emotional: 70 },
    'Libra-Scorpio':      { general: 62, romantic: 72, communication: 55, emotional: 58 },
    'Libra-Sagittarius':  { general: 82, romantic: 80, communication: 85, emotional: 72 },
    'Libra-Capricorn':    { general: 48, romantic: 50, communication: 52, emotional: 42 },
    'Libra-Aquarius':     { general: 90, romantic: 85, communication: 92, emotional: 78 },
    'Libra-Pisces':       { general: 50, romantic: 55, communication: 48, emotional: 55 },

    // Scorpio combinations
    'Scorpio-Scorpio':     { general: 80, romantic: 92, communication: 70, emotional: 88 },
    'Scorpio-Sagittarius': { general: 52, romantic: 58, communication: 48, emotional: 50 },
    'Scorpio-Capricorn':   { general: 82, romantic: 85, communication: 78, emotional: 82 },
    'Scorpio-Aquarius':    { general: 48, romantic: 52, communication: 45, emotional: 42 },
    'Scorpio-Pisces':      { general: 92, romantic: 95, communication: 82, emotional: 95 },

    // Sagittarius combinations
    'Sagittarius-Sagittarius': { general: 80, romantic: 82, communication: 85, emotional: 72 },
    'Sagittarius-Capricorn':   { general: 52, romantic: 48, communication: 50, emotional: 45 },
    'Sagittarius-Aquarius':    { general: 85, romantic: 80, communication: 88, emotional: 75 },
    'Sagittarius-Pisces':      { general: 48, romantic: 55, communication: 45, emotional: 52 },

    // Capricorn combinations
    'Capricorn-Capricorn':  { general: 78, romantic: 75, communication: 80, emotional: 72 },
    'Capricorn-Aquarius':   { general: 55, romantic: 50, communication: 58, emotional: 48 },
    'Capricorn-Pisces':     { general: 82, romantic: 80, communication: 75, emotional: 82 },

    // Aquarius combinations
    'Aquarius-Aquarius':   { general: 78, romantic: 72, communication: 88, emotional: 65 },
    'Aquarius-Pisces':     { general: 52, romantic: 55, communication: 48, emotional: 58 },

    // Pisces
    'Pisces-Pisces':       { general: 82, romantic: 88, communication: 72, emotional: 92 },
};

function getPairKey(s1: ZodiacSignName, s2: ZodiacSignName): string {
    const signs = Object.keys(ZODIAC_SIGNS);
    const i1 = signs.indexOf(s1);
    const i2 = signs.indexOf(s2);
    return i1 <= i2 ? `${s1}-${s2}` : `${s2}-${s1}`;
}

// ── Archetype data for descriptions ──────────────────────────────────────────

interface SignPersonality {
    archetype: string;
    strengths: string[];
    loveStyle: string;
}

const SIGN_PERSONALITY: Record<ZodiacSignName, SignPersonality> = {
    Aries:       { archetype: 'The Warrior', strengths: ['courage', 'passion', 'independence'], loveStyle: 'bold and direct, loves the chase' },
    Taurus:      { archetype: 'The Builder', strengths: ['loyalty', 'patience', 'sensuality'], loveStyle: 'steady and devoted, values physical comfort' },
    Gemini:      { archetype: 'The Messenger', strengths: ['wit', 'adaptability', 'curiosity'], loveStyle: 'intellectually stimulating, needs variety' },
    Cancer:      { archetype: 'The Nurturer', strengths: ['empathy', 'intuition', 'protectiveness'], loveStyle: 'deeply caring, creates emotional sanctuary' },
    Leo:         { archetype: 'The Sovereign', strengths: ['generosity', 'warmth', 'leadership'], loveStyle: 'grand romantic gestures, needs admiration' },
    Virgo:       { archetype: 'The Healer', strengths: ['precision', 'service', 'analysis'], loveStyle: 'shows love through acts of service' },
    Libra:       { archetype: 'The Diplomat', strengths: ['harmony', 'charm', 'fairness'], loveStyle: 'romantic and refined, seeks balance' },
    Scorpio:     { archetype: 'The Alchemist', strengths: ['intensity', 'depth', 'transformation'], loveStyle: 'all-or-nothing devotion, deeply passionate' },
    Sagittarius: { archetype: 'The Explorer', strengths: ['optimism', 'honesty', 'adventure'], loveStyle: 'freedom-loving, seeks a fellow adventurer' },
    Capricorn:   { archetype: 'The Strategist', strengths: ['discipline', 'ambition', 'reliability'], loveStyle: 'traditional and committed, builds for the future' },
    Aquarius:    { archetype: 'The Visionary', strengths: ['originality', 'humanitarianism', 'intellect'], loveStyle: 'unconventional, values friendship in love' },
    Pisces:      { archetype: 'The Mystic', strengths: ['compassion', 'imagination', 'spiritual depth'], loveStyle: 'fairy-tale romance, deeply intuitive partner' },
};

function getAspect(s1: ZodiacSignName, s2: ZodiacSignName): string {
    const signs = Object.keys(ZODIAC_SIGNS);
    const diff = Math.abs(signs.indexOf(s1) - signs.indexOf(s2));
    const distance = Math.min(diff, 12 - diff);
    switch (distance) {
        case 0: return 'conjunction';
        case 1: return 'semi-sextile';
        case 2: return 'sextile';
        case 3: return 'square';
        case 4: return 'trine';
        case 5: return 'quincunx';
        case 6: return 'opposition';
        default: return 'unknown';
    }
}

function generateDescription(s1: ZodiacSignData, s2: ZodiacSignData, scores: DetailedCompatibility): { title: string; description: string; challenge: string } {
    const p1 = SIGN_PERSONALITY[s1.id];
    const p2 = SIGN_PERSONALITY[s2.id];
    const aspect = getAspect(s1.id, s2.id);
    const avg = (scores.general + scores.romantic + scores.communication + scores.emotional) / 4;

    const title = `${p1.archetype} & ${p2.archetype}`;

    let dynamicDesc: string;
    if (avg >= 85) {
        dynamicDesc = `${s1.name} and ${s2.name} share an extraordinary cosmic bond. Their energies naturally complement each other, creating a relationship that feels destined. ${s1.name}'s ${p1.strengths[0]} pairs beautifully with ${s2.name}'s ${p2.strengths[0]}, forming a powerful alliance.`;
    } else if (avg >= 70) {
        dynamicDesc = `${s1.name} and ${s2.name} have a strong natural connection. While they approach life differently, their differences often create attraction. ${s1.name} brings ${p1.strengths[1]} to the partnership, while ${s2.name} offers ${p2.strengths[1]}.`;
    } else if (avg >= 55) {
        dynamicDesc = `${s1.name} and ${s2.name} can build something meaningful, but it requires effort. Their ${aspect} aspect creates both tension and growth. ${s1.name}'s ${p1.loveStyle.split(',')[0]} meets ${s2.name}'s ${p2.loveStyle.split(',')[0]}, which can be either exciting or frustrating.`;
    } else {
        dynamicDesc = `${s1.name} and ${s2.name} face significant challenges due to their fundamentally different natures. However, astrology teaches that difficult aspects often produce the deepest growth. Their ${aspect} aspect demands patience, compromise, and genuine willingness to understand each other.`;
    }

    const elementPair = [s1.element, s2.element].sort().join('-');
    let challenge: string;
    switch (elementPair) {
        case 'Air-Fire':
            challenge = 'Keeping the flame alive without burning out. Fire needs Air\'s ideas, but Air must not fan the flames too wildly.';
            break;
        case 'Earth-Water':
            challenge = 'Avoiding emotional stagnation. Water nourishes Earth, but too much can create mud. Keep things flowing.';
            break;
        case 'Fire-Water':
            challenge = 'Balancing passion with sensitivity. Fire can evaporate Water\'s emotions, while Water can extinguish Fire\'s enthusiasm.';
            break;
        case 'Air-Earth':
            challenge = 'Bridging the gap between ideas and reality. Air thinks, Earth does. Finding common ground requires patience.';
            break;
        case 'Fire-Fire':
            challenge = 'Managing two egos and competitive spirits. The passion is incredible, but so are the arguments.';
            break;
        case 'Water-Water':
            challenge = 'Not drowning in emotions together. You both feel deeply, but someone needs to be the anchor.';
            break;
        case 'Air-Air':
            challenge = 'Grounding your relationship in reality. Great conversations, but who handles the practical side?';
            break;
        case 'Earth-Earth':
            challenge = 'Keeping spontaneity alive. You build well together but may fall into routine and rigidity.';
            break;
        default:
            challenge = 'Understanding and respecting your fundamental differences.';
    }

    if (s1.id === s2.id) {
        challenge = 'Being with your mirror means seeing your own flaws reflected back. Growth comes from accepting these without projection.';
    }

    return { title, description: dynamicDesc, challenge };
}

function getKeywords(s1: ZodiacSignData, s2: ZodiacSignData, scores: DetailedCompatibility): string[] {
    const keywords: string[] = [];
    const avg = (scores.general + scores.romantic + scores.communication + scores.emotional) / 4;
    const aspect = getAspect(s1.id, s2.id);

    if (s1.element === s2.element) keywords.push('Kindred Spirits');
    if (aspect === 'opposition') keywords.push('Magnetic Attraction');
    if (aspect === 'trine') keywords.push('Natural Harmony');
    if (aspect === 'square') keywords.push('Growth Through Tension');
    if (aspect === 'sextile') keywords.push('Easy Flow');
    if (aspect === 'conjunction') keywords.push('Mirror Souls');
    if (scores.romantic >= 85) keywords.push('Passionate Bond');
    if (scores.emotional >= 85) keywords.push('Deep Connection');
    if (scores.communication >= 85) keywords.push('Mind Meld');
    if (avg < 55) keywords.push('Challenging');
    if (avg >= 85) keywords.push('Soulmate Potential');

    return keywords.slice(0, 4);
}

export const getCompatibility = (sign1: ZodiacSignName, sign2: ZodiacSignName, gender1: Gender = 'Female', gender2: Gender = 'Male'): CompatibilityResult => {
    const s1 = ZODIAC_SIGNS[sign1];
    const s2 = ZODIAC_SIGNS[sign2];
    const key = getPairKey(sign1, sign2);
    const scores = PAIR_SCORES[key] ?? { general: 50, romantic: 50, communication: 50, emotional: 50 };

    const { title, description, challenge } = generateDescription(s1, s2, scores);
    const keywords = getKeywords(s1, s2, scores);

    return {
        score: scores.general,
        title,
        description,
        keywords,
        loveScore: scores.romantic,
        communicationScore: scores.communication,
        emotionalScore: scores.emotional,
        challenge,
    };
};
