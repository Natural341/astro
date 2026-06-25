# SPRINT 7 — Advanced Analytics Dashboard

Son guncelleme: 2026-03-04

Bu sprint, admin paneldeki Analytics sekmesini kapsamli bir karar-destek sistemine donusturur.
Mevcut mock Analytics sayfasi silinip yerine 6 alt sekmeli gercek veri sistemi gelir.

---

## GENEL MIMARI

### Veri Toplama: 2 Katmanli Yaklasim

**Hot Layer (PostgreSQL):**
- `events` tablosu — kullanici aksiyonlari (son 90 gun)
- `user_sessions` tablosu — oturum suresi ve platform
- `user_milestones` tablosu — onemli ilk adimlar (first_reading, first_purchase vb.)

**Cold Layer (daily_metrics):**
- Go cron job ile her gece hesaplanan metrikler
- Dashboard bu tablodan okur — hizli ve olceklenebilir

### Mobil Event Gonderimi
- Event'ler cihazda batch'lenir (30sn veya app background'a gecince)
- Tek `POST /api/v1/events` ile toplu gonderim
- Minimum network yuku

---

## ADIM 1 — Yeni DB Tablolari (schema.sql)

### 1.1 events tablosu
```sql
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    screen VARCHAR(100),
    platform VARCHAR(20),        -- 'ios', 'android'
    app_version VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_screen ON events(screen);
```

**Event tipleri:**
| event_type | event_data ornegi | Aciklama |
|---|---|---|
| `screen_view` | `{"screen": "HomeScreen"}` | Ekran acildi |
| `feature_tap` | `{"feature": "tarot"}` | Feature butonuna basildi |
| `feature_complete` | `{"feature": "dream", "tokens_used": 15}` | Reading tamamlandi |
| `feature_abandon` | `{"feature": "coffee", "step": 2}` | Feature yarim birakildi |
| `token_insufficient` | `{"feature": "synastry", "needed": 50, "had": 20}` | Token yetmedi |
| `premium_view` | `{"source": "token_wall"}` | Premium ekrani acildi |
| `premium_dismiss` | `{"viewed_seconds": 8}` | Premium ekrani kapatildi |
| `purchase_start` | `{"package": "popular"}` | Satin alma basladi |
| `purchase_complete` | `{"package": "popular", "amount": 44.99}` | Satin alma tamamlandi |
| `onboarding_step` | `{"step": 3, "step_name": "birth_date"}` | Onboarding adimi |
| `onboarding_complete` | `{}` | Onboarding tamamlandi |
| `onboarding_abandon` | `{"last_step": 2}` | Onboarding terk edildi |
| `session_start` | `{"platform": "android"}` | Uygulama acildi |
| `session_end` | `{"duration_seconds": 342}` | Uygulama kapandi |
| `streak_claim` | `{"day": 5, "tokens": 5}` | Streak alindi |
| `streak_miss` | `{}` | Streak kirildi |
| `astrologer_view` | `{"astrologer_id": "1", "is_ai": true}` | Astrolog profiline girildi |
| `notification_tap` | `{"type": "new_message"}` | Bildirime tiklandi |
| `share` | `{"content": "reading", "platform": "whatsapp"}` | Icerik paylasimi |

### 1.2 user_sessions tablosu
```sql
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    duration_seconds INTEGER,
    platform VARCHAR(20),
    app_version VARCHAR(20),
    screens_visited INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_start ON user_sessions(session_start);
```

### 1.3 user_milestones tablosu
```sql
CREATE TABLE IF NOT EXISTS user_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    milestone VARCHAR(50) NOT NULL,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, milestone)
);
CREATE INDEX idx_milestones_user_id ON user_milestones(user_id);
CREATE INDEX idx_milestones_milestone ON user_milestones(milestone);
```

**Milestone tipleri:**
| milestone | Tetikleyici |
|---|---|
| `first_reading` | Ilk reading tamamlandiginda |
| `first_purchase` | Ilk token satin aliminda |
| `fifth_reading` | 5. reading'de |
| `first_astrologer_chat` | Ilk astrolog sohbetinde |
| `premium_converted` | Premium abone oldugunda |
| `first_forum_post` | Ilk forum sorusunda |
| `streak_7` | 7 gunluk streak'te |
| `streak_30` | 30 gunluk streak'te |

### 1.4 daily_metrics tablosu
```sql
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    dimension VARCHAR(50),           -- NULL = genel, 'platform', 'feature', 'package' vb.
    dimension_value VARCHAR(100),    -- 'ios', 'tarot', 'popular' vb.
    UNIQUE(date, metric_name, dimension, dimension_value)
);
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX idx_daily_metrics_name ON daily_metrics(metric_name);
```

**Hesaplanan metrikler:**
| metric_name | dimension | Aciklama |
|---|---|---|
| `dau` | NULL | Gunluk aktif kullanici |
| `wau` | NULL | Haftalik aktif kullanici |
| `mau` | NULL | Aylik aktif kullanici |
| `new_users` | NULL / `platform` | Yeni kayit |
| `revenue` | NULL / `package` | Gelir (TL) |
| `readings` | NULL / `feature` | Reading sayisi |
| `feature_adoption` | `feature` | Tekil kullanici % |
| `feature_completion` | `feature` | Baslayan vs tamamlayan % |
| `avg_session_seconds` | NULL / `platform` | Ort. oturum suresi |
| `retention_d1` | `cohort` (YYYY-MM) | D1 retention orani |
| `retention_d7` | `cohort` | D7 retention orani |
| `retention_d14` | `cohort` | D14 retention orani |
| `retention_d30` | `cohort` | D30 retention orani |
| `churn_rate` | NULL | Haftalik churn orani |
| `arpu` | NULL | Kullanici basina ort. gelir |
| `tokens_minted` | NULL | Basilan token |
| `tokens_spent` | NULL / `feature` | Harcanan token |
| `token_depletion_no_purchase` | NULL | Token bitip almayan oran |
| `premium_conversion` | NULL | Free → Premium donusum orani |
| `onboarding_completion` | NULL | Onboarding tamamlama orani |

### 1.5 users tablosuna ek kolonlar
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_reading_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_readings INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;
```

### 1.6 readings tablosuna ek kolon
```sql
ALTER TABLE readings ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
-- started_at = feature_tap zamani, created_at = tamamlanma zamani
-- Arasinidaki fark = completion suresi
```

### 1.7 user_segments tablosu (A/B test icin)
```sql
CREATE TABLE IF NOT EXISTS user_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    segment_key VARCHAR(50) NOT NULL,
    segment_value VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, segment_key)
);
CREATE INDEX idx_segments_key ON user_segments(segment_key);
```

---

## ADIM 2 — Go Backend: Event Collection API

### 2.1 handlers/events.go (YENI DOSYA)

```
POST /api/v1/events          — Toplu event kaydi (batch)
GET  /api/v1/events/summary  — Admin: event ozeti (son 24s)
```

**PostEvents:**
```go
// Request body:
type EventBatch struct {
    Events []EventItem `json:"events"`
}
type EventItem struct {
    EventType  string          `json:"event_type"`
    EventData  json.RawMessage `json:"event_data"`
    Screen     string          `json:"screen"`
    Platform   string          `json:"platform"`
    AppVersion string          `json:"app_version"`
    Timestamp  time.Time       `json:"timestamp"` // client-side timestamp
}

