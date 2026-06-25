// Translation Hook
import { useStore } from '../store/useStore';
import { translations, TranslationKey, Language } from '../localization/translations';

export const useTranslation = () => {
  const language = useStore((state) => state.language) as Language;

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.tr[key] || key;
  };

  return { t, language };
};
