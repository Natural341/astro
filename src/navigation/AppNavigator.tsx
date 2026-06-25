// App Navigator - Updated with Onboarding Flow
import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Dimensions, Platform } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TabNavigator } from './TabNavigator';
import { AstrologerTabNavigator } from './AstrologerTabNavigator';
import { AuthScreen } from '../screens/AuthScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { LanguageSelectionScreen } from '../screens/LanguageSelectionScreen';
import { IntroScreen } from '../screens/IntroScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { DreamInterpretationScreen } from '../screens/DreamInterpretationScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { NumerologyScreen } from '../screens/NumerologyScreen';
import { CoffeeFortuneScreen } from '../screens/CoffeeFortuneScreen';
import { PalmReadingScreen } from '../screens/PalmReadingScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { BirthChartScreen } from '../screens/BirthChartScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SynastryScreen } from '../screens/SynastryScreen';
import { RisingSignScreen } from '../screens/RisingSignScreen';
import { TarotScreen } from '../screens/TarotScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { AstrologersScreen } from '../screens/AstrologersScreen';
import { AstrologerChatScreen } from '../screens/AstrologerChatScreen';
import { VedicChartScreen } from '../screens/VedicChartScreen';
import { FaceReadingScreen } from '../screens/FaceReadingScreen';
import { PlanetHoursScreen } from '../screens/PlanetHoursScreen';
import { DrawSoulmateScreen } from '../screens/DrawSoulmateScreen';
import { FindSoulmateScreen } from '../screens/FindSoulmateScreen';
import { BecomeConsultantScreen } from '../screens/BecomeConsultantScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { AIChatScreen } from '../screens/AIChatScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { AstrologerProfileScreen } from '../screens/AstrologerProfileScreen';
import { AstrologerChatReplyScreen } from '../screens/AstrologerChatReplyScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { PeopleScreen } from '../screens/PeopleScreen';
import { DirectChatScreen } from '../screens/DirectChatScreen';
import { MemberProfileScreen } from '../screens/MemberProfileScreen';
import { LegalScreen } from '../screens/LegalScreen';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { Colors } from '../config/theme';
import { registerForPushNotificationsAsync, notificationDataToRoute } from '../services/notifications';
import { registerPushToken } from '../services/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const DarkBgWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDark, colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isDark && (
        <Image
          source={require('../../assets/images/bbg.png')}
          style={{ position: 'absolute', top: 0, left: 0, width: SCREEN_W, height: SCREEN_H * 1.2 }}
          resizeMode="cover"
        />
      )}
      {children}
    </View>
  );
};

const Stack = createNativeStackNavigator();

export const navigationRef = createNavigationContainerRef();

const linking = {
  prefixes: [Linking.createURL('/'), 'kosmosastro://'],
  config: {
    screens: {
      Main: 'main',
      Notifications: 'notifications',
      Messages: 'messages',
      AstrologerChat: 'astrologer-chat/:astrologerId',
      Premium: 'premium',
      AIChat: 'ai-chat',
    },
  },
};

// Navigate from a notification's data payload. On cold start the container may not
// be ready yet, so retry once shortly after.
const goToNotificationRoute = (data: any) => {
  const route = notificationDataToRoute(data);
  if (!route) return;
  const nav = (): boolean => {
    if (navigationRef.isReady()) {
      (navigationRef.navigate as any)(route.screen, route.params);
      return true;
    }
    return false;
  };
  if (!nav()) setTimeout(nav, 800);
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, loadPersistedState, user } = useStore();
  const { isDark } = useTheme();
  const isAstrologer = user?.role === 'astrologer';
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      // Check if user has seen onboarding
      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboarding(seen === 'true');

      // Load persisted state
      await loadPersistedState();
    };
    init();
  }, []);

  // Remote push: register this device's token once the user is authenticated.
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) await registerPushToken(token, Platform.OS);
    })();
  }, [isAuthenticated]);

  // Handle notification taps — cold start (app launched from a push) and while running.
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((resp) => {
      if (resp) goToNotificationRoute(resp.notification.request.content.data);
    });
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      goToNotificationRoute(resp.notification.request.content.data);
    });
    return () => sub.remove();
  }, []);

  // Show loading while checking onboarding status
  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#0F0F1A' : '#FFFFFF' }]}>
        <ActivityIndicator size="large" color={Colors.accent.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
        screenLayout={({ children }) => (
          <DarkBgWrapper>{children}</DarkBgWrapper>
        )}
        initialRouteName={hasSeenOnboarding ? (isAuthenticated ? 'Main' : 'Auth') : 'Splash'}
      >
        {/* Onboarding / Auth — always available */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {isAuthenticated ? (
          <>
            {/* Main App — role-based tab navigator */}
            <Stack.Screen name="Main" component={isAstrologer ? AstrologerTabNavigator : TabNavigator} />

            {/* Feature Screens */}
            <Stack.Screen name="DreamInterpretation" component={DreamInterpretationScreen} />
            <Stack.Screen name="Premium" component={PremiumScreen} />
            <Stack.Screen name="Numerology" component={NumerologyScreen} />
            <Stack.Screen name="CoffeeFortune" component={CoffeeFortuneScreen} />
            <Stack.Screen name="PalmReading" component={PalmReadingScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="BirthChart" component={BirthChartScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Synastry" component={SynastryScreen} />
            <Stack.Screen name="RisingSign" component={RisingSignScreen} />
            <Stack.Screen name="Tarot" component={TarotScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Astrologers" component={AstrologersScreen} />
            <Stack.Screen name="AstrologerChat" component={AstrologerChatScreen} />
            <Stack.Screen name="VedicChart" component={VedicChartScreen} />
            <Stack.Screen name="FaceReading" component={FaceReadingScreen} />
            <Stack.Screen name="PlanetHours" component={PlanetHoursScreen} />
            <Stack.Screen name="DrawSoulmate" component={DrawSoulmateScreen} />
            <Stack.Screen name="FindSoulmate" component={FindSoulmateScreen} />
            <Stack.Screen name="BecomeConsultant" component={BecomeConsultantScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="AIChat" component={AIChatScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="AstrologerProfile" component={AstrologerProfileScreen} />
            <Stack.Screen name="AstrologerChatReply" component={AstrologerChatReplyScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="People" component={PeopleScreen} />
            <Stack.Screen name="DirectChat" component={DirectChatScreen} />
            <Stack.Screen name="MemberProfile" component={MemberProfileScreen} />
            <Stack.Screen name="Legal" component={LegalScreen} />
          </>
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
