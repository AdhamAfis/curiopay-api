import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { UsersRepository } from '../../users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../../../common/services/encryption.service';
import { EmailService } from '../../../common/services/email.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as bcrypt from 'bcrypt';

jest.mock('otplib');
jest.mock('qrcode');

describe('AuthService - MFA', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let usersRepository: UsersRepository;
  let encryptionService: EncryptionService;
  let emailService: EmailService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockUserAuth = {
    id: 'auth-id',
    userId: 'test-user-id',
    password: 'hashed_password',
    passwordSalt: 'salt',
    passwordHashVersion: 1,
    passwordResetToken: null,
    passwordResetExpires: null,
    failedLoginAttempts: 0,
    lastFailedLoginAt: null,
    lockedUntil: null,
    mfaEnabled: false,
    mfaSecret: null,
    backupCodes: [],
    lastPasswordChange: new Date(),
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    securityAuditLog: null,
  };

  const mockEnabledUserAuth = {
    ...mockUserAuth,
    mfaEnabled: true,
    mfaSecret: 'encrypted_test-secret',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            findUserAuthById: jest.fn().mockResolvedValue(mockUserAuth),
            updateUserAuth: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest
              .fn()
              .mockImplementation((val) => Promise.resolve(`encrypted_${val}`)),
            decrypt: jest
              .fn()
              .mockImplementation((val) =>
                Promise.resolve(val.replace('encrypted_', '')),
              ),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendMfaSetupEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
    encryptionService = module.get<EncryptionService>(EncryptionService);
    emailService = module.get<EmailService>(EmailService);
  });

  describe('generateMfaSecret', () => {
    it('should generate MFA secret and QR code', async () => {
      const mockSecret = 'test-secret';
      const mockQrCode = 'test-qr-code';

      (authenticator.generateSecret as jest.Mock).mockReturnValue(mockSecret);
      (authenticator.keyuri as jest.Mock).mockReturnValue('otpauth://test');

      const result = await authService.generateMfaSecret(mockUser.id);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(usersRepository.updateUserAuth).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          mfaSecret: expect.any(String),
        }),
      );
      expect(emailService.sendMfaSetupEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String),
        mockSecret,
      );
    });
  });

  describe('enableMfa', () => {
    const mockCode = '123456';

    beforeEach(() => {
      (authenticator.verify as jest.Mock).mockReturnValue(true);
    });

    it('should enable MFA when valid code is provided', async () => {
      const result = await authService.enableMfa(mockUser.id, {
        code: mockCode,
      });

      expect(result).toHaveProperty('message', 'MFA enabled successfully');
      expect(result).toHaveProperty('backupCodes');
      expect(result.backupCodes).toHaveLength(10);
      expect(usersRepository.updateUserAuth).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          mfaEnabled: true,
          backupCodes: expect.any(Array),
        }),
      );
    });

    it('should throw BadRequestException when MFA setup not initiated', async () => {
      jest
        .spyOn(usersRepository, 'findUserAuthById')
        .mockResolvedValueOnce(null);

      await expect(
        authService.enableMfa(mockUser.id, { code: mockCode }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when invalid code provided', async () => {
      (authenticator.verify as jest.Mock).mockReturnValue(false);

      await expect(
        authService.enableMfa(mockUser.id, { code: mockCode }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyMfa', () => {
    const mockCode = '123456';
    const mockEnabledUserAuth = {
      ...mockUserAuth,
      mfaEnabled: true,
      mfaSecret: 'encrypted_test-secret',
    };

    beforeEach(() => {
      (authenticator.verify as jest.Mock).mockReturnValue(true);
      jest
        .spyOn(usersRepository, 'findUserAuthById')
        .mockResolvedValue(mockEnabledUserAuth);
    });

    it('should verify valid MFA code', async () => {
      const result = await authService.verifyMfa(mockUser.id, {
        code: mockCode,
      });

      expect(result).toEqual({ verified: true });
    });

    it('should throw UnauthorizedException when invalid code provided', async () => {
      (authenticator.verify as jest.Mock).mockReturnValue(false);

      await expect(
        authService.verifyMfa(mockUser.id, { code: mockCode }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when MFA not enabled', async () => {
      jest.spyOn(usersRepository, 'findUserAuthById').mockResolvedValueOnce({
        ...mockUserAuth,
        mfaEnabled: false,
      });

      await expect(
        authService.verifyMfa(mockUser.id, { code: mockCode }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('disableMfa', () => {
    const mockCode = '123456';
    const mockEnabledUserAuth = {
      ...mockUserAuth,
      mfaEnabled: true,
      mfaSecret: 'encrypted_test-secret',
    };

    beforeEach(() => {
      (authenticator.verify as jest.Mock).mockReturnValue(true);
      jest
        .spyOn(usersRepository, 'findUserAuthById')
        .mockResolvedValue(mockEnabledUserAuth);
    });

    it('should disable MFA when valid code and confirmation provided', async () => {
      const result = await authService.disableMfa(mockUser.id, {
        code: mockCode,
        confirm: true,
      });

      expect(result).toEqual({ message: 'MFA disabled successfully' });
      expect(usersRepository.updateUserAuth).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          mfaEnabled: false,
          mfaSecret: null,
          backupCodes: [],
        }),
      );
    });

    it('should throw BadRequestException when confirmation not provided', async () => {
      await expect(
        authService.disableMfa(mockUser.id, { code: mockCode, confirm: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException when invalid code provided', async () => {
      (authenticator.verify as jest.Mock).mockReturnValue(false);

      await expect(
        authService.disableMfa(mockUser.id, { code: mockCode, confirm: true }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
