// Centralized, type-safe validation with zod. Error messages are TranslationKeys
// so the caller resolves them via t(). Replaces scattered manual if-checks.
import { z } from 'zod';
import type { TranslationKey } from '../localization/translations';

const msg = (key: TranslationKey) => key; // documents that messages are translation keys

// --- Reusable field schemas ---
export const emailSchema = z
  .string()
  .trim()
  .min(1, msg('fillAllFields'))
  .email(msg('invalidEmail'));

export const passwordSchema = z.string().min(6, msg('passwordTooShort'));

export const nicknameSchema = z.string().trim().min(3, msg('usernameTooShort'));

// --- Form schemas ---
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, msg('fillAllFields')),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    nickname: nicknameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: msg('passwordsNoMatch'),
    path: ['confirmPassword'],
  });

/** Validate `data` against `schema`; returns the first error's TranslationKey, or null if valid. */
export function firstError(schema: z.ZodTypeAny, data: unknown): TranslationKey | null {
  const result = schema.safeParse(data);
  if (result.success) return null;
  return (result.error.issues[0]?.message as TranslationKey) ?? 'fillAllFields';
}
