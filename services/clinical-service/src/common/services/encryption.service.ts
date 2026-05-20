import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'node:crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required for PII protection. ' +
        'Set a 64-character hex string (32 bytes). ' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
    }
    this.key = Buffer.from(secret, 'hex');
    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
    }
  }

  /**
   * Encrypts plain text using AES-256-GCM.
   * Returns a colon-separated string: iv:authTag:encryptedContent
   */
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag().toString('hex');
      
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      throw new InternalServerErrorException('Data encryption failed');
    }
  }

  /**
   * Decrypts text using AES-256-GCM.
   */
  decrypt(encryptedText: string): string {
    try {
      const [ivHex, authTagHex, encryptedContent] = encryptedText.split(':');
      
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // If decryption fails, it might not be encrypted (e.g. legacy data)
      // or the key is wrong. For resilience, we return the original text if it's not in the format.
      if (!encryptedText.includes(':')) return encryptedText;
      throw new InternalServerErrorException('Data decryption failed');
    }
  }
}
