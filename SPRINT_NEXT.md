# SPRINT 8 — Feature UX Modernization & Visual Overhaul

Son güncelleme: 2026-03-04

✅ **TAMAMLANDI** — Tüm 8 özellik 2026-03-04 tarihinde implement edildi.
Detaylar için PROGRESS.md Sprint 8 bölümüne bakınız.

---

## ÖZELLIK 1 — Draw Soulmate (Ruh Eşini Çiz) — Karikatür Portre

### Mevcut Durum
- `DrawSoulmateScreen.tsx` ve `FindSoulmateScreen.tsx` var
- Şu an metin tabanlı — kullanıcıya yazılı profil veriyor
- Diğer astroloji uygulamaları gibi **siyah-beyaz karikatür figür portre** çizim özelliği YOK

### Hedef
Diğer popüler astroloji uygulamalarındaki gibi:
- Kullanıcının doğum bilgilerini (burç, yükselen, ay burcu) al
- Astrolojik uyum analizine göre **ruh eşinin fiziksel özelliklerini** tahmin et
- **Siyah-beyaz karikatür/figür portre** olarak çiz
- Çizim stili: line art, minimalist, monochrome sketch (Pinterest astro portrait tarzı)

### Teknik Yaklaşım
**Seçenek A (Önerilen): AI Image Generation**
- Gemini veya Dall-E/Stable Diffusion API ile portre üret
- Prompt: `"Black and white line art portrait, minimalist sketch style, [astrolojik özellikler]"`
- Backend'de `POST /api/v1/readings/soulmate-portrait` endpoint'i
- Go handler: Gemini Imagen veya harici image API çağrısı
- Response: base64 image veya URL

**Seçenek B: Parametre Tabanlı SVG**
- Saç tipi, yüz şekli, göz tipi gibi parametreleri astrolojik kurallara göre seç
- SVG template'leri birleştirerek portre oluştur
- Daha hafif ama daha az etkileyici

### UI/UX Tasarımı
```
[Siyah/koyu arka plan]

"Your Soulmate Portrait"
[Yükleme animasyonu — yıldızlar bağlanıyor]

[Siyah-beyaz portre görseli — büyük, ortada]

Altında:
- Fiziksel özellikler listesi (boy, saç rengi, göz rengi vb.)
- Kişilik özellikleri
- "Nerede karşılaşabilirsiniz" tahmini
- Uyum yüzdesi

[Kaydet / Paylaş butonları]
```

### Token Maliyeti: 30 token (görsel üretim maliyeti yüksek)

---

## ÖZELLIK 2 — Birth Chart (Doğum Haritası) UX Modernizasyonu

### Mevcut Durum
- `BirthChartScreen.tsx` (34KB) mevcut
- 23 adet hardcoded renk var
- isDark kontrolleri dağınık, `useTheme()` tam kullanılmıyor
- Diğer sayfaların mat/modern felsefesiyle uyumsuz

### Yapılacaklar
1. **Tüm hardcoded renkleri `useTheme()` ile değiştir**
   - `'#444'`, `'#222'`, `'#333'` → `colors.border`, `colors.card`, `colors.surface`
   - `'#BBB'` → `colors.textSecondary`
   - `'#FFF'`, `'#F5F5F5'` → `colors.background`, `colors.surface`

2. **UI modernizasyonu**
   - Mat stil kartlar (border yerine subtle shadow + rounded)
   - Gezegen pozisyonları: ikonlu liste (her gezegen için emoji/ikon yerine **SVG ikonu**)
   - Ev (house) bilgileri: kompakt grid layout
   - Aspect açıları: renkli çizgilerle görsel diagram
   - Animasyonlu chart wheel (Animated API — Reanimated KULLANMA)

3. **Astrolojik chart wheel SVG**
   - 12 ev bölümü
   - Gezegen pozisyonları
   - Aspect çizgileri (conjunct, trine, square, opposition)
   - Burç sembolleri

4. **Diğer sayfalarla tutarlı header/layout**
   - SafeAreaView + edges={['top']}
   - ScrollView showsVerticalScrollIndicator={false}
   - Gap/spacing: flexbox gap

---

## ÖZELLIK 3 — Face Reading (Yüz Okuma) Modern UX

