import { Test } from '@nestjs/testing';
import { EncryptionService } from '../encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-bytes-long!!';
    
    const module = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('encrypt', () => {
    it('should encrypt data', async () => {
      const data = 'sensitive data';
      const encrypted = await service.encrypt(data);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(data);
      expect(Buffer.from(encrypted, 'base64')).toBeDefined();
    });

    it('should encrypt different data to different values', async () => {
      const data1 = 'sensitive data 1';
      const data2 = 'sensitive data 2';

      const encrypted1 = await service.encrypt(data1);
      const encrypted2 = await service.encrypt(data2);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should encrypt same data to different values (due to salt)', async () => {
      const data = 'sensitive data';

      const encrypted1 = await service.encrypt(data);
      const encrypted2 = await service.encrypt(data);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data', async () => {
      const data = 'sensitive data';
      const encrypted = await service.encrypt(data);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(data);
    });

    it('should throw error for invalid encrypted data', async () => {
      const invalidData = 'invalid-base64-data';

      await expect(service.decrypt(invalidData))
        .rejects
        .toThrow('Decryption failed');
    });
  });

  describe('constructor', () => {
    it('should throw error if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() => new EncryptionService())
        .toThrow('ENCRYPTION_KEY environment variable must be set');
    });
  });
}); 