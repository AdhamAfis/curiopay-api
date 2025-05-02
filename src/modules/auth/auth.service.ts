import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { EnableMfaDto, VerifyMfaDto, DisableMfaDto } from './dto/mfa.dto';
import { OAuthUserDto } from './dto/oauth-user.dto';
import { User } from './interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../users/users.repository';
import { EncryptionService } from '../../common/services/encryption.service';
import { EmailService } from '../../common/services/email.service';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { CategoriesService } from '../categories/categories.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
    private emailService: EmailService,
    private categoriesService: CategoriesService,
    private paymentMethodsService: PaymentMethodsService,
  ) {}

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.usersService
      .findByEmail(loginDto.email)
      .catch(() => null);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user auth details
    const userAuth = await this.usersRepository.findUserAuthById(user.id);

    if (!userAuth) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      userAuth.password,
    );

    if (!isPasswordValid) {
      // Handle failed login attempt
      await this.handleFailedLoginAttempt(userAuth);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts
    if (userAuth.failedLoginAttempts > 0) {
      await this.usersRepository.updateUserAuth(user.id, {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lockedUntil: null,
      });
    }

    // Check if MFA is enabled
    if (userAuth.mfaEnabled) {
      // Generate a temporary login token valid for 5 minutes
      const tempToken = this.jwtService.sign(
        { 
          sub: user.id,
          email: user.email,
          tempAuth: true,
          rememberMe: (loginDto as any).rememberMe || false,
          exp: Math.floor(Date.now() / 1000) + 5 * 60 // 5 minutes
        }
      );

      return {
        requireMfa: true,
        tempToken,
        user: {
          id: user.id,
          email: user.email,
        },
      };
    }

    // Update last login time
    await this.usersRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Generate JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Determine token expiration based on rememberMe flag
    const expiresIn = (loginDto as any).rememberMe
      ? this.configService.get<string>('JWT_EXTENDED_EXPIRES_IN') || '30d'
      : this.configService.get<string>('JWT_EXPIRES_IN') || '1d';

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async completeLoginWithMfa(dto: { tempToken: string; code: string }) {
    try {
      // Verify the temporary token
      const payload = this.jwtService.verify(dto.tempToken);
      
      if (!payload.tempAuth) {
        throw new UnauthorizedException('Invalid temporary token');
      }

      const userId = payload.sub;
      const rememberMe = payload.rememberMe || false;
      
      // Validate MFA code
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify MFA code
      const isValidMfa = await this.verifyMfaCode(userId, dto.code);
      if (!isValidMfa) {
        throw new UnauthorizedException('Invalid MFA code');
      }
      
      // Update last login time
      await this.usersRepository.update(userId, {
        lastLoginAt: new Date(),
      });

      // Generate actual JWT token
      const tokenPayload = {
        sub: userId,
        email: user.email,
        role: user.role,
      };

      // Determine token expiration based on rememberMe flag
      const expiresIn = rememberMe
        ? this.configService.get<string>('JWT_EXTENDED_EXPIRES_IN') || '30d'
        : this.configService.get<string>('JWT_EXPIRES_IN') || '1d';

      return {
        accessToken: this.jwtService.sign(tokenPayload, { expiresIn }),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('MFA verification time expired, please login again');
      }
      throw error;
    }
  }

  // Helper method to verify MFA code, including backup codes
  private async verifyMfaCode(userId: string, code: string): Promise<boolean> {
    const userAuth = await this.usersRepository.findUserAuthById(userId);
    
    if (!userAuth || !userAuth.mfaEnabled || !userAuth.mfaSecret) {
      return false;
    }

    const secret = await this.encryptionService.decrypt(userAuth.mfaSecret);

    const isValid = authenticator.verify({
      token: code,
      secret,
    });

    if (isValid) {
      return true;
    }

    // Check if it's a valid backup code
    return this.verifyAndConsumeBackupCode(userId, code);
  }

  private async handleFailedLoginAttempt(userAuth: any) {
    const maxAttempts = 5;
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds

    const newFailedAttempts = userAuth.failedLoginAttempts + 1;
    const updateData: any = {
      failedLoginAttempts: newFailedAttempts,
      lastFailedLoginAt: new Date(),
    };

    // Lock account if max attempts reached
    if (newFailedAttempts >= maxAttempts) {
      const lockUntil = new Date(Date.now() + lockoutDuration);
      updateData.lockedUntil = lockUntil;
    }

    await this.usersRepository.updateUserAuth(userAuth.userId, updateData);
  }

  async validateCredentials(email: string, password: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException();
    }

    const userAuth = await this.usersRepository.findUserAuthById(user.id);
    if (!userAuth) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await bcrypt.compare(password, userAuth.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async signup(signupDto: any) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(signupDto.password, salt);
      
      const user = await this.usersRepository.create({
        email: signupDto.email,
        firstName: await this.encryptionService.encrypt(signupDto.firstName),
        lastName: await this.encryptionService.encrypt(signupDto.lastName),
        role: 'USER',
        isActive: true,
        auth: {
          create: {
            password: hashedPassword,
            passwordSalt: salt,
          },
        },
      });

      const payload = {
        sub: user.id,
        email: user.email,
      };

      return {
        accessToken: this.jwtService.sign(payload, { expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '1d' }),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      throw new Error('Failed to create user');
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const existingUser = await this.usersService
        .findByEmail(registerDto.email)
        .catch(() => null);

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      // Generate salt and hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(registerDto.password, salt);

      const user = await this.usersRepository.create({
        email: registerDto.email,
        firstName: await this.encryptionService.encrypt(registerDto.firstName),
        lastName: await this.encryptionService.encrypt(registerDto.lastName),
        auth: {
          create: {
            password: hashedPassword,
            passwordSalt: salt,
          },
        },
      });

      // Seed default categories for the new user
      await this.categoriesService.seedUserDefaultCategories(user.id);
      
      // Seed default payment methods for the new user
      await this.paymentMethodsService.seedUserDefaultPaymentMethods(user.id);

      // Generate email verification token and send verification email
      const token = crypto.randomBytes(32).toString('hex');
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 24); // Token expires in 24 hours

      // Store token in database
      await this.usersRepository.updateUserAuth(user.id, {
        emailVerificationToken: token,
        emailVerificationTokenExpiry: expiration,
      });

      // Send verification email
      await this.emailService.sendEmailVerificationLink(user.email, token);

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      return {
        accessToken: this.jwtService.sign(payload, { expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '1d' }),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      throw new Error('Failed to create user');
    }
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.usersService
      .findByEmail(dto.email)
      .catch(() => null);

    if (!user) {
      // Return success even if user not found for security
      return { message: 'If your email is registered, you will receive a password reset link' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresIn = 3600000; // 1 hour in milliseconds

    await this.usersRepository.updateUserAuth(user.id, {
      passwordResetToken: token,
      passwordResetExpires: new Date(Date.now() + expiresIn),
    });

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, token);

    return { 
      message: 'Password reset instructions sent to your email',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const userAuth = await this.usersRepository.findUserAuthByResetToken(dto.token);

    if (!userAuth || !userAuth.passwordResetExpires || userAuth.passwordResetExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    await this.usersRepository.updateUserAuth(userAuth.userId, {
      password: hashedPassword,
      passwordSalt: salt,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastPasswordChange: new Date(),
    });

    return { message: 'Password successfully reset' };
  }

  async generateMfaSecret(userId: string) {
    const secret = authenticator.generateSecret();
    const user = await this.usersService.findOne(userId);
    
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'CurioPay',
      secret
    );

    // Store the secret temporarily (not enabled yet)
    await this.usersRepository.updateUserAuth(userId, {
      mfaSecret: await this.encryptionService.encrypt(secret),
    });

    // Generate QR code
    const qrCodeUrl = await toDataURL(otpauthUrl);

    // Send MFA setup email
    await this.emailService.sendMfaSetupEmail(user.email, qrCodeUrl, secret);

    return {
      secret,
      qrCodeUrl,
    };
  }

  async enableMfa(userId: string, dto: EnableMfaDto) {
    const userAuth = await this.usersRepository.findUserAuthById(userId);
    
    if (!userAuth || !userAuth.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    const secret = await this.encryptionService.decrypt(userAuth.mfaSecret);

    const isValid = authenticator.verify({
      token: dto.code,
      secret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex'),
    );

    // Hash backup codes before storing
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10)),
    );

    await this.usersRepository.updateUserAuth(userId, {
      mfaEnabled: true,
      backupCodes: hashedBackupCodes,
    });

    return {
      message: 'MFA enabled successfully',
      backupCodes, // Show these to user only once
    };
  }

  async verifyMfa(userId: string, dto: VerifyMfaDto) {
    const userAuth = await this.usersRepository.findUserAuthById(userId);
    
    if (!userAuth) {
      throw new BadRequestException('User authentication not found');
    }

    if (!userAuth.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    if (!userAuth.mfaSecret) {
      throw new BadRequestException('MFA secret not found');
    }

    const secret = await this.encryptionService.decrypt(userAuth.mfaSecret);

    const isValid = authenticator.verify({
      token: dto.code,
      secret,
    });

    if (!isValid) {
      // Check if it's a valid backup code
      const isBackupCode = await this.verifyAndConsumeBackupCode(userId, dto.code);
      if (!isBackupCode) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    return { verified: true };
  }

  async disableMfa(userId: string, dto: DisableMfaDto) {
    if (!dto.confirm) {
      throw new BadRequestException('Please confirm MFA disable action');
    }

    const userAuth = await this.usersRepository.findUserAuthById(userId);
    
    if (!userAuth) {
      throw new BadRequestException('User authentication not found');
    }

    if (!userAuth.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    if (!userAuth.mfaSecret) {
      throw new BadRequestException('MFA secret not found');
    }

    const secret = await this.encryptionService.decrypt(userAuth.mfaSecret);

    const isValid = authenticator.verify({
      token: dto.code,
      secret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.usersRepository.updateUserAuth(userId, {
      mfaEnabled: false,
      mfaSecret: null,
      backupCodes: [],
    });

    return { message: 'MFA disabled successfully' };
  }

  private async verifyAndConsumeBackupCode(userId: string, code: string): Promise<boolean> {
    const userAuth = await this.usersRepository.findUserAuthById(userId);
    
    if (!userAuth || !userAuth.backupCodes) {
      return false;
    }
    
    for (let i = 0; i < userAuth.backupCodes.length; i++) {
      const isValid = await bcrypt.compare(code, userAuth.backupCodes[i]);
      if (isValid) {
        // Remove used backup code
        const updatedBackupCodes = [...userAuth.backupCodes];
        updatedBackupCodes.splice(i, 1);
        
        await this.usersRepository.updateUserAuth(userId, {
          backupCodes: updatedBackupCodes,
        });
        
        return true;
      }
    }
    
    return false;
  }

  async requestEmailVerification(dto: { email: string }) {
    const user = await this.usersService
      .findByEmail(dto.email)
      .catch(() => null);

    if (!user) {
      // Don't reveal that the email doesn't exist
      return { success: true, message: 'If your email exists, a verification link has been sent' };
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email is already verified' };
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 24); // Token expires in 24 hours

    // Store token in database
    await this.usersRepository.updateUserAuth(user.id, {
      emailVerificationToken: token,
      emailVerificationTokenExpiry: expiration,
    });

    // Send verification email
    await this.emailService.sendEmailVerificationLink(user.email, token);

    return {
      success: true,
      message: 'Verification link has been sent to your email',
    };
  }

  async verifyEmail(dto: { token: string }) {
    // Find user with this verification token
    const userAuth = await this.usersRepository.findUserAuthByVerificationToken(dto.token);

    if (!userAuth) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if token is expired
    if (!userAuth.emailVerificationTokenExpiry || userAuth.emailVerificationTokenExpiry < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    // Get the user
    const user = await this.usersService.findById(userAuth.userId);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email is already verified' };
    }

    // Update user to mark email as verified
    await this.usersRepository.update(user.id, {
      emailVerified: new Date(),
    });

    // Clear verification token
    await this.usersRepository.updateUserAuth(user.id, {
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
    });

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async validateOAuthUser(oauthUserDto: OAuthUserDto): Promise<User | null> {
    try {
      // Check if user exists with this email
      let user = await this.usersService
        .findByEmail(oauthUserDto.email)
        .catch(() => null);

      if (user) {
        // If user exists but was not created with this OAuth provider
        if (user.provider !== oauthUserDto.provider) {
          // We could throw an error here or handle account linking
          // For now, we'll just return the existing user
          return user as User;
        }

        // Update user profile if needed
        if (user.providerAccountId !== oauthUserDto.providerAccountId) {
          const updatedUser = await this.usersRepository.update(user.id, {
            providerAccountId: oauthUserDto.providerAccountId,
          });
          
          if (updatedUser) {
            user = updatedUser as any; // Type assertion to resolve circular type reference
          }
        }
      } else {
        // Create a random password for OAuth users
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        // Create new user with OAuth info
        const newUser = await this.usersRepository.create({
          email: oauthUserDto.email,
          firstName: await this.encryptionService.encrypt(oauthUserDto.firstName),
          lastName: oauthUserDto.lastName 
            ? await this.encryptionService.encrypt(oauthUserDto.lastName) 
            : null,
          provider: oauthUserDto.provider,
          providerAccountId: oauthUserDto.providerAccountId,
          emailVerified: new Date(), // OAuth emails are considered verified
          role: 'USER',
          isActive: true,
          auth: {
            create: {
              password: hashedPassword,
              passwordSalt: salt,
            },
          },
        });
        
        if (newUser) {
          user = newUser as any; // Type assertion to resolve circular type reference
          
          // Seed default categories for the new user
          await this.categoriesService.seedUserDefaultCategories(newUser.id);
          
          // Seed default payment methods for the new user
          await this.paymentMethodsService.seedUserDefaultPaymentMethods(newUser.id);
        }
      }

      // Update last login time
      if (user) {
        await this.usersRepository.update(user.id, {
          lastLoginAt: new Date(),
        });
      }

      return user as User;
    } catch (error) {
      throw new Error(`Failed to validate OAuth user: ${error.message}`);
    }
  }

  async googleLogin(user: User) {
    if (!user) {
      throw new UnauthorizedException('Google authentication failed');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'USER',
    };

    return {
      accessToken: this.jwtService.sign(payload, { 
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '1d' 
      }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || 'USER',
      },
    };
  }
}