### Mevcut Durum
- `FaceReadingScreen.tsx` (21KB) mevcut
- 33 hardcoded renk (`#00E5FF`, `#9D4EDD`, `#FFFFFF`)
- Temel fotoğraf çekimi var ama **yüz tanıma (face detection)** YOK
- Fotoğraftan sonra genel AI yorumu yapıyor

### Yapılacaklar
1. **Face Recognition entegrasyonu**
   - `expo-face-detector` veya `react-native-vision-camera` + ML Kit
   - Yüz landmark'larını tespit et (göz, burun, ağız, alın, çene)
   - Yüz oranlarını hesapla (altın oran, yüz şekli)
   - Kamera overlay: yüz çerçevesi (gerçek zamanlı)

2. **Astrolojik yüz okuma kuralları**
   - Yüz şekli → element (yuvarlak=su, oval=hava, kare=toprak, üçgen=ateş)
   - Alın genişliği → zihinsel kapasite
   - Göz aralığı → sosyal eğilim
   - Burun tipi → liderlik/güç
   - Dudak şekli → duygusal ifade
   - Çene yapısı → kararlılık

3. **Modern UI**
   - Kamera açıldığında yüz kılavuz overlay'i (ince beyaz çerçeve)
   - Analiz sırasında yüz üzerinde landmark noktaları görünür
   - Sonuç: her bölge için ayrı kart (göz kartı, burun kartı vb.)
   - Her kart: bölge görseli + astrolojik yorum + yüzde skoru
   - Tüm renkler `useTheme()` ile

---

## ÖZELLIK 4 — Vedic Chart (Vedik Harita) Modernizasyonu

### Mevcut Durum
- `VedicChartScreen.tsx` (26KB) mevcut
- 34 hardcoded renk (`#FF6B35`, `#FFD700`, `#FAFAFA`)
- Temel işlevsellik var ama görsel olarak zayıf

### Yapılacaklar
1. **Tüm renkleri theme'e taşı**
   - Saffron orange ve gold renkleri Vedik tema paleti olarak koru ama theme-aware yap
   - Dark mode'da: saffron (#FF6B35) → daha koyu ton, gold aynı kalır
   - Light mode'da: mevcut renkler kalır

2. **Kuzey Hint (Diamond) ve Güney Hint (Square) chart tipleri**
   - Toggle: North Indian / South Indian style
   - SVG ile çizilmiş geleneksel chart formatı
   - Gezegen kısaltmaları doğru pozisyonlarda

3. **Dasha hesaplaması**
   - Vimshottari Dasha periyotları
   - Mevcut dasha ve alt-dasha gösterimi
   - Timeline UI (horizontal scrollable)

4. **Diğer sayfalarla tutarlı UX**
   - Mat kartlar, modern tipografi, proper spacing

---

## ÖZELLIK 5 — Tema Desteği: Tüm Ekranları Kontrol Et & Düzelt

### Mevcut Sorun
**40 ekranda toplam 1170+ hardcoded renk** tespit edildi.

### En Kritik Dosyalar (öncelik sırasına göre)
| Dosya | Hardcoded Renk Sayısı |
|-------|----------------------|
| HistoryScreen.tsx | 52 |
| RisingSignScreen.tsx | 46 |
| TarotScreen.tsx | 42 |
| ProfileScreen.tsx | 42 |
| SettingsScreen.tsx | 40 |
| PalmReadingScreen.tsx | 35 |
| VedicChartScreen.tsx | 34 |
| FaceReadingScreen.tsx | 33 |
| SynastryScreen.tsx | 30 |
| BirthChartScreen.tsx | 23 |
| DrawSoulmateScreen.tsx | 20 |

