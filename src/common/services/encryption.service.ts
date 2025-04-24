import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;

  constructor(private configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    // Derive a key using PBKDF2
    const salt = crypto.randomBytes(this.saltLength);
    this.key = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256');
  }

  /**
   * Encrypts sensitive data
   * @param text The text to encrypt
   * @returns Encrypted data in format: iv:authTag:salt:encryptedData (base64)
   */
  encrypt(text: string): string {
    if (!text) return text;

    const iv = crypto.randomBytes(this.ivLength);
    const salt = crypto.randomBytes(this.saltLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, salt and encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      salt,
      Buffer.from(encrypted, 'base64'),
    ]);

    return combined.toString('base64');
  }

  /**
   * Decrypts encrypted data
   * @param encryptedData The encrypted data in format: iv:authTag:salt:encryptedData (base64)
   * @returns Decrypted text
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) return encryptedData;

    try {
      const buffer = Buffer.from(encryptedData, 'base64');

      // Extract the IV, auth tag, salt and encrypted data
      const iv = buffer.subarray(0, this.ivLength);
      const authTag = buffer.subarray(
        this.ivLength,
        this.ivLength + this.tagLength,
      );
      const salt = buffer.subarray(
        this.ivLength + this.tagLength,
        this.ivLength + this.tagLength + this.saltLength,
      );
      const encrypted = buffer.subarray(
        this.ivLength + this.tagLength + this.saltLength,
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypts an object's sensitive fields
   * @param data Object containing data to encrypt
   * @param sensitiveFields Array of field names to encrypt
   * @returns Object with encrypted sensitive fields
   */
  encryptObject<T extends { [key: string]: any }>(
    data: T,
    sensitiveFields: (keyof T)[],
  ): T {
    const encrypted = { ...data };
    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(
          encrypted[field].toString(),
        ) as T[keyof T];
      }
    }
    return encrypted;
  }

  /**
   * Decrypts an object's encrypted fields
   * @param data Object containing encrypted data
   * @param encryptedFields Array of field names to decrypt
   * @returns Object with decrypted fields
   */
  decryptObject<T extends { [key: string]: any }>(
    data: T,
    encryptedFields: (keyof T)[],
  ): T {
    const decrypted = { ...data };
    for (const field of encryptedFields) {
      if (decrypted[field]) {
        decrypted[field] = this.decrypt(
          decrypted[field].toString(),
        ) as T[keyof T];
      }
    }
    return decrypted;
  }
}
