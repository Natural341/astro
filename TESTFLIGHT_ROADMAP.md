# TestFlight Yol Haritası — Kosmos Astro Expo

> Amaç: Uygulamayı **TestFlight** (iOS internal/external test) aşamasına çıkarmak için kalan **tüm** işlerin tek listesi.
> Son güncelleme: 2026-06-25 · Durum: client-side ~%95 hazır.

Bu dosya `PROGRESS.md`'nin (Mart'ta donmuş) yerine güncel gerçeği yansıtır. Önceliklendirme: **P0 = TestFlight blocker**, **P1 = çıkmadan güçlü tavsiye**, **P2 = sonraki turlar**.

---

## 0. Bu oturumda tamamlananlar (2026-06-25)

- [x] Ağ IP'si `192.168.1.23`'e güncellendi (mobil `.env` + web-panel).
- [x] **Foto saptama kapıları** — yüz/el/kahve, on-device ML Kit, kabul-ağırlıklı (`src/services/imageDetection.ts`). Native rebuild bekliyor.
- [x] **Ruh Eşini Bul → Meeting Forecast** (`FindSoulmateScreen.tsx`) tamamen yeniden yazıldı; deterministik, gerçek uyum matrisi, koyu tema, emoji yok.
- [x] **Remote push** client tarafı — token alma + backend'e kayıt (`notifications.ts`, `api.ts`).
- [x] **Bildirim tap → ekran yönlendirme + deep linking** (`AppNavigator.tsx`, `scheme: kosmosastro`).
- [x] `app.json` — scheme + `expo-notifications` plugin.

---

## P0 — TestFlight Blocker'ları

### 1. Native rebuild (zorunlu)
Yeni native modüller eklendi; mevcut dev client yetmez.
- [ ] `eas build --profile development` (geliştirme cihaz testi için)
- [ ] Sonra TestFlight için `eas build --profile production --platform ios`
- Kapsam: `@react-native-ml-kit/face-detection`, `@react-native-ml-kit/image-labeling`, `expo-notifications` plugin, `scheme`.

### 2. EAS / Apple kurulumu
- [ ] **`app.json` → `extra.eas.projectId` şu an `"your-project-id"`** — gerçek EAS projectId yazılmalı (`eas init`). Bu olmadan **push token alınamaz** ve build düzgün olmaz.
- [ ] Apple Developer hesabı ($99/yıl) + App Store Connect'te uygulama kaydı (bundle id: `com.kosmosastro.app`).
- [ ] **APNs Push Key** (.p8) EAS'e yüklenmeli — iOS push için şart.
- [ ] `eas.json` `production` profili gözden geçir (autoIncrement var, iyi).
- [ ] Uygulama ikonu / splash / adaptive-icon assetleri kontrol (`assets/icon.png`, `splash-icon.png`, `adaptive-icon.png` mevcut mu).

### 3. Dil / i18n sorunları (kullanıcı tarafından bildirildi)

#### 3a. AI sohbet dili — **YÜKSEK ÖNCELİK**
**Sorun:** Kullanıcı Türkçe yazsa veya app dilini Türkçe seçse bile AI cevabı Türkçe olmuyor.
**Kök neden:** `src/services/geminiService.ts`
- `chatWithAI()` (satır 42) kullanıcının seçili dilini (`useStore.getState().language`, varsayılan `'tr'`) **hiç prompt'a koymuyor**.
- Local LLM sistem promptu `"You are a helpful assistant."` (satır 96) — dil talimatı yok.
- Gemini (`chatWithGemini`, satır 116) — sistem talimatı hiç yok.
- Astrolog persona promptları (`src/data/astrologers.ts`) İngilizce yazılmış.

**Çözüm (merkezi):**
- [ ] `geminiService.ts`'te dil direktifini her çağrıya enjekte et. Örn:
  ```ts
  import { useStore } from '../store/useStore';
  const langDirective = () => {
    const lang = useStore.getState().language;
    return lang === 'tr'
      ? 'IMPORTANT: Always respond ONLY in Turkish (Türkçe).'
      : 'IMPORTANT: Always respond in English.';
  };
  ```
  Bunu `chatWithAI`, `chatWithImage` (vision), voice ve persona promptlarının başına ekle (her üç backend: local/cloud/Gemini).
- [ ] Local LLM ve Gemini sistem mesajına da aynı direktifi koy.
- [ ] Astrolog persona promptlarına "respond in {language}" satırı ekle.
- [ ] Gerçek cihazda doğrula: TR seçiliyken Türkçe, EN seçiliyken İngilizce.

#### 3b. Premium ekranı çevrilmemiş stringler — **kullanıcı tarafından bildirildi**
`src/screens/PremiumScreen.tsx` çoğunlukla `t()` kullanıyor ama hardcoded İngilizce kaldı:
- [ ] `PREMIUM_FEATURES` dizisi (satır ~44) — `title`/`desc` hardcoded ("Unlimited AI Conversations" vb.) → `t()` anahtarlarına taşı.
- [ ] Subscribe Alert (satır ~240): `'Welcome to Premium'` + mesaj.
- [ ] Token satın alma Alert (satır ~285, ~294): `'Done'`, `'... Moon Tokens added ...'`.
- [ ] CTA butonu (satır ~431): `'Start 7-Day Free Trial'` / `'Subscribe Monthly'`.
- [ ] `'Save {pack.save}'` (satır ~498).
- [ ] Yeni anahtarları `src/localization/translations.ts`'e (tr + en) ekle.