### Yaklaşım
1. `useTheme()` hook'unda eksik renkleri ekle:
   - `colors.surface` — kart arka planı
   - `colors.surfaceVariant` — ikincil kart
   - `colors.border` — kenar çizgileri
   - `colors.textSecondary` — soluk metin
   - `colors.textTertiary` — çok soluk metin
   - `colors.accent` — mor vurgu (#9D4EDD)
   - `colors.success` — yeşil
   - `colors.warning` — turuncu
   - `colors.error` — kırmızı

2. Her ekranda:
   - `isDark ? '#xxx' : '#yyy'` → `colors.xxx` ile değiştir
   - LinearGradient renkleri → `isDark ? darkColors : lightColors` array
   - Inline style'daki sabit renkleri çıkar

3. Her iki temada test et (dark + light)

---

## ÖZELLIK 6 — Synastry Uyum: Gerçekçi Astrolojik Veriler

### Mevcut Sorun
- Terazi ve Akrep arası uyum gibi değerler yapay/random
- %100 uyum vermiyor olabilir (olması gereken durumlarda)

### Yapılacaklar
1. **Gerçek astrolojik uyum tablosu oluştur**
   ```typescript
   // src/data/zodiacCompatibility.ts
   const COMPATIBILITY: Record<string, Record<string, number>> = {
     aries: { aries: 75, taurus: 55, gemini: 80, ... },
     taurus: { aries: 55, taurus: 70, gemini: 45, ... },
     // ... 12x12 matris (gerçek astroloji kurallarına göre)
   }
   ```

2. **Uyum boyutları (4 kategori)**
   - Genel uyum (element + modality)
   - Romantik uyum (Venüs-Mars ilişkisi)
   - İletişim uyumu (Merkür pozisyonları)
   - Duygusal uyum (Ay burçları)

3. **Element kuralları**
   - Ateş + Hava = yüksek uyum (80-95%)
   - Toprak + Su = yüksek uyum (80-95%)
   - Aynı element = iyi uyum (70-85%)
   - Ateş + Su = düşük uyum (30-50%)
   - Toprak + Hava = orta uyum (45-60%)

4. **Terazi-Akrep özelinde**
   - Komşu burçlar → doğal gerilim ama çekim
   - Venüs (Terazi) + Pluto (Akrep) = yoğun romantik çekim
   - Gerçek uyum: ~65-72% (düşük değil, orta-yüksek)
   - Romantik uyum daha yüksek (~78%), iletişim daha düşük (~58%)

---

## ÖZELLIK 7 — Palm Reading & Face Reading: Gerçek Recognition

### Palm Reading (El Falı)
1. **Hand Recognition**
   - `react-native-vision-camera` + TensorFlow Lite veya MediaPipe Hands
   - 21 landmark noktası tespit (el bilek, parmak uçları, eklemler)
   - Avuç içi çizgilerini tanı:
     - Yaşam çizgisi (Life Line)
     - Kalp çizgisi (Heart Line)
     - Akıl çizgisi (Head Line)
     - Kader çizgisi (Fate Line)

2. **Astrolojik el okuma kuralları**
   - Yaşam çizgisi uzunluğu + derinliği → vitalite
   - Kalp çizgisi eğrisi → duygusal derinlik
   - Akıl çizgisi → düşünce tarzı (düz = mantıksal, eğri = yaratıcı)
   - Parmak uzunlukları → element ilişkisi
   - Tepeler (mounts): Venüs, Jupiter, Satürn, Apollo, Merkür

3. **Kamera overlay**
   - El yerleştirme kılavuzu (ince beyaz el silüeti)
   - Gerçek zamanlı landmark noktaları
   - "Elinizi çerçeveye yerleştirin" talimatı

4. **Sonuç UI**
   - Çekilen el fotoğrafı üzerine çizgi overlay'leri
   - Her çizgi için ayrı yorum kartı
   - Genel karakter analizi

### Face Reading (Yüz Okuma) — Yukarıda Özellik 3'te detaylı

---

## ÖZELLIK 8 — Tarot Kartları: Görsel Motifler

### Mevcut Sorun
- `TarotScreen.tsx` sadece kart isimlerini gösteriyor
- Görsel/motif yok — düz metin kartları
- 42 hardcoded renk

### Yapılacaklar
1. **Tarot kart görselleri**
   - 78 kart için SVG veya PNG motif (Major Arcana: 22 kart, Minor Arcana: 56 kart)
   - Stil: modern line art, altın ve mor tonları, koyu arka plan
   - Her kart: isim + numara + sembolik görsel

2. **Görsel kaynağı seçenekleri**
   - **Seçenek A**: Open-source tarot kart seti (Rider-Waite public domain)
   - **Seçenek B**: AI ile üretilmiş özel kart görselleri (Stable Diffusion)
   - **Seçenek C**: Minimalist SVG sembol setleri (en hafif)

3. **Kart çevirme animasyonu**
   - Animated API ile 3D flip efekti
   - Arka yüz: mor/altın pattern
   - Ön yüz: kart görseli + isim
   - Çevirme süresi: 600ms

4. **Spread layout'ları**
   - Tek kart: büyük, ortada
   - 3 kart (Past-Present-Future): yan yana
   - Celtic Cross: 10 kart geleneksel layout
   - Her kartın pozisyon anlamı

5. **UI modernizasyonu**
   - Tüm renkler theme-aware
   - Kart seçimi: karıştırma animasyonu
   - Sonuç: seçilen kart büyür, yorum kartın altında açılır

---

## Uygulama Sırası (Sprint 8)

```
YÜKSEK ÖNCELİK:
1. Tema düzeltmesi — useTheme() genişlet, en kritik 11 ekranı düzelt
2. Synastry uyum tablosu — gerçek astrolojik veriler (zodiacCompatibility.ts)
3. Birth Chart UX modernizasyonu
4. Vedic Chart UX modernizasyonu

ORTA ÖNCELİK:
5. Tarot kart görselleri (SVG motif seti + flip animasyonu)
6. Face Reading — face detection entegrasyonu
7. Palm Reading — hand recognition entegrasyonu

DÜŞÜK ÖNCELİK (sonraki sprint'e kalabilir):
8. Draw Soulmate — AI image generation (API maliyeti araştırılmalı)
```

---

## Teknik Notlar

### Kamera/Recognition Kütüphaneleri
- `expo-camera` — temel kamera erişimi (zaten yüklü)
- `expo-face-detector` — yüz tespiti (Expo SDK ile uyumlu)
- `react-native-vision-camera` — advanced kamera (frame processing)
- `@mediapipe/hands` — el landmark tespiti (web, RN bridge gerekir)
- `expo-image-manipulator` — fotoğraf işleme

### Theme Genişletme
```typescript
// useTheme() hook'una eklenecek renkler:
colors: {
  ...mevcut,
  surface: isDark ? '#1A1A1A' : '#F8F8F8',
  surfaceVariant: isDark ? '#222222' : '#F0F0F0',
  border: isDark ? '#333333' : '#E0E0E0',
  textSecondary: isDark ? '#999999' : '#666666',
  textTertiary: isDark ? '#666666' : '#999999',
  accent: '#9D4EDD',
  accentDim: isDark ? 'rgba(157,78,221,0.15)' : 'rgba(157,78,221,0.1)',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
}
```

### Zodiac Uyum Kuralları (Kaynak)
- Same element: 75-85%
- Complementary elements (Fire-Air, Earth-Water): 80-95%
- Square elements (Fire-Earth, Air-Water): 40-55%
- Opposite signs: 70-85% (çekim var ama gerilim de var)
- Adjacent signs: 55-72% (farklı element, yakın enerji)
- Trine (aynı element, farklı modality): 85-95%

---

## Önemli Dosya Yolları

### Değişecek Ekranlar
```
src/screens/
  DrawSoulmateScreen.tsx     ← AI portre üretimi ekle
  BirthChartScreen.tsx       ← UX modernizasyon + tema
  FaceReadingScreen.tsx      ← Face detection + tema
  VedicChartScreen.tsx       ← UX modernizasyon + tema
  PalmReadingScreen.tsx      ← Hand recognition + tema
  TarotScreen.tsx            ← Kart görselleri + tema
  SynastryScreen.tsx         ← Gerçek uyum verileri + tema
  HistoryScreen.tsx          ← Tema düzeltmesi
  RisingSignScreen.tsx       ← Tema düzeltmesi
  ProfileScreen.tsx          ← Tema düzeltmesi
  SettingsScreen.tsx         ← Tema düzeltmesi
```

### Yeni Dosyalar
```
src/data/zodiacCompatibility.ts    ← 12x12 uyum matrisi
src/assets/tarot/                  ← Tarot kart görselleri (SVG/PNG)
```

### Tema
```
src/theme/useTheme.ts              ← Yeni renkler ekle
```

---

## Kritik Kurallar (Claude için)

- **Reanimated KULLANMA** — TabNavigator'da "Exception in HostFunction" verir
- **useTheme()** her zaman kullan — hiçbir ekranda sabit renk yazma
- **Emoji butonlarda KULLANMA**
- **Dil: İngilizce** — Türkçe kalmış yerleri İngilizce'ye çevir
- **react-native-vision-camera** Expo Managed Workflow ile uyumlu MU kontrol et (alternatif: expo-camera)
- **Tarot görselleri**: telif hakkı olmayan kaynaklar kullan
- **Face/Hand detection**: cihazda (on-device) çalışmalı, sunucuya fotoğraf gönderme