// Batch insert (tek transaction):
tx := h.DB.Begin()
for _, e := range batch.Events {
    tx.Exec(`INSERT INTO events (user_id, event_type, event_data, screen, platform, app_version, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        userID, e.EventType, e.EventData, e.Screen, e.Platform, e.AppVersion, e.Timestamp)
}
tx.Commit()
```

**Max 100 event/batch, rate limit: 2 req/dakika/kullanici**

### 2.2 handlers/sessions.go (YENI DOSYA)

```
POST /api/v1/sessions/start  — Oturum baslat
PUT  /api/v1/sessions/end    — Oturum bitir
```

**StartSession:**
```go
// Insert + return session_id
var sessionID string
h.DB.QueryRow(`INSERT INTO user_sessions (user_id, platform, app_version)
               VALUES ($1,$2,$3) RETURNING id`,
    userID, platform, appVersion).Scan(&sessionID)

// Ayni zamanda users.last_active_at guncelle
h.DB.Exec(`UPDATE users SET last_active_at = NOW() WHERE id = $1`, userID)
```

**EndSession:**
```go
h.DB.Exec(`UPDATE user_sessions
           SET session_end = NOW(),
               duration_seconds = EXTRACT(EPOCH FROM (NOW() - session_start))::int
           WHERE id = $1 AND user_id = $2`, sessionID, userID)
```

### 2.3 handlers/milestones.go (YENI DOSYA)

```
POST /api/v1/milestones   — Milestone kaydet (idempotent, UNIQUE constraint)
```

```go
// ON CONFLICT DO NOTHING — ayni milestone iki kez kaydedilmez
h.DB.Exec(`INSERT INTO user_milestones (user_id, milestone, metadata)
           VALUES ($1,$2,$3) ON CONFLICT (user_id, milestone) DO NOTHING`,
    userID, milestone, metadata)
```

**Milestone'lar mobil taraftan veya backend tarafindan tetiklenir:**
- Mobil: `first_reading` (reading tamamlaninca), `first_forum_post`
- Backend: `first_purchase` (transaction handler'da), `premium_converted` (subscription handler'da)

---

## ADIM 3 — Go Backend: Analytics Aggregation

### 3.1 handlers/analytics_cron.go (YENI DOSYA)

Her gece 03:00'te calisacak cron job. `daily_metrics` tablosuna yazar.

```go
func (h *Handler) RunDailyAggregation() {
    yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")

    // DAU
    h.upsertMetric(yesterday, "dau", nil, nil, `
        SELECT COUNT(DISTINCT user_id) FROM events
        WHERE DATE(created_at) = $1`, yesterday)

    // WAU
    h.upsertMetric(yesterday, "wau", nil, nil, `
        SELECT COUNT(DISTINCT user_id) FROM events
        WHERE created_at >= NOW() - INTERVAL '7 days'`)

    // MAU
    h.upsertMetric(yesterday, "mau", nil, nil, `
        SELECT COUNT(DISTINCT user_id) FROM events
        WHERE created_at >= NOW() - INTERVAL '30 days'`)

    // New users
    h.upsertMetric(yesterday, "new_users", nil, nil, `
        SELECT COUNT(*) FROM users WHERE DATE(created_at) = $1`, yesterday)

    // Revenue (total)
    h.upsertMetric(yesterday, "revenue", nil, nil, `
        SELECT COALESCE(SUM(amount),0) FROM transactions
        WHERE type='purchase' AND DATE(created_at) = $1`, yesterday)

    // Revenue by package
    // ... GROUP BY description ile paket bazli

    // Feature adoption (her feature icin)
    features := []string{"ai_chat","dream","tarot","coffee","numerology","birth_chart","synastry"}
    for _, f := range features {
        // Kullanan tekil kullanici / toplam aktif kullanici
        h.upsertMetric(yesterday, "feature_adoption", str("feature"), str(f), `
            SELECT ROUND(
                COUNT(DISTINCT CASE WHEN event_data->>'feature' = $2 THEN user_id END)::numeric /
                NULLIF(COUNT(DISTINCT user_id),0) * 100, 2
            ) FROM events WHERE DATE(created_at) = $1`, yesterday, f)

        // Completion rate
        h.upsertMetric(yesterday, "feature_completion", str("feature"), str(f), `
            SELECT ROUND(
                COUNT(DISTINCT CASE WHEN event_type='feature_complete' AND event_data->>'feature'=$2 THEN user_id END)::numeric /
                NULLIF(COUNT(DISTINCT CASE WHEN event_type='feature_tap' AND event_data->>'feature'=$2 THEN user_id END),0) * 100, 2
            ) FROM events WHERE DATE(created_at) = $1`, yesterday, f)
    }

    // Avg session duration
    h.upsertMetric(yesterday, "avg_session_seconds", nil, nil, `
        SELECT COALESCE(AVG(duration_seconds),0) FROM user_sessions
        WHERE DATE(session_start) = $1 AND duration_seconds IS NOT NULL`, yesterday)

    // Retention cohort hesaplamalari
    h.calculateRetention(yesterday)

    // Churn rate
    h.upsertMetric(yesterday, "churn_rate", nil, nil, `
        SELECT ROUND(
            (SELECT COUNT(*) FROM users WHERE last_active_at < NOW() - INTERVAL '7 days' AND last_active_at >= NOW() - INTERVAL '14 days')::numeric /
            NULLIF((SELECT COUNT(*) FROM users WHERE last_active_at >= NOW() - INTERVAL '14 days'),0) * 100, 2
        )`)

    // Token economy
    h.upsertMetric(yesterday, "tokens_minted", nil, nil, `
        SELECT COALESCE(SUM(token_delta),0) FROM transactions
        WHERE token_delta > 0 AND DATE(created_at) = $1`, yesterday)

    h.upsertMetric(yesterday, "tokens_spent", nil, nil, `
        SELECT COALESCE(ABS(SUM(token_delta)),0) FROM transactions
        WHERE token_delta < 0 AND DATE(created_at) = $1`, yesterday)

    // Token depletion without purchase
    h.upsertMetric(yesterday, "token_depletion_no_purchase", nil, nil, `
        SELECT ROUND(
            (SELECT COUNT(DISTINCT user_id) FROM events
             WHERE event_type='token_insufficient' AND DATE(created_at) = $1
             AND user_id NOT IN (
                SELECT user_id FROM transactions WHERE type='purchase' AND created_at > events.created_at
             ))::numeric /
            NULLIF((SELECT COUNT(DISTINCT user_id) FROM events WHERE event_type='token_insufficient' AND DATE(created_at) = $1),0) * 100, 2
        )`, yesterday)
}

// Helper
func (h *Handler) upsertMetric(date, name string, dim, dimVal *string, query string, args ...interface{}) {
    var value float64
    h.DB.QueryRow(query, args...).Scan(&value)
    h.DB.Exec(`INSERT INTO daily_metrics (date, metric_name, metric_value, dimension, dimension_value)
               VALUES ($1,$2,$3,$4,$5)
               ON CONFLICT (date, metric_name, dimension, dimension_value)
               DO UPDATE SET metric_value = $3`,
        date, name, value, dim, dimVal)
}
```

### 3.2 Retention hesaplama

```go
func (h *Handler) calculateRetention(date string) {
    // Son 6 aylik cohort'lar icin D1, D7, D14, D30 hesapla
    periods := []struct{ name string; days int }{
        {"retention_d1", 1}, {"retention_d7", 7}, {"retention_d14", 14}, {"retention_d30", 30},
    }
    for monthOffset := 0; monthOffset < 6; monthOffset++ {
        cohortMonth := time.Now().AddDate(0, -monthOffset, 0).Format("2006-01")
        for _, p := range periods {
            h.upsertMetric(date, p.name, str("cohort"), str(cohortMonth), `
                SELECT ROUND(
                    (SELECT COUNT(DISTINCT e.user_id) FROM events e
                     JOIN users u ON u.id = e.user_id
                     WHERE TO_CHAR(u.created_at, 'YYYY-MM') = $2
                     AND e.created_at >= u.created_at + INTERVAL '%d days'
                    )::numeric /
                    NULLIF((SELECT COUNT(*) FROM users WHERE TO_CHAR(created_at, 'YYYY-MM') = $2),0) * 100, 2
                )`, p.days, cohortMonth)
        }
    }
}
```

### 3.3 Cron setup (main.go)

```go
import "github.com/robfig/cron/v3"

c := cron.New()
c.AddFunc("0 3 * * *", func() {  // Her gece 03:00
    h.RunDailyAggregation()
})
c.Start()
```

---

## ADIM 4 — Go Backend: Admin Analytics API

### 4.1 handlers/admin_analytics.go (YENI DOSYA)

6 endpoint — her biri admin paneldeki bir alt sekmeye karsilik gelir:

```
GET /api/v1/admin/analytics/overview    — KPI + Health Score + Trend
GET /api/v1/admin/analytics/users       — Cohort retention + Segmentler
GET /api/v1/admin/analytics/revenue     — LTV, ARPU, Paket analizi, Token ekonomisi
GET /api/v1/admin/analytics/features    — Adoption, completion, retention etkisi
GET /api/v1/admin/analytics/funnels     — Onboarding, Monetization, Value funnel'lari
GET /api/v1/admin/analytics/insights    — Rule-based alert + Anomali + Skorlar
```

### 4.2 Overview Endpoint

```go
// GET /api/v1/admin/analytics/overview?period=7d
func (h *Handler) GetAnalyticsOverview(c *gin.Context) {
    period := c.DefaultQuery("period", "7d") // 7d, 30d, 90d

    response := map[string]interface{}{
        // KPI Cards (guncel deger + onceki doneme gore % degisim)
        "kpis": map[string]interface{}{
            "dau":              h.getKPI("dau", period),
            "wau":              h.getKPI("wau", period),
            "mau":              h.getKPI("mau", period),
            "arpu":             h.getKPI("arpu", period),
            "avg_session":      h.getKPI("avg_session_seconds", period),
            "churn_rate":       h.getKPI("churn_rate", period),
            "premium_rate":     h.calculatePremiumRate(),
            "total_revenue":    h.getTotalRevenue(period),
        },
        // Her KPI'nin 30 gunluk spark chart verisi
        "trends": h.getMetricTrend("dau", 30),
        // Health Score (0-100)
        "health_score": h.calculateHealthScore(),
    }
    c.JSON(200, gin.H{"success": true, "data": response})
}

// KPI: guncel deger + onceki donem degeri + % degisim
type KPIValue struct {
    Current    float64 `json:"current"`
    Previous   float64 `json:"previous"`
    ChangePercent float64 `json:"change_percent"` // pozitif = artis, negatif = dusus
}

// Health Score hesaplama
func (h *Handler) calculateHealthScore() int {
    retention := h.latestMetric("retention_d7", nil, nil)  // 0-100
    revenueGrowth := h.weekOverWeekGrowth("revenue")       // -100 to +inf
    dauGrowth := h.weekOverWeekGrowth("dau")
    featureAdoption := h.avgFeatureAdoption()               // 0-100
    // rating := app store rating (henuz yok, sabit 4.0)

    // Normalize ve agirlikli ortalama
    score := (retention * 0.30) +
             (clamp(revenueGrowth+50, 0, 100) * 0.25) +
             (clamp(dauGrowth+50, 0, 100) * 0.20) +
             (featureAdoption * 0.15) +
             (80 * 0.10)  // placeholder rating
    return int(math.Min(score, 100))
}
```

### 4.3 Users Endpoint

```go
// GET /api/v1/admin/analytics/users
func (h *Handler) GetAnalyticsUsers(c *gin.Context) {
    response := map[string]interface{}{
        // Cohort Retention Tablosu (son 6 ay x D1/D7/D14/D30)
        "cohort_retention": h.getCohortRetention(),

        // Kullanici Segmentleri
        "segments": h.getUserSegments(),

        // Yeni vs geri donen kullanicilar (son 30 gun)
        "new_vs_returning": h.getNewVsReturning(30),
    }
    c.JSON(200, gin.H{"success": true, "data": response})
}

// Segment hesaplama
func (h *Handler) getUserSegments() []Segment {
    return []Segment{
        h.countSegment("new", `created_at > NOW() - INTERVAL '3 days' AND id NOT IN (SELECT user_id FROM readings)`),
        h.countSegment("active_free", `last_active_at > NOW() - INTERVAL '7 days' AND is_premium = false AND id IN (SELECT user_id FROM transactions WHERE type='purchase'  HAVING COUNT(*) = 0)`),
        h.countSegment("dormant", `last_active_at BETWEEN NOW() - INTERVAL '30 days' AND NOW() - INTERVAL '7 days'`),
        h.countSegment("churned", `last_active_at < NOW() - INTERVAL '30 days'`),
        h.countSegment("whale", `id IN (SELECT user_id FROM transactions WHERE type='purchase' AND created_at > NOW() - INTERVAL '30 days' GROUP BY user_id HAVING SUM(amount) > 100)`),
        h.countSegment("power_user", `id IN (SELECT user_id FROM readings WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY user_id HAVING COUNT(*) >= 10)`),
    }
}

type Segment struct {
    Name        string `json:"name"`
    Count       int    `json:"count"`
    Percentage  float64 `json:"percentage"`
    Description string `json:"description"`
    Suggestion  string `json:"suggestion"`
}
```

### 4.4 Revenue Endpoint

```go
// GET /api/v1/admin/analytics/revenue?period=30d
func (h *Handler) GetAnalyticsRevenue(c *gin.Context) {
    response := map[string]interface{}{
        // MRR (premium aboneliklerden)
        "mrr": h.calculateMRR(),
        // Token satis geliri
        "token_revenue": h.getTokenRevenue(),
        // LTV (kullanici basina toplam gelir)
        "ltv": h.calculateLTV(),
        // Paket performansi
        "package_performance": h.getPackagePerformance(),
        // Token ekonomisi
        "token_economy": map[string]interface{}{
            "total_minted":  h.totalTokensMinted(),
            "total_spent":   h.totalTokensSpent(),
            "in_circulation": h.tokensInCirculation(),
            "avg_lifetime_days": h.avgTokenLifetime(),
            "depletion_without_purchase_rate": h.depletionRate(),
            "spend_by_feature": h.tokenSpendByFeature(),
        },
        // Gelir trendi (son 30 gun)
        "revenue_trend": h.getMetricTrend("revenue", 30),
    }
    c.JSON(200, gin.H{"success": true, "data": response})
}

type PackagePerformance struct {
    PackageName    string  `json:"package_name"`
    TokenAmount    int     `json:"token_amount"`
    Price          float64 `json:"price"`
    TotalPurchases int     `json:"total_purchases"`
    ConversionRate float64 `json:"conversion_rate"`   // goruntuleyen / satin alan
    RepeatRate     float64 `json:"repeat_rate"`       // 2+ kez alanlar
    Revenue        float64 `json:"revenue"`
}
```

### 4.5 Features Endpoint

```go
// GET /api/v1/admin/analytics/features?period=30d
func (h *Handler) GetAnalyticsFeatures(c *gin.Context) {
    features := []string{"ai_chat","dream","tarot","coffee","numerology","birth_chart","synastry","astrologer_chat","planet_hours"}

    featureStats := []FeatureStat{}
    for _, f := range features {
        stat := FeatureStat{
            Name:            f,
            UniqueUsers:     h.featureUniqueUsers(f, period),
            AdoptionPercent: h.featureAdoption(f, period),
            CompletionRate:  h.featureCompletion(f, period),
            TrendPercent:    h.featureTrend(f),  // onceki doneme gore
            AvgSessionSec:   h.featureAvgSession(f, period),
            TokenRevenue:    h.featureTokenRevenue(f, period),
            RetentionImpact: h.featureRetentionImpact(f),
            RepeatRate:      h.featureRepeatRate(f, period),
            FreeVsPremium:   h.featureFreeVsPremium(f, period),
        }
        featureStats = append(featureStats, stat)
    }

    // ROI matrix hesapla
    for i := range featureStats {
        featureStats[i].ROIScore = h.calculateFeatureROI(featureStats[i])
    }

    response := map[string]interface{}{
        "features": featureStats,
        "comparison_matrix": h.featureComparisonMatrix(featureStats),
    }
    c.JSON(200, gin.H{"success": true, "data": response})
}

type FeatureStat struct {
    Name            string  `json:"name"`
    UniqueUsers     int     `json:"unique_users"`
    AdoptionPercent float64 `json:"adoption_percent"`    // kullanicilar icinde %
    CompletionRate  float64 `json:"completion_rate"`     // baslayan/tamamlayan %
    TrendPercent    float64 `json:"trend_percent"`       // onceki doneme gore degisim
    AvgSessionSec   float64 `json:"avg_session_seconds"` // bu feature'da gecirilen sure
    TokenRevenue    float64 `json:"token_revenue"`       // token gelir katkisi
    RetentionImpact float64 `json:"retention_impact"`    // kullananlar vs kullanmayanlarin D30
    RepeatRate      float64 `json:"repeat_rate"`         // 2+ kez kullananlar %
    FreeVsPremium   struct {
        FreePercent    float64 `json:"free_percent"`
        PremiumPercent float64 `json:"premium_percent"`
    } `json:"free_vs_premium"`
    ROIScore string `json:"roi_score"` // A+, A, B+, B, C
}

// Retention impact: bu feature'i kullananlar vs kullanmayanlarin D30 retention farki
func (h *Handler) featureRetentionImpact(feature string) float64 {
    var withFeature, withoutFeature float64
    h.DB.QueryRow(`
        SELECT ROUND(COUNT(DISTINCT CASE WHEN e2.user_id IS NOT NULL THEN u.id END)::numeric /
               NULLIF(COUNT(DISTINCT u.id),0) * 100, 2)
        FROM users u
        JOIN readings r ON r.user_id = u.id AND r.type = $1
        LEFT JOIN events e2 ON e2.user_id = u.id AND e2.created_at >= u.created_at + INTERVAL '30 days'
        WHERE u.created_at < NOW() - INTERVAL '30 days'
    `, feature).Scan(&withFeature)
    // ... withoutFeature da benzer sekilde
    return withFeature - withoutFeature // pozitif = iyi etki
}
```

### 4.6 Funnels Endpoint

```go
// GET /api/v1/admin/analytics/funnels?period=30d
func (h *Handler) GetAnalyticsFunnels(c *gin.Context) {
    response := map[string]interface{}{
        "onboarding": h.getOnboardingFunnel(),
        "monetization": h.getMonetizationFunnel(),
        "first_value": h.getFirstValueFunnel(),
        "astrologer": h.getAstrologerFunnel(),
    }
    c.JSON(200, gin.H{"success": true, "data": response})
}

type FunnelStep struct {
    Name       string  `json:"name"`
    Count      int     `json:"count"`
    Percentage float64 `json:"percentage"`    // ilk adima gore %
    DropOff    float64 `json:"drop_off"`      // onceki adimdan dusus %
}

func (h *Handler) getOnboardingFunnel() []FunnelStep {
    steps := []FunnelStep{
        h.funnelStep("App Open", `event_type='session_start'`),
        h.funnelStep("Name Entry", `event_type='onboarding_step' AND event_data->>'step'='1'`),
        h.funnelStep("Gender", `event_type='onboarding_step' AND event_data->>'step'='2'`),
        h.funnelStep("Birth Date", `event_type='onboarding_step' AND event_data->>'step'='3'`),
        h.funnelStep("Location", `event_type='onboarding_step' AND event_data->>'step'='4'`),
        h.funnelStep("Complete", `event_type='onboarding_complete'`),
    }
    // Yuzdeleri ilk adima gore hesapla
    base := steps[0].Count
    for i := range steps {
        steps[i].Percentage = float64(steps[i].Count) / float64(base) * 100
        if i > 0 {
            steps[i].DropOff = float64(steps[i-1].Count - steps[i].Count) / float64(steps[i-1].Count) * 100
        }
    }
    return steps
}

func (h *Handler) getMonetizationFunnel() []FunnelStep {
    return []FunnelStep{
        h.funnelStep("Feature Tap", `event_type='feature_tap'`),
        h.funnelStep("Token Insufficient", `event_type='token_insufficient'`),
        h.funnelStep("Premium/Token View", `event_type='premium_view'`),
        h.funnelStep("Package Select", `event_type='purchase_start'`),
        h.funnelStep("Purchase Complete", `event_type='purchase_complete'`),
    }
}
```

### 4.7 Insights Endpoint (Rule-Based + Anomaly)

```go
// GET /api/v1/admin/analytics/insights
func (h *Handler) GetAnalyticsInsights(c *gin.Context) {
    insights := []Insight{}

    // ====== RULE-BASED ALERTS ======

    // Churn alert
    churnRate := h.latestMetric("churn_rate", nil, nil)
    if churnRate > 15 {
        insights = append(insights, Insight{
            Severity: "critical",
            Category: "retention",
            Title:    "High churn rate detected",
            Message:  fmt.Sprintf("Churn rate is %.1f%% (threshold: 15%%). %d users lost in the last 7 days.", churnRate, h.recentChurnCount()),
            Suggestion: "Launch a win-back campaign targeting dormant users. Consider push notifications with personalized content.",
            Metric:   churnRate,
        })
    }

    // Token depletion without purchase
    deplRate := h.latestMetric("token_depletion_no_purchase", nil, nil)
    if deplRate > 50 {
        insights = append(insights, Insight{
            Severity: "warning",
            Category: "monetization",
            Title:    "Users leaving after token depletion",
            Message:  fmt.Sprintf("%.0f%% of users who run out of tokens don't make a purchase.", deplRate),
            Suggestion: "Show a one-time discounted package when tokens hit zero. Estimated impact: +20-30%% conversion.",
            Metric:   deplRate,
        })
    }

    // Low completion feature
    features := []string{"ai_chat","dream","tarot","coffee","numerology","birth_chart","synastry"}
    for _, f := range features {
        completion := h.latestMetric("feature_completion", str("feature"), str(f))
        if completion > 0 && completion < 50 {
            insights = append(insights, Insight{
                Severity: "info",
                Category: "product",
                Title:    fmt.Sprintf("Low completion rate: %s", f),
                Message:  fmt.Sprintf("%s completion rate is %.0f%%. More than half of users abandon before finishing.", f, completion),
                Suggestion: fmt.Sprintf("Review the %s UX flow. Consider simplifying steps or adding progress indicators.", f),
                Metric:   completion,
            })
        }
    }

    // High-impact underused feature
    for _, f := range features {
        adoption := h.latestMetric("feature_adoption", str("feature"), str(f))
        retImpact := h.featureRetentionImpact(f)
        if adoption < 30 && retImpact > 15 {
            insights = append(insights, Insight{
                Severity: "opportunity",
                Category: "growth",
                Title:    fmt.Sprintf("Hidden gem: %s", f),
                Message:  fmt.Sprintf("%s is used by only %.0f%% of users, but those who use it have %.0f%% higher D30 retention.", f, adoption, retImpact),
                Suggestion: fmt.Sprintf("Promote %s on the home screen. Users who discover it stay significantly longer.", f),
                Metric:   adoption,
            })
        }
    }

    // Revenue trend
    revGrowth := h.weekOverWeekGrowth("revenue")
    if revGrowth < -20 {
        insights = append(insights, Insight{
            Severity: "critical",
            Category: "revenue",
            Title:    "Revenue declining sharply",
            Message:  fmt.Sprintf("Revenue dropped %.0f%% week-over-week.", revGrowth),
            Suggestion: "Check if a payment issue occurred. Review recent pricing changes or competitor activity.",
            Metric:   revGrowth,
        })
    }

    // ====== ANOMALY DETECTION (2-sigma) ======
    anomalyMetrics := []string{"dau", "revenue", "readings", "new_users"}
    for _, m := range anomalyMetrics {
        anomaly := h.detectAnomaly(m)
        if anomaly != nil {
            insights = append(insights, *anomaly)
        }
    }

    // ====== CHURN RISK DISTRIBUTION ======
    churnRisk := h.getChurnRiskDistribution()

    // ====== WEEKLY DIGEST (Pazartesi gunu) ======
    weeklyDigest := []Insight{}
    if time.Now().Weekday() == time.Monday {
        weeklyDigest = h.generateWeeklyDigest()
    }

    response := map[string]interface{}{
        "insights":     insights,
        "churn_risk":   churnRisk,
        "weekly_digest": weeklyDigest,
        "generated_at": time.Now(),
    }
    c.JSON(200, gin.H{"success": true, "data": response})
}

type Insight struct {
    Severity   string  `json:"severity"`    // critical, warning, info, opportunity, positive
    Category   string  `json:"category"`    // retention, monetization, product, growth, revenue
    Title      string  `json:"title"`
    Message    string  `json:"message"`
    Suggestion string  `json:"suggestion"`
    Metric     float64 `json:"metric"`
}

// Anomaly detection: son 30 gunun ort + stddev, bugunki deger 2 sigma disinda mi?
func (h *Handler) detectAnomaly(metricName string) *Insight {
    var avg, stddev, today float64
    h.DB.QueryRow(`
        SELECT AVG(metric_value), STDDEV(metric_value)
        FROM daily_metrics
        WHERE metric_name = $1 AND dimension IS NULL
        AND date BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE - 1
    `, metricName).Scan(&avg, &stddev)

    h.DB.QueryRow(`
        SELECT metric_value FROM daily_metrics
        WHERE metric_name = $1 AND dimension IS NULL AND date = CURRENT_DATE
    `, metricName).Scan(&today)

    if stddev == 0 { return nil }

    zScore := (today - avg) / stddev
    if zScore > 2 {
        return &Insight{
            Severity: "info", Category: "anomaly",
            Title:   fmt.Sprintf("Unusual spike in %s", metricName),
            Message: fmt.Sprintf("Today's %s (%.0f) is %.1f standard deviations above the 30-day average (%.0f).", metricName, today, zScore, avg),
            Suggestion: "Investigate the cause — this could be a viral moment, marketing effect, or data issue.",
        }
    }
    if zScore < -2 {
        return &Insight{
            Severity: "warning", Category: "anomaly",
            Title:   fmt.Sprintf("Unusual drop in %s", metricName),
            Message: fmt.Sprintf("Today's %s (%.0f) is %.1f standard deviations below the 30-day average (%.0f).", metricName, today, zScore, avg),
            Suggestion: "Check for server issues, app crashes, or external factors affecting usage.",
        }
    }
    return nil
}

// Churn Risk Scoring (per user)
type ChurnRiskBucket struct {
    Label string `json:"label"`  // "Low (0-30)", "Medium (31-60)", etc.
    Count int    `json:"count"`
    Percent float64 `json:"percent"`
}

func (h *Handler) getChurnRiskDistribution() []ChurnRiskBucket {
    // Churn risk skoru hesapla:
    // last_active > 3 gun → +20
    // tokens = 0 → +25
    // hic purchase yok → +15
    // son reading > 7 gun → +15
    // streak kirik → +10
    // tek feature denenmis → +15
    rows, _ := h.DB.Query(`
        SELECT
            CASE
                WHEN score <= 30 THEN 'Low (0-30)'
                WHEN score <= 60 THEN 'Medium (31-60)'
                WHEN score <= 80 THEN 'High (61-80)'
                ELSE 'Critical (81-100)'
            END as bucket,
            COUNT(*) as cnt
        FROM (
            SELECT u.id,
                LEAST(100,
                    CASE WHEN last_active_at < NOW() - INTERVAL '3 days' THEN 20 ELSE 0 END +
                    CASE WHEN tokens = 0 THEN 25 ELSE 0 END +
                    CASE WHEN NOT EXISTS(SELECT 1 FROM transactions t WHERE t.user_id=u.id AND t.type='purchase') THEN 15 ELSE 0 END +
                    CASE WHEN NOT EXISTS(SELECT 1 FROM readings r WHERE r.user_id=u.id AND r.created_at > NOW()-INTERVAL '7 days') THEN 15 ELSE 0 END +
                    CASE WHEN EXISTS(SELECT 1 FROM user_streaks s WHERE s.user_id=u.id AND s.last_claim_date < CURRENT_DATE-1) THEN 10 ELSE 0 END +
                    CASE WHEN (SELECT COUNT(DISTINCT type) FROM readings r WHERE r.user_id=u.id) <= 1 THEN 15 ELSE 0 END
                ) as score
            FROM users u WHERE u.role = 'user'
        ) scored
        GROUP BY bucket ORDER BY bucket
    `)
    // ... parse rows into ChurnRiskBucket slice
}
```

---

## ADIM 5 — Mobile App: Event Tracking Service

### 5.1 src/services/eventTracker.ts (YENI DOSYA)

```typescript
// Event batch sistemi — cihazda biriktirir, toplu gonderir

interface TrackEvent {
  event_type: string;
  event_data?: Record<string, any>;
  screen?: string;
  timestamp: string;
}

class EventTracker {
  private queue: TrackEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private platform: string;
  private appVersion: string;

  init(platform: string, appVersion: string) {
    this.platform = platform;
    this.appVersion = appVersion;
    // Her 30 saniyede flush
    this.flushInterval = setInterval(() => this.flush(), 30_000);
  }

  track(eventType: string, data?: Record<string, any>, screen?: string) {
    this.queue.push({
      event_type: eventType,
      event_data: data,
      screen,
      timestamp: new Date().toISOString(),
    });
    // 100 event biriktiyse hemen gonder
    if (this.queue.length >= 100) this.flush();
  }

  async flush() {
    if (this.queue.length === 0) return;
    const batch = [...this.queue];
    this.queue = [];
    try {
      await apiFetch('/api/v1/events', {
        method: 'POST',
        body: JSON.stringify({
          events: batch.map(e => ({
            ...e,
            platform: this.platform,
            app_version: this.appVersion,
          })),
        }),
      });
    } catch {
      // Basarisiz olursa kuyruga geri koy
      this.queue.unshift(...batch);
    }
  }

  // App background'a gecince cagir
  onBackground() { this.flush(); }

  destroy() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flush();
  }
}

export const tracker = new EventTracker();
```

### 5.2 src/services/sessionTracker.ts (YENI DOSYA)

```typescript
// AppState listener ile oturum yonetimi
import { AppState } from 'react-native';

class SessionTracker {
  private sessionId: string | null = null;
  private startTime: Date | null = null;

  init() {
    AppState.addEventListener('change', this.handleAppState);
    this.startSession();
  }

  private handleAppState = (state: string) => {
    if (state === 'active') this.startSession();
    if (state === 'background' || state === 'inactive') this.endSession();
  };

  private async startSession() {
    const res = await apiFetch('/api/v1/sessions/start', { method: 'POST', ... });
    this.sessionId = res.session_id;
    this.startTime = new Date();
    tracker.track('session_start');
  }

  private async endSession() {
    if (!this.sessionId) return;
    await apiFetch(`/api/v1/sessions/end`, { method: 'PUT', body: { session_id: this.sessionId } });
    tracker.track('session_end', { duration_seconds: diffSeconds(this.startTime, new Date()) });
    tracker.onBackground(); // event'leri de gonder
    this.sessionId = null;
  }
}

export const sessionTracker = new SessionTracker();
```

### 5.3 Ekranlarda Event Ekleme

Her ekranda `useEffect` ile `screen_view` event'i:

```typescript
// Ornek: DreamInterpretationScreen.tsx
useEffect(() => {
  tracker.track('screen_view', { screen: 'DreamInterpretation' }, 'DreamInterpretation');
}, []);

// Feature baslangici
const handleStart = () => {
  tracker.track('feature_tap', { feature: 'dream' }, 'DreamInterpretation');
  // ... mevcut kod
};

// Feature tamamlanma
const handleComplete = () => {
  tracker.track('feature_complete', { feature: 'dream', tokens_used: 15 }, 'DreamInterpretation');
  // ... mevcut kod
};

// Token yetersiz
if (tokens < cost) {
  tracker.track('token_insufficient', { feature: 'dream', needed: 15, had: tokens }, 'DreamInterpretation');
}
```

### 5.4 Milestone Ekleme

```typescript
// Ornek: Ilk reading tamamlaninca
const handleFirstReading = () => {
  const totalReadings = useStore.getState().user?.total_readings || 0;
  if (totalReadings === 0) {
    apiFetch('/api/v1/milestones', {
      method: 'POST',
      body: JSON.stringify({ milestone: 'first_reading', metadata: { type: 'dream' } }),
    }).catch(() => {}); // fire-and-forget
  }
};
```

---

## ADIM 6 — Admin Panel: Analytics Sayfasi (6 Alt Sekme)

### 6.1 Dosya Yapisi

```
web-panel/app/(dashboard)/analytics/
  page.tsx               — Ana sayfa (tab navigation + Overview icerik)
  users/page.tsx         — Cohort + Segments
  revenue/page.tsx       — LTV, ARPU, Token ekonomisi
  features/page.tsx      — Feature adoption board
  funnels/page.tsx       — Gorsel funnel'lar
  insights/page.tsx      — AI Insights + Anomali + Churn Risk

web-panel/components/analytics/
  KPICard.tsx            — Deger + trend + degisim %
  SparkChart.tsx         — Mini 30-gun trend cizgisi
  HealthScore.tsx        — Dairesel gauge (0-100)
  CohortTable.tsx        — Renk skali retention tablosu
  SegmentCard.tsx        — Segment bilgi karti
  FeatureBar.tsx         — Yatay progress bar + metrikler
  FunnelChart.tsx        — Dikey funnel gorsellestime
  InsightCard.tsx        — Severity-based insight karti
  ChurnRiskChart.tsx     — Risk dagilim grafigi
  TokenEconomyChart.tsx  — Minted vs Spent gorsel
  PackageTable.tsx       — Paket performans tablosu
```

### 6.2 Overview Tab (page.tsx)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Overview] [Users] [Revenue] [Features] [Funnels] [AI Insights]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Health Score ─┐  ┌─ DAU ──────┐  ┌─ WAU ──────┐  ┌─ MAU ─┐│
│  │     ╭───╮      │  │   1,234    │  │   3,421    │  │  8,762 ││
│  │    │ 74 │      │  │   ↑ 12%    │  │   ↑ 5%     │  │  ↑ 3% ││
│  │     ╰───╯      │  │   ~~~~~~~~ │  │   ~~~~~~~~ │  │  ~~~~~~││
│  └────────────────┘  └────────────┘  └────────────┘  └────────┘│
│                                                                  │
│  ┌─ ARPU ─────────┐  ┌─ Avg Session ─┐  ┌─ Churn ─┐  ┌─Revenue│
│  │   ₺12.34      │  │   4m 32s      │  │   8.2%  │  │ ₺45,678│
│  │   ↑ 8%        │  │   ↑ 15s       │  │   ↓ 2%  │  │ ↑ 18%  │
│  │   ~~~~~~~~    │  │   ~~~~~~~~    │  │   ~~~~~~ │  │ ~~~~~~~ │
│  └────────────────┘  └───────────────┘  └─────────┘  └─────────│
│                                                                  │
│  Period: [7d] [30d] [90d]                                       │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Users Tab

```
┌──────────────────────────────────────────────────────────────────┐
│  COHORT RETENTION                                                │
│  ──────────────────────────────────────────                     │
│            D1      D7      D14     D30     D60                  │
│  Mar '26   45%■    —       —       —       —                    │
│  Feb '26   42%■    28%■    19%■    —       —                    │
│  Jan '26   38%■    25%■    17%■    11%■    —                    │
│  Dec '25   41%■    27%■    18%■    12%■    8%■                  │
│  Nov '25   36%■    22%■    14%■    9%■     6%■                  │
│                                                                  │
│  ■ = renk yogunlugu (koyu yesil → kirmizi)                     │
├──────────────────────────────────────────────────────────────────┤
│  USER SEGMENTS                                                   │
│                                                                  │
│  ┌─ New (0-3d) ────┐  ┌─ Active Free ──┐  ┌─ Dormant ────────┐│
│  │  234 users (12%) │  │  1,456 (32%)   │  │  876 (19%)       ││
│  │  "No reading yet"│  │  "3+/wk, no $" │  │  "7-30d away"    ││
│  │  Push: free read │  │  Show premium  │  │  Win-back camp.  ││
│  └──────────────────┘  └────────────────┘  └──────────────────┘│
│                                                                  │
│  ┌─ Churned ───────┐  ┌─ Whale ────────┐  ┌─ Power User ─────┐│
│  │  543 (12%)      │  │  89 (2%)       │  │  156 (3%)        ││
│  │  "30d+ away"    │  │  "100₺+/mo"    │  │  "10+ reads/wk"  ││
│  │  Last chance    │  │  VIP treatment │  │  Community lead   ││
│  └──────────────────┘  └────────────────┘  └──────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 Features Tab

```
┌──────────────────────────────────────────────────────────────────┐
│  FEATURE ADOPTION                               Period: [30d]    │
│  ──────────────────                                              │
│  Feature          Users    Adopt%   Trend   Compl%   Retention+  │
│  ────────────────────────────────────────────────────────────── │
│  AI Chat          3,421    78%      ↑ 5%    82%      +18%       │
│  ███████████████████████████████████████░░░░░░░░░░              │
│                                                                  │
│  Dream            2,156    49%      ↑ 12%   71%      +23%       │
│  █████████████████████████░░░░░░░░░░░░░░░░░░░░░                 │
│                                                                  │
│  Tarot             1,823   41%      ↓ 3%    65%      +15%       │
│  ██████████████████████░░░░░░░░░░░░░░░░░░░░░░░                  │
│                                                                  │
│  [Tiklayinca detay karti acilir — session suresi, token geliri, │
│   free/premium dagilimi, tekrar kullanim orani, ROI skoru]       │
│                                                                  │
│  COMPARISON MATRIX                                               │
│  ─────────────────                                               │
│  Feature    │ Usage │ Revenue │ Retention │ AI Cost │ ROI        │
│  AI Chat    │ ★★★★★ │ ★★★     │ ★★★★      │ Low     │ A         │
│  Coffee     │ ★★★   │ ★★★★    │ ★★★★★     │ Medium  │ A+        │
│  Synastry   │ ★     │ ★★★★★   │ ★★★★★     │ V.High  │ B         │
└──────────────────────────────────────────────────────────────────┘
```

### 6.5 Funnels Tab

```
┌──────────────────────────────────────────────────────────────────┐
│  ONBOARDING FUNNEL                                               │
│  ─────────────────                                               │
│  ████████████████████████████████████████████  App Open    100%  │
│  ████████████████████████████████████████      Name         87%  │
│  ███████████████████████████████████           Gender       82%  │
│  ██████████████████████████████                Birth Date   74%  │
│  ████████████████████████████                  Location     68%  │
│  █████████████████████████                     Complete     61%  │
│                                    ↑ 39% total drop-off         │
│                                                                  │
│  MONETIZATION FUNNEL                                             │
│  ──────────────────                                              │
│  ████████████████████████████████████████████  Feature Tap  100% │
│  █████████████████                             Token Wall   35%  │
│  ██████████                                    View Packs   22%  │
│  ██████                                        Select Pack  14%  │
│  ████                                          Purchase      9%  │
│                                                                  │
│  [Custom Funnel Builder ▼]                                       │
│  Select events: [dropdown] → [dropdown] → [dropdown] → [Build]  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.6 AI Insights Tab

```
┌──────────────────────────────────────────────────────────────────┐
│  INSIGHTS                                    Auto-refresh: 1h    │
│  ────────                                                        │
│  ┌─ CRITICAL ───────────────────────────────────────────────────┐│
│  │  High churn rate detected                                    ││
│  │  Churn rate is 16.2% (threshold: 15%). 298 users lost       ││
│  │  in the last 7 days.                                         ││
│  │                                                              ││
│  │  Suggestion: Launch a win-back campaign targeting            ││
│  │  dormant users. Consider push notifications.                 ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ OPPORTUNITY ────────────────────────────────────────────────┐│
│  │  Hidden gem: Coffee Fortune                                  ││
│  │  Used by 28% but D30 retention is +34% higher.              ││
│  │                                                              ││
│  │  Suggestion: Promote on home screen.                         ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  CHURN RISK DISTRIBUTION                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Low (0-30)      ████████████████████  2,341 (53%)          │ │
│  │  Medium (31-60)  ██████████            1,123 (25%)          │ │
│  │  High (61-80)    ██████                  678 (15%)          │ │
│  │  Critical (81+)  ███                     298 (7%)           │ │
│  │                                                              │ │
│  │  [Export Critical Users CSV]  [Launch Campaign]              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  WEEKLY DIGEST (Mondays)                                         │
│  ──────────────────────                                          │
│  [Haftalik ozet insight kartlari — otomatik hesaplanir]          │
└──────────────────────────────────────────────────────────────────┘
```

---

## ADIM 7 — main.go Route'lar

```go
// Event collection (authenticated users)
eventR := api.Group("/events")
eventR.Use(middleware.AuthRequired())
{
    eventR.POST("", h.PostEvents)
}

// Session tracking
sessionR := api.Group("/sessions")
sessionR.Use(middleware.AuthRequired())
{
    sessionR.POST("/start", h.StartSession)
    sessionR.PUT("/end", h.EndSession)
}

// Milestones
milestoneR := api.Group("/milestones")
milestoneR.Use(middleware.AuthRequired())
{
    milestoneR.POST("", h.CreateMilestone)
}

// Admin analytics (admin only)
analyticsR := adminR.Group("/analytics")
{
    analyticsR.GET("/overview", h.GetAnalyticsOverview)
    analyticsR.GET("/users", h.GetAnalyticsUsers)
    analyticsR.GET("/revenue", h.GetAnalyticsRevenue)
    analyticsR.GET("/features", h.GetAnalyticsFeatures)
    analyticsR.GET("/funnels", h.GetAnalyticsFunnels)
    analyticsR.GET("/insights", h.GetAnalyticsInsights)
}
```

---

## UYGULAMA SIRASI

```
FAZE 1 — Database + Backend Veri Toplama (Gun 1)
 1. schema.sql: 5 yeni tablo + 2 ALTER TABLE
 2. handlers/events.go: PostEvents (batch insert)
 3. handlers/sessions.go: StartSession, EndSession
 4. handlers/milestones.go: CreateMilestone
 5. main.go: event/session/milestone route'lari
 6. users.last_active_at guncelleme (auth middleware'de)

FAZE 2 — Aggregation Engine (Gun 1)
 7. handlers/analytics_cron.go: RunDailyAggregation
 8. main.go: cron job setup (03:00)
 9. Manuel calistirma endpoint: POST /api/v1/admin/analytics/run-aggregation

FAZE 3 — Admin Analytics API (Gun 2)
 10. handlers/admin_analytics.go: 6 endpoint
     - GetAnalyticsOverview (KPI + Health Score)
     - GetAnalyticsUsers (Cohort + Segments)
     - GetAnalyticsRevenue (LTV, ARPU, Token economy)
     - GetAnalyticsFeatures (Adoption, completion, retention impact)
     - GetAnalyticsFunnels (4 hazir funnel)
     - GetAnalyticsInsights (Rules + Anomaly + Churn Risk)

FAZE 4 — Admin Panel UI (Gun 2-3)
 11. web-panel/lib/api.ts: 6 analytics fetch fonksiyonu
 12. web-panel/components/analytics/: 11 component
 13. analytics/page.tsx: Overview (KPI + Health Score + Trend)
 14. analytics/users/page.tsx: Cohort + Segments
 15. analytics/revenue/page.tsx: Token economy + Paket performansi
 16. analytics/features/page.tsx: Feature adoption board + ROI matrix
 17. analytics/funnels/page.tsx: Gorsel funnel'lar
 18. analytics/insights/page.tsx: Insight kartlari + Churn Risk + Weekly Digest

FAZE 5 — Mobile Event Tracking (Gun 3)
 19. src/services/eventTracker.ts: batch event sistemi
 20. src/services/sessionTracker.ts: AppState listener
 21. src/services/api.ts: event/session/milestone endpoint'leri
 22. Ekranlara event ekleme (screen_view, feature_tap, feature_complete, token_insufficient vb.)
 23. Milestone tetikleyicileri (first_reading, first_purchase vb.)
 24. App.tsx: tracker.init() + sessionTracker.init()

FAZE 6 — Test + Polish (Gun 3)
 25. Manuel aggregation calistir + dashboard kontrol
 26. Event gonderimi test (batch, retry)
 27. Funnel verileri kontrol
 28. Insight rule'lari dogrula
```

---

## ONEMLI DOSYA YOLLARI

### Go Backend
```
C:\Users\okan\Downloads\kosmos-go-backend\
  migrations\schema.sql              ← 5 yeni tablo + ALTER'lar
  handlers\events.go                 ← YENI: PostEvents
  handlers\sessions.go               ← YENI: StartSession, EndSession
  handlers\milestones.go             ← YENI: CreateMilestone
  handlers\analytics_cron.go         ← YENI: RunDailyAggregation
  handlers\admin_analytics.go        ← YENI: 6 analytics endpoint
  main.go                            ← route'lar + cron setup
```

### Admin Panel
```
C:\Users\okan\Downloads\kosmos-astro-expo\web-panel\
  lib\api.ts                                  ← analytics fetch fonksiyonlari
  app\(dashboard)\analytics\page.tsx          ← Overview
  app\(dashboard)\analytics\users\page.tsx    ← Cohort + Segments
  app\(dashboard)\analytics\revenue\page.tsx  ← Token economy
  app\(dashboard)\analytics\features\page.tsx ← Feature adoption
  app\(dashboard)\analytics\funnels\page.tsx  ← Funnel gorsel
  app\(dashboard)\analytics\insights\page.tsx ← AI Insights
  components\analytics\*.tsx                  ← 11 component
```

### Mobile App
```
C:\Users\okan\Downloads\kosmos-astro-expo\
  src\services\eventTracker.ts     ← YENI: batch event sistemi
  src\services\sessionTracker.ts   ← YENI: oturum yonetimi
  src\services\api.ts              ← event/session/milestone endpoint'leri
  src\screens\*.tsx                ← event tracking ekleme
  App.tsx                          ← tracker + session init
```

---

## KRITIK NOTLAR (Claude icin)

- `events` tablosuna index'ler SART — yoksa aggregation sorulari yavaslar
- `daily_metrics` UNIQUE constraint'i upsert icin gerekli (ON CONFLICT DO UPDATE)
- Event batch max 100 item, rate limit 2/dk — DDoS korunmasi
- `last_active_at` her API call'da degil, session start'ta guncellenmeli (performans)
- Cron job `robfig/cron` paketi kullanir — `go get github.com/robfig/cron/v3`
- Retention hesaplama agir sorgu — sadece cron'da calis, canli endpoint'te `daily_metrics`'ten oku
- Mobile tracker `flush()` basarisiz olursa event'leri kuyruga geri koyar (kayip yok)
- Health Score formulu: agirliklar degisebilir, config'e almak iyi olur
- Anomaly detection: 30 gunluk veri biriktikten sonra anlamli olur, basa "Not enough data" goster
- Feature ROI skoru: retention etkisi en onemli faktör (churn azaltmak > gelir artirmak)
- Weekly Digest: sadece Pazartesi gunu hesaplanir, diger gunler son Pazartesi'nin sonucunu goster
- Admin panelde tab navigation: Next.js nested layout kullan (layout.tsx)
- Insight severity renkleri: critical=kirmizi, warning=turuncu, info=mavi, opportunity=mor, positive=yesil
- `str()` helper: Go'da `*string` olusturmak icin (dimension alanlarinda nil vs deger ayrimi)
