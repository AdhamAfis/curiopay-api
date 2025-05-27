import { Test } from '@nestjs/testing';
import { EncryptionInterceptor } from '../encryption.interceptor';
import { EncryptionService } from '../../services/encryption.service';
import { mockExecutionContext } from '../../test/test-utils';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';

describe('EncryptionInterceptor', () => {
  let interceptor: EncryptionInterceptor;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EncryptionInterceptor,
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn((data) => `encrypted_${data}`),
            decrypt: jest.fn((data) => data.replace('encrypted_', '')),
          },
        },
      ],
    }).compile();

    interceptor = module.get<EncryptionInterceptor>(EncryptionInterceptor);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  describe('intercept', () => {
    it('should encrypt sensitive fields in request body', async () => {
      const request = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com', // not sensitive
          description: 'Test description',
        },
      };

      const context = mockExecutionContext(request);
      const next = { handle: () => of(null) };

      await interceptor.intercept(context, next);

      expect(request.body.firstName).toBe('encrypted_John');
      expect(request.body.lastName).toBe('encrypted_Doe');
      expect(request.body.email).toBe('john@example.com'); // unchanged
      expect(request.body.description).toBe('encrypted_Test description');
    });

    it('should decrypt sensitive fields in response', async () => {
      const response = {
        firstName: 'encrypted_John',
        lastName: 'encrypted_Doe',
        email: 'john@example.com', // not sensitive
        description: 'encrypted_Test description',
      };

      const context = mockExecutionContext({});
      const next = { handle: () => of(response) };

      const observable = await interceptor.intercept(context, next);
      const result = await firstValueFrom(observable);

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john@example.com'); // unchanged
      expect(result.description).toBe('Test description');
    });

    it('should handle nested objects', async () => {
      const request = {
        body: {
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          details: {
            description: 'Test description',
          },
        },
      };

      const context = mockExecutionContext(request);
      const next = { handle: () => of(null) };

      await interceptor.intercept(context, next);

      expect(request.body.user.firstName).toBe('encrypted_John');
      expect(request.body.user.lastName).toBe('encrypted_Doe');
      expect(request.body.details.description).toBe(
        'encrypted_Test description',
      );
    });

    it('should not encrypt already encrypted data', async () => {
      const request = {
        body: {
          firstName: 'encrypted_John', // already encrypted
          lastName: 'Doe', // not encrypted
        },
      };

      const context = mockExecutionContext(request);
      const next = { handle: () => of(null) };

      await interceptor.intercept(context, next);

      expect(request.body.firstName).toBe('encrypted_John'); // unchanged
      expect(request.body.lastName).toBe('encrypted_Doe'); // encrypted
    });

    it('should handle arrays in response', async () => {
      const response = [
        {
          firstName: 'encrypted_John',
          lastName: 'encrypted_Doe',
        },
        {
          firstName: 'encrypted_Jane',
          lastName: 'encrypted_Smith',
        },
      ];

      const context = mockExecutionContext({});
      const next = { handle: () => of(response) };

      const observable = await interceptor.intercept(context, next);
      const result = await firstValueFrom(observable);

      expect(result[0].firstName).toBe('John');
      expect(result[0].lastName).toBe('Doe');
      expect(result[1].firstName).toBe('Jane');
      expect(result[1].lastName).toBe('Smith');
    });

    it('should handle null values', async () => {
      const request = {
        body: {
          firstName: null,
          lastName: 'Doe',
        },
      };

      const context = mockExecutionContext(request);
      const next = { handle: () => of(null) };

      await interceptor.intercept(context, next);

      expect(request.body.firstName).toBeNull();
      expect(request.body.lastName).toBe('encrypted_Doe');
    });

    it('should encrypt sensitive data in the response', async () => {
      const data = { sensitiveField: 'test', normalField: 'normal' };
      const encryptedValue = 'encrypted';

      jest
        .spyOn(encryptionService, 'encrypt')
        .mockImplementation(() => Promise.resolve(encryptedValue));
      const next = { handle: () => of(data) };

      const observable = await interceptor.intercept(
        mockExecutionContext({}),
        next,
      );
      const result = await firstValueFrom(observable);

      expect(result).toEqual({
        sensitiveField: encryptedValue,
        normalField: 'normal',
      });
      expect(encryptionService.encrypt).toHaveBeenCalledWith('test');
    });
  });
});
