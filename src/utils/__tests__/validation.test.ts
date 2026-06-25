import { firstError, loginSchema, registerSchema } from '../validation';

describe('validation', () => {
  describe('loginSchema', () => {
    it('passes for a valid email + password', () => {
      expect(firstError(loginSchema, { email: 'a@b.com', password: 'x' })).toBeNull();
    });
    it('rejects an invalid email', () => {
      expect(firstError(loginSchema, { email: 'nope', password: 'x' })).toBe('invalidEmail');
    });
    it('rejects an empty email', () => {
      expect(firstError(loginSchema, { email: '', password: 'x' })).toBe('fillAllFields');
    });
  });

  describe('registerSchema', () => {
    const base = {
      email: 'a@b.com',
      nickname: 'okan',
      password: 'secret1',
      confirmPassword: 'secret1',
    };
    it('passes for valid registration data', () => {
      expect(firstError(registerSchema, base)).toBeNull();
    });
    it('rejects a short password', () => {
      expect(firstError(registerSchema, { ...base, password: '123', confirmPassword: '123' })).toBe(
        'passwordTooShort',
      );
    });
    it('rejects a short nickname', () => {
      expect(firstError(registerSchema, { ...base, nickname: 'ab' })).toBe('usernameTooShort');
    });
    it('rejects mismatched passwords', () => {
      expect(firstError(registerSchema, { ...base, confirmPassword: 'other1' })).toBe(
        'passwordsNoMatch',
      );
    });
  });
});
