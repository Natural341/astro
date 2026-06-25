// Token Service - Ay Taşı (Token) yönetimi
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    TOKENS: 'user_tokens',
    IS_PREMIUM: 'user_is_premium',
};

const DEFAULT_TOKENS = 10;

class TokenService {
    private currentTokens: number = DEFAULT_TOKENS;
    private isPremium: boolean = false;
    private listeners: Set<() => void> = new Set();

    // Getters
    getCurrentTokens(): number {
        return this.currentTokens;
    }

    getIsPremium(): boolean {
        return this.isPremium;
    }

    // Yeterli token var mı kontrolü
    hasEnoughTokens(amount: number): boolean {
        // Premium kullanıcılar sınırsız token kullanabilir
        if (this.isPremium) return true;
        return this.currentTokens >= amount;
    }

    // Listener
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    // Servisi başlat
    async initialize(): Promise<void> {
        try {
            const [tokensStr, premiumStr] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.TOKENS),
                AsyncStorage.getItem(STORAGE_KEYS.IS_PREMIUM),
            ]);

            this.currentTokens = tokensStr ? parseInt(tokensStr, 10) : DEFAULT_TOKENS;
            this.isPremium = premiumStr === 'true';

            this.notifyListeners();
        } catch (error) {
            if (__DEV__) console.error('TokenService initialize error:', error);
        }
    }

    // Token kullan
    async useTokens(amount: number): Promise<boolean> {
        // Premium users don't consume tokens
        if (this.isPremium) {
            if (__DEV__) console.log('TokenService.useTokens: Premium user, skipping token deduction');
            return true;
        }

        // Check if enough tokens
        if (this.currentTokens < amount) {
            if (__DEV__) console.log(`TokenService.useTokens: Not enough tokens (${this.currentTokens} < ${amount})`);
            return false;
        }

        try {
            this.currentTokens -= amount;
            await AsyncStorage.setItem(STORAGE_KEYS.TOKENS, this.currentTokens.toString());
            this.notifyListeners();
            if (__DEV__) console.log(`TokenService.useTokens: Success, new balance: ${this.currentTokens}`);
            return true;
        } catch (error) {
            if (__DEV__) console.error('TokenService.useTokens error:', error);
            return false;
        }
    }

    // Token ekle
    async addTokens(amount: number): Promise<boolean> {
        try {
            this.currentTokens += amount;
            await AsyncStorage.setItem(STORAGE_KEYS.TOKENS, this.currentTokens.toString());
            this.notifyListeners();
            if (__DEV__) console.log(`TokenService.addTokens: Success, new balance: ${this.currentTokens}`);
            return true;
        } catch (error) {
            if (__DEV__) console.error('TokenService.addTokens error:', error);
            return false;
        }
    }

    // Premium aktif et
    async activatePremium(): Promise<boolean> {
        try {
            this.isPremium = true;
            await AsyncStorage.setItem(STORAGE_KEYS.IS_PREMIUM, 'true');
            this.notifyListeners();
            if (__DEV__) console.log('TokenService.activatePremium: Success');
            return true;
        } catch (error) {
            if (__DEV__) console.error('TokenService.activatePremium error:', error);
            return false;
        }
    }

    // Premium deaktif et
    async deactivatePremium(): Promise<boolean> {
        try {
            this.isPremium = false;
            await AsyncStorage.setItem(STORAGE_KEYS.IS_PREMIUM, 'false');
            this.notifyListeners();
            return true;
        } catch (error) {
            if (__DEV__) console.error('TokenService.deactivatePremium error:', error);
            return false;
        }
    }

    // Token'ları sıfırla (testing için)
    async reset(initialTokens: number = DEFAULT_TOKENS): Promise<void> {
        this.currentTokens = initialTokens;
        this.isPremium = false;
        await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.TOKENS, initialTokens.toString()),
            AsyncStorage.setItem(STORAGE_KEYS.IS_PREMIUM, 'false'),
        ]);
        this.notifyListeners();
    }
}

// Singleton instance
export const tokenService = new TokenService();
export default tokenService;
