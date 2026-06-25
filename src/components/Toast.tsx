// Global Toast Component — slide-down banner with auto-dismiss
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TickCircleIcon, XIcon } from '../components/icons';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  subtitle?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, subtitle?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const TOAST_DURATION = 5000;

const TOAST_CONFIG: Record<ToastType, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { bg: '#1B5E20', icon: 'checkmark-circle' },
  error: { bg: '#B71C1C', icon: 'close-circle' },
  info: { bg: '#0D47A1', icon: 'information-circle' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [translateY]);

  const showToast = useCallback(
    (type: ToastType, message: string, subtitle?: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      const id = ++idRef.current;
      setToast({ id, type, message, subtitle });

      // Reset position and animate in
      translateY.setValue(-120);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      timerRef.current = setTimeout(dismiss, TOAST_DURATION);
    },
    [translateY, dismiss],
  );

  const config = toast ? TOAST_CONFIG[toast.type] : TOAST_CONFIG.info;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            { paddingTop: insets.top + 8, transform: [{ translateY }] },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={dismiss}
            style={[styles.toast, { backgroundColor: config.bg }]}
          >
            {toast.type === 'success' ? (
              <TickCircleIcon size={22} color="#FFFFFF" />
            ) : (
              <Ionicons name={config.icon} size={22} color="#FFFFFF" />
            )}
            <View style={styles.textContainer}>
              <Text style={styles.message} numberOfLines={2}>
                {toast.message}
              </Text>
              {toast.subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {toast.subtitle}
                </Text>
              ) : null}
            </View>
            <XIcon size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width - 32,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
});
