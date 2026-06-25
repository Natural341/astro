// Translations registry — strings live in ./tr and ./en (kept apart to stay small).
import { tr } from './tr';
import { en } from './en';

export const translations = { tr, en };

export type TranslationKey = keyof typeof translations.tr;
export type Language = keyof typeof translations;

export const getTranslation = (language: Language, key: TranslationKey): string => {
  return translations[language]?.[key] || translations.tr[key] || key;
};
