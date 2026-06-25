// AI Service (Gemini & Local LLM)
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppConfig } from '../config/appConfig';

// --- CONFIGURATION ---
const USE_LOCAL_LLM = __DEV__ && !!process.env.EXPO_PUBLIC_LOCAL_LLM_URL;
const LOCAL_LLM_BASE = process.env.EXPO_PUBLIC_LOCAL_LLM_URL || (__DEV__ ? 'http://localhost:1234' : '');
const LOCAL_LLM_URL = `${LOCAL_LLM_BASE}/v1/chat/completions`;
const LOCAL_MODEL_NAME = 'deepseek-r1-distill-qwen-7b';
const LOCAL_WHISPER_URL = `${LOCAL_LLM_BASE}/v1/audio/transcriptions`;

// Cloud OpenAI-compatible LLM (e.g. Groq — free & fast). Used as the primary text
// engine when configured; falls back to Gemini on any error. Set in .env:
//   EXPO_PUBLIC_LLM_BASE_URL=https://api.groq.com/openai/v1
//   EXPO_PUBLIC_LLM_API_KEY=gsk_...
//   EXPO_PUBLIC_LLM_MODEL=llama-3.3-70b-versatile
const CLOUD_LLM_BASE = process.env.EXPO_PUBLIC_LLM_BASE_URL || '';
const CLOUD_LLM_KEY = process.env.EXPO_PUBLIC_LLM_API_KEY || '';
const CLOUD_LLM_MODEL = process.env.EXPO_PUBLIC_LLM_MODEL || 'llama-3.3-70b-versatile';
const USE_CLOUD_LLM = !!(CLOUD_LLM_BASE && CLOUD_LLM_KEY);

// Gemini Setup
const genAI = new GoogleGenerativeAI(AppConfig.geminiApiKey || '');
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Rate limiting configuration
const MAX_REQUESTS_PER_MINUTE = 30;
const MAX_TOKENS_PER_REQUEST = 2048;

// Rate limiter
const requestTimestamps: number[] = [];
const checkRateLimit = (): boolean => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const recentRequests = requestTimestamps.filter(ts => ts > oneMinuteAgo);
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) return false;
  requestTimestamps.push(now);
  return true;
};

// Generic AI chat
export const chatWithAI = async (message: string, context?: string): Promise<string> => {
  if (!checkRateLimit()) {
    throw new Error('Çok fazla istek. Lütfen bir süre bekleyin.');
  }

  const prompt = context ? `${context}\n\nKullanıcı: ${message}` : message;

  if (USE_LOCAL_LLM) {
    return chatWithLocalLLM(prompt);
  }
  if (USE_CLOUD_LLM) {
    try {
      return await chatWithCloudLLM(prompt);
    } catch (e) {
      if (__DEV__) console.warn('[CloudLLM] failed, falling back to Gemini:', (e as Error).message);
    }
  }
  return chatWithGemini(prompt);
};

// Cloud OpenAI-compatible chat (Groq / OpenRouter / any OpenAI-compatible endpoint)
const chatWithCloudLLM = async (prompt: string): Promise<string> => {
  const response = await fetch(`${CLOUD_LLM_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLOUD_LLM_KEY}`,
    },
    body: JSON.stringify({
      model: CLOUD_LLM_MODEL,
      messages: [
        { role: 'system', content: 'You are a warm, mystical assistant. Reply in the same language as the user.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: MAX_TOKENS_PER_REQUEST,
    }),
  });
  if (!response.ok) throw new Error(`Cloud LLM error: ${response.status}`);
  const data = await response.json();
  let content: string = data.choices?.[0]?.message?.content ?? '';
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (!content) throw new Error('Empty response');
  return content;
};

// Local LLM (OpenAI Compatible)
const chatWithLocalLLM = async (prompt: string): Promise<string> => {
  const response = await fetch(LOCAL_LLM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LOCAL_MODEL_NAME,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: MAX_TOKENS_PER_REQUEST,
    }),
  });

  if (!response.ok) {
    throw new Error(`LM Studio error: ${response.status}`);
  }

  const data = await response.json();
  let content: string = data.choices[0].message.content;
  // Clean DeepSeek/Reasoning models' <think> tags
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  return content;
};

