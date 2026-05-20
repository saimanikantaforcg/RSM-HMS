import { ValueTransformer } from 'typeorm';
import * as crypto from 'node:crypto';

/**
 * TypeORM ValueTransformer for automated AES-256-GCM encryption at rest.
 */
export class DataEncryptionTransformer implements ValueTransformer {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    // Note: Key must be 32 bytes (64 hex characters)
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required for PII protection. ' +
        'Set a 64-character hex string (32 bytes). ' +
        'Generate with: node -e "console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))"',
      );
    }
    this.key = Buffer.from(secret, 'hex');
  }

  /**
   * Encrypt data before saving to DB
   */
  to(value: string | null): string | null {
    if (!value) return value;
    
    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag().toString('hex');
      
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (e) {
      console.error('Encryption failed for field', e);
      return value;
    }
  }

  /**
   * Decrypt data after loading from DB
   */
  from(value: string | null): string | null {
    if (!value || !value.includes(':')) return value;
    
    try {
      const [ivHex, authTagHex, encryptedContent] = value.split(':');
      if (!ivHex || !authTagHex || !encryptedContent) return value;

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (e) {
      console.error('Decryption failed for field', e);
      return value;
    }
  }
}
