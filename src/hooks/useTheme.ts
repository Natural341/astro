// Theme Hook
import { useStore } from '../store/useStore';
import { Colors, ThemeMode } from '../config/theme';

export const useTheme = () => {
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);

  const colors = theme === 'dark' ? Colors.dark : Colors.light;
  const isDark = theme === 'dark';

  // Canonical derived UI palette — the values that screens used to redeclare
  // locally (cardBg/textColor/subTextColor/...). Use this instead of copy-pasting
  // `const cardBg = isDark ? ... : ...` blocks into every screen.
  const ui = {
    cardBg: isDark ? '#1A1A2E' : '#FFFFFF',
    textColor: isDark ? '#FFFFFF' : '#1C1C1E',
    subTextColor: isDark ? 'rgba(255,255,255,0.54)' : 'rgba(0,0,0,0.54)',
    borderColor: isDark ? '#2F2F40' : '#E5E5EA',
    inputBg: isDark ? '#252535' : '#F2F2F7',
    primaryColor: Colors.accent.purple,
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme,
    colors,
    ui,
    isDark,
    setTheme,
    toggleTheme,
    accent: Colors.accent,
  };
};