// Gemini API
const chatWithGemini = async (prompt: string): Promise<string> => {
  try {
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: MAX_TOKENS_PER_REQUEST,
        temperature: 0.7,
      },
    });
    const response = await result.response;
    return response.text();
  } catch (error) {
    if (__DEV__) console.error('[Gemini] Error:', error);
    throw new Error('AI service did not respond. Please try again.');
  }
};

// ─── File URI → base64 (no expo-file-system needed) ───────────────────────────
const fileUriToBase64 = async (uri: string): Promise<{ base64: string; mimeType: string }> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// ─── Gemini Vision — image + optional caption ─────────────────────────────────
export const chatWithImage = async (
  imageUri: string,
  caption: string,
  systemPrompt: string,
): Promise<string> => {
  const { base64, mimeType } = await fileUriToBase64(imageUri);
  const result = await geminiModel.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: `${systemPrompt}\n\n${caption || 'Please analyze this image with cosmic insight. What do you see?'}` },
      ],
    }],
    generationConfig: { maxOutputTokens: MAX_TOKENS_PER_REQUEST, temperature: 0.8 },
  });
  return result.response.text();
};

// ─── Whisper transcription via LM Studio ─────────────────────────────────────
const transcribeWithWhisper = async (audioUri: string): Promise<string> => {
  const ext = audioUri.split('.').pop()?.toLowerCase() ?? 'm4a';
  const mimeType = ext === 'mp4' ? 'audio/mp4' : ext === 'wav' ? 'audio/wav' : 'audio/m4a';
  const formData = new FormData();
  formData.append('file', { uri: audioUri, type: mimeType, name: `voice.${ext}` } as any);
  formData.append('model', 'whisper'); // adjust to whatever Whisper model is loaded in LM Studio

  const response = await fetch(LOCAL_WHISPER_URL, { method: 'POST', body: formData });
  if (!response.ok) throw new Error(`Whisper error: ${response.status}`);
  const data = await response.json();
  return data.text as string;
};

// ─── Voice — local: Whisper → LLM │ remote: Gemini audio ────────────────────
export const chatWithVoice = async (
  audioUri: string,
  systemPrompt: string,
): Promise<string> => {
  if (USE_LOCAL_LLM) {
    // Step 1: transcribe with LM Studio Whisper
    const transcript = await transcribeWithWhisper(audioUri);
    if (__DEV__) console.log('[Voice] Transcript:', transcript);
    // Step 2: send transcript to local LLM
    return chatWithLocalLLM(`${systemPrompt}\n\n[Voice message from client]: "${transcript}"`);
  }

  // Gemini multimodal audio fallback
  const { base64, mimeType } = await fileUriToBase64(audioUri);
  const result = await geminiModel.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: `${systemPrompt}\n\nThis is a voice message from your client. Please listen carefully and respond as their astrologer.` },
      ],
    }],
    generationConfig: { maxOutputTokens: MAX_TOKENS_PER_REQUEST, temperature: 0.8 },
  });
  return result.response.text();
};

// ─── Rest of helpers ──────────────────────────────────────────────────────────
// ... Rest of the helper functions (interpretDream, etc.) remain the same wrapper calls
// They implicitly use chatWithAI, so they will use Local LLM if configured.

export const interpretDream = async (dreamDescription: string): Promise<string> => {
  const context = `Sen deneyimli bir rüya yorumcususun. Samimi ve mistik bir dille yorumla.`;
  return chatWithAI(dreamDescription, context);
};

export const interpretTarotCards = async (cards: any[], question?: string): Promise<string> => {
  const cardsDesc = JSON.stringify(cards);
  const context = `Tarot kartlarını yorumla: ${cardsDesc}. Soru: ${question || 'Genel'}.`;
  return chatWithAI(context);
};

