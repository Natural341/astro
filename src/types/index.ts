// Type Definitions

export interface User {
  id: string;
  authId: string;
  nickname: string;
  name?: string;
  email: string;
  profileImageUrl?: string;
  languageCode: string;
  tokens: number;
  isPremium: boolean;
  onboardingCompleted: boolean;
  birthDate?: string;
  birthTime?: string;
  birthCity?: string;
  zodiacSign?: string;
  bio?: string;
  role?: 'user' | 'admin' | 'astrologer';
  createdAt: string;
  updatedAt: string;
}

export interface Astrologer {
  id: string;
  name: string;
  title: string;
  bio: string;
  specialization: string[];
  rating: number;
  reviewCount: number;
  price: number;
  isOnline: boolean;
  imageUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastClaimDate: string | null;
  totalTokensEarned: number;
}

export interface TarotCard {
  id: number;
  name: string;
  nameEn: string;
  arcana: 'major' | 'minor';
  suit?: string;
  number?: number;
  keywords: string[];
  meaningUpright: string;
  meaningReversed: string;
  imageUrl: string;
}

export interface DailyHoroscope {
  sign: string;
  date: string;
  general: string;
  love: string;
  career: string;
  health: string;
  luckyNumber: number;
  luckyColor: string;
}

export interface BirthChart {
  sun: PlanetPosition;
  moon: PlanetPosition;
  mercury: PlanetPosition;
  venus: PlanetPosition;
  mars: PlanetPosition;
  jupiter: PlanetPosition;
  saturn: PlanetPosition;
  uranus: PlanetPosition;
  neptune: PlanetPosition;
  pluto: PlanetPosition;
  ascendant: string;
  houses: HousePosition[];
}

export interface PlanetPosition {
  sign: string;
  degree: number;
  house: number;
  retrograde: boolean;
}

export interface HousePosition {
  number: number;
  sign: string;
  degree: number;
}

export interface WitchQuestion {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  answerCount: number;
  viewCount: number;
}

export interface WitchAnswer {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  likesCount: number;
  createdAt: string;
  user?: {
    nickname: string;
    profileImageUrl?: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'streak' | 'message' | 'premium' | 'general';
  isRead: boolean;
  createdAt: string;
}

export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';
