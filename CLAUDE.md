# CLAUDE.md — Kosmos Astro Expo

## Proje Özeti
React Native + Expo astroloji uygulaması. Türk kullanıcı pazarı, İngilizce UI.

## Kritik Kurallar

### Backend
- **Supabase KULLANILMIYOR** — tüm Supabase import'ları legacy/broken. Silip Zustand ile değiştir.
- **Gerçek backend:** Go + Redis + PostgreSQL + Docker (henüz frontend'e bağlı değil)
- **Şu an tüm veri:** AsyncStorage (cihaz yerel) + Zustand store (RAM)
- **Go backend hazır olduğunda** API endpoint'leri `src/services/api.ts` üzerinden eklenecek

### State Management
- **Zustand** (`src/store/useStore.ts`) — tek kaynak of truth
- `updateUser(partial)` → her zaman `persistState()` çağrılıyor
- `setStreak(data)` → her zaman `persistState()` çağrılıyor
- **Streak tutarsızlığı:** `streakService.ts` (singleton) ve `useStore.streak` iki ayrı kayıt; ileride `streakService` kaldırılacak

### Tasarım Felsefesi
- **Mat (matte), modern, koyu tema öncelikli**
- Tab bar: etiket yok, sadece ikon + aktif nokta
- Emoji: **asla** — buton metinlerinde emoji kullanma
- Dil: **İngilizce** (bazı eski ekranlarda Türkçe kalmış, modernize ederken İngilizce'ye çevir)
- `useTheme()` hook'u her zaman kullan — sabit renk yazma

### Dev Mode
```tsx
initialRouteName={__DEV__ ? 'Main' : hasSeenOnboarding ? ...}
```
Geliştirme sırasında onboarding atlanıyor.

### Animasyonlar
- `react-native-reanimated` **TabNavigator'da KULLANMA** → "Exception in HostFunction" hatası
- Bunun yerine React Native built-in `Animated` API kullan
- `Easing` import'u: `from 'react-native'`

### Input / Keyboard
- Alt input barlar: `useSafeAreaInsets` ile `paddingBottom` ayarla
- `KeyboardAvoidingView behavior='height'` (Android için)

### Profil Fotosu Fallback Zinciri
`profileImageUrl` → nickname'in ilk harfi (renkli daire) → 'G' fallback

## Tab Bar Yapısı (5 slot)
```
Home | Explore(→Astrologers) | [AI center raised] | Messages | Profile
```
- Explore: `tabPress e.preventDefault()` + `navigate('Astrologers')`
- AI: `tabPress e.preventDefault()` + `navigate('AIChat')`

## Token Ekonomisi (Ay Taşı)
| Paket | Token | Fiyat | Kazanım |
|-------|-------|-------|---------|
| Starter | 100 | 9.99₺ | — |
| Regular | 350 | 24.99₺ | %29 |
| **Popular** | **750** | **44.99₺** | **%40** |
| Value | 2000 | 99.99₺ | %50 |

**Feature maliyetleri:**
- AI chat: 10 token
- Rüya yorumu: 15 token
- Tarot: 20 token
- Kahve falı: 25 token
- Doğum haritası: 40 token
- Synastry: 50 token

## AI Servisi
- `USE_LOCAL_LLM = true` → LM Studio (192.168.1.23:1234)
- Fallback: Gemini 1.5 Pro (`gemini-pro` model)
- Rate limit: 30 req/dakika, max 1024 token/istek
- `<think>` tag'leri temizleniyor (DeepSeek için)

## Premium Abonelik
- Yıllık: 399.99₺/yıl (7 günlük ücretsiz deneme)
- Aylık: 49.99₺/ay
- Premium kullanıcılar: Sınırsız token + günlük 50 token

## Önemli Dosyalar
```
src/
  navigation/
    AppNavigator.tsx    ← 36 ekran, __DEV__ skip
    TabNavigator.tsx    ← 5 tab, custom center button
  screens/
    HomeScreen.tsx      ← Advisor kartları Messages style
    ProfileScreen.tsx   ← Matte premium button, zodiac info, guest banner
    PremiumScreen.tsx   ← Animated start.png, token packages
    DreamInterpretationScreen.tsx
    NumerologyScreen.tsx ← Inline date picker (nested component OLMAZ)
    AstrologerChatScreen.tsx ← + button, camera/gallery/voice
    MessagesScreen.tsx  ← 7 mock conversation
    PlanetHoursScreen.tsx ← Zodiac personalization, expo-notifications
    CoffeeFortuneScreen.tsx ← 4-step photo flow
  store/
    useStore.ts         ← Zustand + AsyncStorage persistence
  services/
    geminiService.ts    ← AI (Local LLM + Gemini fallback)
    supabase.ts         ← LEGACY - kullanılmıyor
  assets/images/
    start.png           ← Kosmos AI logo (tab center + Premium hero)
    start1.png          ← Dream/System avatar
    real_elara.jpg      ← Elara (id:1)
    real_aamon.jpg      ← Aamon (id:2)
    real_orion.jpg      ← Orion (id:3)
    real_lyra.jpg       ← Lyra (id:4)
    real_seraphina.jpg  ← Seraphina (id:5)
```

## Gelecek: Go Backend Entegrasyonu
Backend hazır olunca bu endpoint'ler eklenecek:
- `POST /auth/register` → setUser()
- `POST /auth/login` → setUser()
- `GET /users/:id` → updateUser()
- `PUT /users/:id/streak` → setStreak()
- `POST /readings` → reading kaydet
- `GET /users/:id/tokens` → token bakiyesi
