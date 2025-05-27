import { Test } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { EncryptionService } from '../../../common/services/encryption.service';
import { UnauthorizedException } from '@nestjs/common';
import { Role, DataEncryptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../users/users.repository';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let encryptionService: EncryptionService;
  let usersService: UsersService;
  let usersRepository: UsersRepository;

  const mockUser = {
    id: 'test-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: Role.USER,
    isActive: true,
    emailVerified: null,
    lastLoginAt: null,
    provider: null,
    providerAccountId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    securityLevel: 1,
    dataRegion: null,
    isDeleted: false,
    auth: {
      id: 'auth-id',
      password: 'hashed_password',
      passwordSalt: 'salt',
      passwordHashVersion: 1,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lastFailedLoginAttempt: null,
      lastFailedLoginAt: null,
      lockoutUntil: null,
      lockedUntil: null,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      backupCodes: [],
      lastPasswordChange: new Date(),
      userId: 'test-id',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      securityAuditLog: null,
    },
    contactInfo: {
      id: 'contact-id',
      firstName: 'Test',
      lastName: 'User',
      phone: null,
      userId: 'test-id',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatarUrl: null,
      encryptionStatus: DataEncryptionStatus.ENCRYPTED,
    },
    preferences: {
      id: 'pref-id',
      currencyId: 'usd',
      languageId: 'en',
      themeId: 'light',
      userId: 'test-id',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      monthlyBudget: null,
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            updateLastLogin: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            findUserAuthById: jest.fn(),
            updateUserAuth: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            userAuth: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback()),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'test.jwt.token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              switch (key) {
                case 'JWT_SECRET':
                  return 'test-secret';
                case 'JWT_EXPIRATION':
                  return '1h';
                default:
                  return null;
              }
            }),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn((data) => Promise.resolve(`encrypted_${data}`)),
            decrypt: jest.fn((data) =>
              Promise.resolve(data.replace('encrypted_', '')),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
  });

  describe('validateCredentials', () => {
    it('should return user if credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(mockUser);
      jest
        .spyOn(usersRepository, 'findUserAuthById')
        .mockResolvedValue(mockUser.auth);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateCredentials(email, password);
      expect(result).toBeDefined();
      expect(result.email).toBe(email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(null);

      await expect(
        service.validateCredentials('wrong@email.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(mockUser);
      jest
        .spyOn(usersRepository, 'findUserAuthById')
        .mockResolvedValue(mockUser.auth);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateCredentials('test@example.com', 'wrong_password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token for valid user', async () => {
      const loginDto = {
        email: mockUser.email,
        password: 'password123',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest
        .spyOn(usersRepository, 'findUserAuthById')
        .mockResolvedValue(mockUser.auth);
      jest
        .spyOn(usersRepository, 'updateUserAuth')
        .mockResolvedValue(mockUser.auth);
      jest.spyOn(usersRepository, 'update').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('test.jwt.token');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
    });
  });

  describe('signup', () => {
    const signupDto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should create new user and return access token', async () => {
      const hashedPassword = 'hashed_password';
      const salt = 'test-salt';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(salt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      jest.spyOn(usersRepository, 'create').mockResolvedValue({
        ...mockUser,
        email: signupDto.email,
        firstName: 'encrypted_John',
        lastName: 'encrypted_Doe',
      });

      jest
        .spyOn(encryptionService, 'encrypt')
        .mockImplementation((value) => Promise.resolve(`encrypted_${value}`));

      const result = await service.signup(signupDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('test.jwt.token');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(signupDto.email);
      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: signupDto.email,
          firstName: 'encrypted_John',
          lastName: 'encrypted_Doe',
          role: 'USER',
          isActive: true,
          auth: {
            create: {
              password: hashedPassword,
              passwordSalt: salt,
            },
          },
        }),
      );
    });

    it('should throw error if user creation fails', async () => {
      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.signup(signupDto)).rejects.toThrow(
        'Failed to create user',
      );
    });
  });
});
