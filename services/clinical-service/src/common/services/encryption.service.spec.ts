import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  const DEMO_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64-char hex

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = DEMO_KEY;
    service = new EncryptionService();
  });

  it('should encrypt and decrypt a string correctly', () => {
    const originalText = 'Sensitive PHI Data';
    const encrypted = service.encrypt(originalText);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(originalText);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('should produce different ciphertexts for the same plaintext (IV randomness)', () => {
    const text = 'Same Text';
    const encrypted1 = service.encrypt(text);
    const encrypted2 = service.encrypt(text);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should throw error for invalid ciphertext', () => {
    expect(() => service.decrypt('invalid:format')).toThrow();
  });
});