#### 3c. Genel i18n taraması
- [ ] Tüm ekranlarda hardcoded TR/EN string taraması (`>text<` ve `'...'` Alert'ler). `useTranslation` üzerinden geçir.
- [ ] `translations.ts`'te `tr` ve `en` anahtar paritesini doğrula (eksik anahtar → key string görünür).

### 4. Backend (ayrı Go repo'sunda — bu repoda değil)
- [ ] `POST /api/v1/users/me/push-token` — cihaz token'ını sakla (client hazır, `api.ts:registerPushToken`).
- [ ] Bildirim tetikleyici → **Expo Push API** ile gönderim (`https://exp.host/--/api/v2/push/send`). `data` payload'una `{ screen, params }` veya `type` koy (client `notificationDataToRoute` bunu okuyor).
- [ ] CORS / allowed origin: yeni IP (`192.168.1.23`) ve prod domain.

### 5. RevenueCat (gerçek ödeme)
- [ ] `.env`'deki **test** key'leri prod key ile değiştir (`EXPO_PUBLIC_REVENUECAT_*`).
- [ ] App Store Connect'te abonelik ürünleri (yıllık 399.99₺, aylık 49.99₺) + token paketleri tanımla.
- [ ] RevenueCat dashboard'da `premium` entitlement + offering eşle.
- [ ] `PremiumScreen.handleSubscribe` şu an sadece `Alert` + `updateUser({isPremium:true})` (satır ~237) — **gerçek `purchasePackage()`/`presentPaywall()` akışına bağla** (`services/revenueCat.ts` hazır).

### 6. Production AI erişimi
- [ ] **`USE_LOCAL_LLM`** (CLAUDE.md'de `true`, LM Studio `192.168.1.23:1234`) — TestFlight cihazı bu LAN adresine erişemez. Prod build'de buluta (Gemini/cloud LLM) düşmeli; doğrula.
- [ ] **Güvenlik:** `EXPO_PUBLIC_GEMINI_API_KEY` client bundle'ına gömülüyor (herkese açık). Prod'da AI çağrılarını backend proxy'ye taşımak veya key'i kısıtlamak şart.

---

## P1 — Çıkmadan Güçlü Tavsiye

- [ ] **OAuth (Google Sign-In)** — paket kurulu, bağlanmadı. Gerekenler: Google Cloud OAuth client ID + backend `/api/v1/auth/google` (id-token doğrula→JWT) + native rebuild + `app.json` config plugin. (Dış hesap gerektiriyor → "sonra yapalım" aşamasına da bırakılabilir.)
- [ ] **Saptama eşiği kalibrasyonu** — `imageDetection.ts` kabul-ağırlıklı; gerçek cihazda yüz/el/kahve örnekleriyle test edip `NEGATIVE_MIN_CONFIDENCE` ve etiket listelerini ayarla.
- [ ] **Yüz landmark overlay** — servis landmark döndürüyor; `FaceReadingScreen`'de foto üstüne nokta çizimi ("gerçekten okudu" hissi).
- [ ] **Forgot Password / Change Password** akışlarını gerçek backend ile uçtan uca test et.
- [ ] **Offline davranış** — `OfflineBanner` + `healthCheck` gerçek kopuk ağda test.

---

## P2 — Sonraki Turlar (TestFlight sonrası olabilir)

- [ ] Kalan emoji / Ionicons / hardcoded renk temizliği (CLAUDE.md kuralları; eski `PROGRESS.md` P2/P3).
- [ ] Erişilebilirlik (a11y) etiketleri.
- [ ] Astrolog online durumu realtime (WebSocket/polling).
- [ ] Image caching doğrulama (`expo-image` var).
- [ ] Admin panel auto-refresh tutarlılığı.

---

## TestFlight Çıkış Adımları (sıralı)

1. [ ] Apple Developer + App Store Connect kaydı, bundle id doğrula.
2. [ ] `eas init` → gerçek `projectId`; `eas.json` prod profili.
3. [ ] P0 madde 3 (i18n) + madde 5 (RevenueCat) + madde 6 (prod AI) tamam.
4. [ ] APNs key EAS'e yükle.
5. [ ] `eas build --profile production --platform ios`.
6. [ ] `eas submit -p ios` (veya Transporter) → App Store Connect.
7. [ ] TestFlight'ta internal test grubu → gerçek cihazda **doğrulama checklist** (aşağı).
8. [ ] External test (gerekirse Beta App Review).

---

## Gerçek Cihaz Doğrulama Checklist (her build sonrası)

- [ ] Kayıt / giriş / çıkış akışı
- [ ] AI sohbet **TR seçiliyken Türkçe cevap** (madde 3a)
- [ ] Yüz/El/Kahve: doğru fotoğraf kabul, ayak vb. ret; gerçek fotoğraf **asla yanlış reddedilmiyor**
- [ ] Meeting Forecast: doğum verisiyle tahmin, paylaş
- [ ] Push: token kaydı + örnek bildirim + tap → doğru ekran
- [ ] Premium: tüm metinler çevrili (madde 3b), gerçek satın alma akışı
- [ ] Tema (dark/light) + dil değişimi tüm ekranlarda

---

## Notlar
- Backend (Go + PostgreSQL + Docker) ve admin panel **ayrı klasörde**; madde 4 ve OAuth backend işleri orada yapılır.
- Native modül ekleyen her değişiklik (ML Kit, notifications, Google Sign-In) **yeni build** gerektirir; toplu yapıp tek build almak verimli.