export const interpretCoffeeFortune = async (desc: string): Promise<string> => {
  const context = `Kahve falı bak. Görülen semboller: ${desc}`;
  return chatWithAI(context);
};

export const interpretPalmReading = async (desc: string): Promise<string> => {
  const context = `El falı bak. Çizgiler: ${desc}`;
  return chatWithAI(context);
};

export const interpretFaceReading = async (desc: string): Promise<string> => {
  const context = `Yüz okuma analizi yap. Özellikler: ${desc}`;
  return chatWithAI(context);
};

export const generateDailyHoroscope = async (sign: string): Promise<any> => {
  const context = `${sign} burcu için günlük yorum JSON formatında: {general, love, career, health, luckyNumber, luckyColor}`;
  const res = await chatWithAI(context);
  try { return JSON.parse(res); } catch { return { general: res }; }
};

export const calculateNumerology = async (name: string, date: string): Promise<string> => {
  const context = `Numeroloji analizi: ${name}, ${date}`;
  return chatWithAI(context);
};

export const calculateSynastry = async (p1: any, p2: any): Promise<string> => {
  const context = `İlişki uyumu analizi: ${JSON.stringify(p1)} ve ${JSON.stringify(p2)}`;
  return chatWithAI(context);
};

// Soulmate portrait — image generation with text fallback
export const generateSoulmateImage = async (params: {
  birthDate: string;
  birthTime?: string;
  birthCity?: string;
  zodiacSign?: string;
  soulmateGender?: 'male' | 'female' | 'any';
}): Promise<{ imageUri: string; description: string; isTextFallback?: boolean }> => {
  const genderHint =
    params.soulmateGender === 'female'
      ? 'The soulmate figure should be feminine in appearance.'
      : params.soulmateGender === 'male'
      ? 'The soulmate figure should be masculine in appearance.'
      : '';

  const baseContext = `Born on ${params.birthDate}${params.birthTime ? ` at ${params.birthTime}` : ''}${params.birthCity ? ` in ${params.birthCity}` : ''}${params.zodiacSign ? ` (${params.zodiacSign})` : ''}. ${genderHint}`;

  // ── Image: Pollinations.ai (free, keyless, returns an actual sketch) ─────────
  // A deterministic seed keeps the same birth profile producing the same face.
  const genderWord =
    params.soulmateGender === 'female' ? 'feminine' :
    params.soulmateGender === 'male' ? 'masculine' : 'androgynous';
  const imgPrompt =
    `mystical black and white pencil sketch portrait of a ${genderWord} soulmate, ` +
    `single ethereal face, soft graphite shading, dreamy cosmic aura, fine art, ` +
    `high contrast, portrait orientation${params.zodiacSign ? `, ${params.zodiacSign} energy` : ''}`;
  let seed = 0;
  const seedSrc = `${params.birthDate}|${params.birthCity || ''}|${params.soulmateGender || ''}`;
  for (let i = 0; i < seedSrc.length; i++) seed = (Math.imul(31, seed) + seedSrc.charCodeAt(i)) | 0;
  const imageUri =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}` +
    `?width=512&height=640&nologo=true&model=flux&seed=${Math.abs(seed)}`;

  // ── Text: poetic portrait description via Gemini (best-effort) ───────────────
  let description = '';
  try {
    const textPrompt = `You are a mystical astrologer and cosmic artist. Based on the following astrological profile, write a vivid and enchanting portrait description of this person's soulmate — their energy, aura, spiritual essence and how they will make our person feel. Keep it under 160 words, deeply personal and poetic.

Astrological profile: ${baseContext}`;
    const textResult = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: textPrompt }] }],
      generationConfig: { maxOutputTokens: 400, temperature: 0.9 },
    });
    description = textResult.response.text();
  } catch (e) {
    if (__DEV__) console.warn('[Soulmate] text description failed:', (e as Error).message);
  }

  return { imageUri, description };
};
