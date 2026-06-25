// Daily Reward Service - Günlük ödül ve streak yönetimi
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    STREAK: 'daily_streak',
    LAST_CLAIM: 'daily_last_claim',
    HAS_CLAIMED_TODAY: 'daily_claimed_today',
};

// Config değerleri
const CONFIG = {
    DAILY_FREE_TOKENS: 5,
    MAX_DAILY_STREAK_BONUS: 10,
};

export interface DailyRewardResult {
    success: boolean;
    message: string;
    tokensEarned: number;
    newStreak: number;
}

class DailyRewardService {
    private hasClaimedToday: boolean = false;
    private currentStreak: number = 0;
    private lastClaimDate: Date | null = null;
    private listeners: Set<() => void> = new Set();

    // Getters
    getHasClaimedToday(): boolean {
        return this.hasClaimedToday;
    }

    getCurrentStreak(): number {
        return this.currentStreak;
    }

    getLastClaimDate(): Date | null {
        return this.lastClaimDate;
    }

    // Bugünkü bonus miktarı (streak bonusu ile)
    getTodayBonus(): number {
        const streakBonus = Math.min(this.currentStreak, CONFIG.MAX_DAILY_STREAK_BONUS);
        return CONFIG.DAILY_FREE_TOKENS + streakBonus;
    }

    // Yarınki bonus önizlemesi
    getTomorrowBonus(): number {
        const nextStreak = this.currentStreak + 1;
        const streakBonus = Math.min(nextStreak, CONFIG.MAX_DAILY_STREAK_BONUS);
        return CONFIG.DAILY_FREE_TOKENS + streakBonus;
    }

    // Kalan süre (bir sonraki ödüle)
    getTimeUntilNextReward(): number {
        if (!this.hasClaimedToday) {
            return 0;
        }

        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        return tomorrow.getTime() - now.getTime();
    }

    // Listener ekleme
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    // Servisi başlat
    async initialize(): Promise<void> {
        await this.loadState();
        await this.checkNewDay();
    }

    // State'i yükle
    private async loadState(): Promise<void> {
        try {
            const streakStr = await AsyncStorage.getItem(STORAGE_KEYS.STREAK);
            this.currentStreak = streakStr ? parseInt(streakStr, 10) : 0;

            const lastClaimStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_CLAIM);
            if (lastClaimStr) {
                this.lastClaimDate = new Date(lastClaimStr);
            }

            this.notifyListeners();
        } catch (error) {
            console.error('DailyRewardService loadState error:', error);
        }
    }

    // Yeni gün kontrolü
    private async checkNewDay(): Promise<void> {
        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (this.lastClaimDate) {
            const lastDate = new Date(
                this.lastClaimDate.getFullYear(),
                this.lastClaimDate.getMonth(),
                this.lastClaimDate.getDate()
            );
            const difference = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            if (difference === 0) {
                // Bugün zaten claim edilmiş
                this.hasClaimedToday = true;
            } else if (difference === 1) {
                // Dün claim edilmiş, streak devam ediyor
                this.hasClaimedToday = false;
            } else {
                // 1 günden fazla geçmiş, streak sıfırlanır
                this.currentStreak = 0;
                this.hasClaimedToday = false;
                await this.saveState();
            }
        } else {
            // İlk kez
            this.hasClaimedToday = false;
        }

        this.notifyListeners();
    }

    // Günlük ödülü talep et
    async claimDailyReward(): Promise<DailyRewardResult> {
        if (this.hasClaimedToday) {
            return {
                success: false,
                message: 'Bugünkü ödülünüzü zaten aldınız!',
                tokensEarned: 0,
                newStreak: this.currentStreak,
            };
        }

        try {
            const tokensToAdd = this.getTodayBonus();

            // Streak'i artır
            this.currentStreak++;
            this.hasClaimedToday = true;
            this.lastClaimDate = new Date();

            // State'i kaydet
            await this.saveState();

            this.notifyListeners();

            return {
                success: true,
                message: this.getRewardMessage(),
                tokensEarned: tokensToAdd,
                newStreak: this.currentStreak,
            };
        } catch (error) {
            console.error('❌ Daily reward claim error:', error);
            return {
                success: false,
                message: 'Bir hata oluştu, tekrar deneyin.',
                tokensEarned: 0,
                newStreak: this.currentStreak,
            };
        }
    }

    // State'i kaydet
    private async saveState(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.STREAK, this.currentStreak.toString());
            if (this.lastClaimDate) {
                await AsyncStorage.setItem(STORAGE_KEYS.LAST_CLAIM, this.lastClaimDate.toISOString());
            }
        } catch (error) {
            console.error('DailyRewardService saveState error:', error);
        }
    }

    // Ödül mesajı oluştur
    private getRewardMessage(): string {
        if (this.currentStreak >= 7) {
            return `🔥 Harika! ${this.currentStreak} gün seri! Ekstra bonus kazandın!`;
        } else if (this.currentStreak >= 3) {
            return `✨ Süper! ${this.currentStreak} gün seri devam ediyor!`;
        } else {
            return '🎁 Günlük ödülün alındı!';
        }
    }

    // Reset streak (testing için)
    async resetStreak(): Promise<void> {
        this.currentStreak = 0;
        this.hasClaimedToday = false;
        this.lastClaimDate = null;
        await AsyncStorage.multiRemove([STORAGE_KEYS.STREAK, STORAGE_KEYS.LAST_CLAIM]);
        this.notifyListeners();
    }
}

// Singleton instance
export const dailyRewardService = new DailyRewardService();
export default dailyRewardService;
