import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { UsersRepository } from '../../users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../../../common/services/encryption.service';
import { EmailService } from '../../../common/services/email.service';
import { BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

jest.mock('bcrypt');
jest.mock('crypto');

describe('AuthService - Registration and Password Reset', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let usersRepository: UsersRepository;
  let encryptionService: EncryptionService;
  let emailService: EmailService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    isActive: true,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findUserAuthById: jest.fn(),
            findUserAuthByResetToken: jest.fn(),
            updateUserAuth: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test.jwt.token'),
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
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
    encryptionService = module.get<EncryptionService>(EncryptionService);
    emailService = module.get<EmailService>(EmailService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    beforeEach(() => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('generated-salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    });

    it('should successfully register a new user', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersRepository, 'create').mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        firstName: 'encrypted_John',
        lastName: 'encrypted_Doe',
      });

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('accessToken', 'test.jwt.token');
      expect(result.user).toMatchObject({
        email: registerDto.email,
        firstName: expect.any(String),
        lastName: expect.any(String),
        role: 'USER',
      });
      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          firstName: expect.any(String),
          lastName: expect.any(String),
          role: 'USER',
          isActive: true,
          auth: {
            create: {
              password: 'hashed-password',
              passwordSalt: 'generated-salt',
            },
          },
        }),
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersRepository.create).not.toHaveBeenCalled();
    });

    it('should throw Error if user creation fails', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest
        .spyOn(usersRepository, 'create')
        .mockRejectedValue(new Error('Database error'));

      await expect(authService.register(registerDto)).rejects.toThrow(
        'Failed to create user',
      );
    });
  });

  describe('requestPasswordReset', () => {
    const resetDto = {
      email: 'test@example.com',
    };

    beforeEach(() => {
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: () => 'random-token',
      });
    });

    it('should generate reset token and send email for existing user', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      const result = await authService.requestPasswordReset(resetDto);

      expect(result).toEqual({
        message: 'Password reset instructions sent to your email',
      });
      expect(usersRepository.updateUserAuth).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          passwordResetToken: 'random-token',
          passwordResetExpires: expect.any(Date),
        }),
      );
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        'random-token',
      );
    });

    it('should return success message even if user not found (security)', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const result = await authService.requestPasswordReset(resetDto);

      expect(result).toEqual({
        message:
          'If your email is registered, you will receive a password reset link',
      });
      expect(usersRepository.updateUserAuth).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetDto = {
      token: 'valid-token',
      newPassword: 'NewPassword123!',
    };

    beforeEach(() => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('new-salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
    });

    it('should successfully reset password with valid token', async () => {
      const mockUserAuthWithToken = {
        ...mockUserAuth,
        passwordResetToken: 'valid-token',
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour from now
      };

      jest
        .spyOn(usersRepository, 'findUserAuthByResetToken')
        .mockResolvedValue(mockUserAuthWithToken);

      const result = await authService.resetPassword(resetDto);

      expect(result).toEqual({
        message: 'Password successfully reset',
      });
      expect(usersRepository.updateUserAuth).toHaveBeenCalledWith(
        mockUserAuthWithToken.userId,
        expect.objectContaining({
          password: 'new-hashed-password',
          passwordSalt: 'new-salt',
          passwordResetToken: null,
          passwordResetExpires: null,
          lastPasswordChange: expect.any(Date),
        }),
      );
    });

    it('should throw BadRequestException if token not found', async () => {
      jest
        .spyOn(usersRepository, 'findUserAuthByResetToken')
        .mockResolvedValue(null);

      await expect(authService.resetPassword(resetDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(usersRepository.updateUserAuth).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if token expired', async () => {
      const mockUserAuthWithExpiredToken = {
        ...mockUserAuth,
        passwordResetToken: 'valid-token',
        passwordResetExpires: new Date(Date.now() - 3600000), // 1 hour ago
      };

      jest
        .spyOn(usersRepository, 'findUserAuthByResetToken')
        .mockResolvedValue(mockUserAuthWithExpiredToken);

      await expect(authService.resetPassword(resetDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(usersRepository.updateUserAuth).not.toHaveBeenCalled();
    });
  });
});
