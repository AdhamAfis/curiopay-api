import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
  BinaryLike,
  CipherKey,
} from 'crypto';
import { promisify } from 'util';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 32;
  private readonly authTagLength = 16;

  constructor() {
    // Ensure encryption key is set
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable must be set');
    }
  }

  /**
   * Encrypts sensitive data
   * @param data - The data to encrypt
   * @returns The encrypted data as a base64 string
   */
  async encrypt(data: string): Promise<string> {
    try {
      // Generate a random salt
      const salt = randomBytes(this.saltLength);

      // Generate key using scrypt
      const key = (await promisify(scrypt)(
        process.env.ENCRYPTION_KEY as BinaryLike,
        salt,
        this.keyLength,
      )) as CipherKey;

      // Generate IV
      const iv = randomBytes(this.ivLength);

      // Create cipher
      const cipher = createCipheriv(this.algorithm, key, iv);

      // Encrypt the data
      const encryptedData = Buffer.concat([
        cipher.update(data, 'utf8'),
        cipher.final(),
      ]);

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine all components
      const combined = Buffer.concat([salt, iv, authTag, encryptedData]);

      // Return as base64 string
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypts encrypted data
   * @param encryptedData - The encrypted data as a base64 string
   * @returns The decrypted data
   */
  async decrypt(encryptedData: string): Promise<string> {
    try {
      // Convert base64 to buffer
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const salt = combined.subarray(0, this.saltLength);
      const iv = combined.subarray(
        this.saltLength,
        this.saltLength + this.ivLength,
      );
      const authTag = combined.subarray(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.authTagLength,
      );
      const encrypted = combined.subarray(
        this.saltLength + this.ivLength + this.authTagLength,
      );

      // Generate key using scrypt
      const key = (await promisify(scrypt)(
        process.env.ENCRYPTION_KEY as BinaryLike,
        salt,
        this.keyLength,
      )) as CipherKey;

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
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
