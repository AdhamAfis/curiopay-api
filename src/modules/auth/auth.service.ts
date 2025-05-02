import { Injectable, UnauthorizedException, BadRequestException, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { EnableMfaDto, VerifyMfaDto, DisableMfaDto } from './dto/mfa.dto';
import { OAuthUserDto } from './dto/oauth-user.dto';
import { LinkAccountDto } from './dto/link-account.dto';
import { User } from './interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../users/users.repository';
import { EncryptionService } from '../../common/services/encryption.service';
import { EmailService } from '../../common/services/email.service';
import { AuditService } from '../../common/services/audit.service';
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
    private auditService: AuditService,
  ) {}

  async login(loginDto: LoginDto, ipAddress = 'unknown', userAgent = 'unknown') {
    // Find user by email
    const user = await this.usersService
      .findByEmail(loginDto.email)
      .catch(() => null);

    if (!user) {
      // Log failed login attempt
      await this.auditService.logAuth({
        userId: 'unknown',
        action: 'LOGIN',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: {
          reason: 'User not found',
          email: loginDto.email,
        },
      });
      
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user auth details
    const userAuth = await this.usersRepository.findUserAuthById(user.id);

    if (!userAuth) {
      // Log failed login attempt
      await this.auditService.logAuth({
        userId: user.id,
        action: 'LOGIN',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: {
          reason: 'User auth not found',
        },
      });
      
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
      
      // Log failed login attempt
      await this.auditService.logAuth({
        userId: user.id,
        action: 'LOGIN',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: {
          reason: 'Invalid password',
        },
      });
      
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

      // Log MFA required
      await this.auditService.logAuth({
        userId: user.id,
        action: 'LOGIN_MFA_REQUIRED',
        status: 'SUCCESS',
        ipAddress,
        userAgent,
        details: {
          rememberMe: (loginDto as any).rememberMe || false,
        },
      });

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
    
    // Log successful login
    await this.auditService.logAuth({
      userId: user.id,
      action: 'LOGIN',
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      details: {
        rememberMe: (loginDto as any).rememberMe || false,
      },
    });

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

  async completeLoginWithMfa(dto: { tempToken: string; code: string }, ipAddress = 'unknown', userAgent = 'unknown') {
    try {
      // Verify the temporary token
      const payload = this.jwtService.verify(dto.tempToken);
      
      if (!payload.tempAuth) {
        // Log failed MFA attempt
        await this.auditService.logAuth({
          userId: 'unknown',
          action: 'LOGIN_MFA_COMPLETE',
          status: 'FAILURE',
          ipAddress,
          userAgent,
          details: {
            reason: 'Invalid temporary token',
          },
        });
        
        throw new UnauthorizedException('Invalid temporary token');
      }

      const userId = payload.sub;
      const rememberMe = payload.rememberMe || false;
      
      // Validate MFA code
      const user = await this.usersService.findById(userId);
      if (!user) {
        // Log failed MFA attempt
        await this.auditService.logAuth({
          userId,
          action: 'LOGIN_MFA_COMPLETE',
          status: 'FAILURE',
          ipAddress,
          userAgent,
          details: {
            reason: 'User not found',
          },
        });
        
        throw new UnauthorizedException('User not found');
      }

      // Verify MFA code
      const isValidMfa = await this.verifyMfaCode(userId, dto.code);
      if (!isValidMfa) {
        // Log failed MFA attempt
        await this.auditService.logAuth({
          userId,
          action: 'LOGIN_MFA_COMPLETE',
          status: 'FAILURE',
          ipAddress,
          userAgent,
          details: {
            reason: 'Invalid MFA code',
          },
        });
        
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
      
      // Log successful MFA completion
      await this.auditService.logAuth({
        userId,
        action: 'LOGIN_MFA_COMPLETE',
        status: 'SUCCESS',
        ipAddress,
        userAgent,
        details: {
          rememberMe,
        },
      });

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
        // Log token expired
        await this.auditService.logAuth({
          userId: 'unknown',
          action: 'LOGIN_MFA_COMPLETE',
          status: 'FAILURE',
          ipAddress,
          userAgent,
          details: {
            reason: 'Token expired',
          },
        });
        
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

  async validateOAuthUser(oauthUserDto: OAuthUserDto, ipAddress = 'unknown', userAgent = 'unknown'): Promise<User | null> {
    let user: any = null;
    
    try {
      // Check if user exists with this email
      user = await this.usersService
        .findByEmail(oauthUserDto.email)
        .catch(() => null);

      if (user) {
        // If user exists but was not created with this OAuth provider,
        // we need to implement account linking
        if (user.provider !== oauthUserDto.provider) {
          // Link the OAuth account to the existing user
          const updatedUser = await this.usersRepository.update(user.id, {
            provider: oauthUserDto.provider,
            providerAccountId: oauthUserDto.providerAccountId,
            // We're not updating the password or other auth details
            // as the user might still want to login with their password
          });
          
          if (updatedUser) {
            user = updatedUser as any;
            
            // Log the account linking event
            const previousProvider = user?.provider || 'local';
            
            // Add to audit log
            await this.auditService.logAccountChange({
              userId: user.id,
              action: 'ACCOUNT_LINKING',
              status: 'SUCCESS',
              ipAddress,
              userAgent,
              details: {
                previousProvider,
                newProvider: oauthUserDto.provider,
                providerAccountId: oauthUserDto.providerAccountId,
                email: oauthUserDto.email,
                linkedAt: new Date()
              }
            });
          }

          return user as User;
        }

        // Update user profile if needed (for existing OAuth users)
        if (user.providerAccountId !== oauthUserDto.providerAccountId) {
          const updatedUser = await this.usersRepository.update(user.id, {
            providerAccountId: oauthUserDto.providerAccountId,
          });
          
          if (updatedUser) {
            user = updatedUser as any; // Type assertion to resolve circular type reference
            
            // Log provider account ID update
            await this.auditService.logAccountChange({
              userId: user.id,
              action: 'PROVIDER_ID_UPDATE',
              status: 'SUCCESS',
              ipAddress,
              userAgent,
              details: {
                provider: oauthUserDto.provider,
                oldProviderId: user.providerAccountId,
                newProviderId: oauthUserDto.providerAccountId
              }
            });
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
          
          // Log the new user creation
          await this.auditService.logAccountChange({
            userId: newUser.id,
            action: 'OAUTH_ACCOUNT_CREATION',
            status: 'SUCCESS',
            ipAddress,
            userAgent,
            details: {
              provider: oauthUserDto.provider,
              email: oauthUserDto.email,
              createdAt: new Date()
            }
          });
          
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
        
        // Log the OAuth login
        await this.auditService.logAuth({
          userId: user.id,
          action: 'OAUTH_LOGIN',
          status: 'SUCCESS',
          ipAddress,
          userAgent,
          details: {
            provider: oauthUserDto.provider,
            email: oauthUserDto.email,
            loginAt: new Date()
          }
        });
      }

      return user as User;
    } catch (error) {
      // Log the error
      if (user) {
        await this.auditService.logAuth({
          userId: user.id,
          action: 'OAUTH_LOGIN',
          status: 'FAILURE',
          ipAddress,
          userAgent,
          details: {
            provider: oauthUserDto.provider,
            email: oauthUserDto.email,
            error: error.message
          }
        });
      } else {
        await this.auditService.logAuth({
          userId: 'unknown',
          action: 'OAUTH_LOGIN',
          status: 'FAILURE',
          ipAddress,
          userAgent,
          details: {
            provider: oauthUserDto.provider,
            email: oauthUserDto.email,
            error: error.message
          }
        });
      }
      
      throw new Error(`Failed to validate OAuth user: ${error.message}`);
    }
  }

  async googleLogin(user: User, ipAddress = 'unknown', userAgent = 'unknown') {
    if (!user) {
      // Log the failed Google login
      await this.auditService.logAuth({
        userId: 'unknown',
        action: 'GOOGLE_LOGIN',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: {
          reason: 'User object is null or undefined'
        }
      });
      
      throw new UnauthorizedException('Google authentication failed');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'USER',
    };
    
    // Log the successful Google login
    await this.auditService.logAuth({
      userId: user.id,
      action: 'GOOGLE_LOGIN',
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      details: {
        email: user.email,
        loginAt: new Date()
      }
    });

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

  /**
   * Link a user account with an OAuth provider
   * This is used for manual linking (not during OAuth login)
   */
  async linkAccount(userId: string, linkAccountDto: LinkAccountDto, ipAddress = 'unknown', userAgent = 'unknown') {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      // Log the failed account linking
      await this.auditService.logAccountChange({
        userId,
        action: 'MANUAL_ACCOUNT_LINKING',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: {
          provider: linkAccountDto.provider,
          reason: 'User not found'
        }
      });
      
      throw new BadRequestException('User not found');
    }
    
    // Check if an account with the same provider already exists
    // This is to prevent linking an OAuth provider to multiple accounts
    const existingUser = await this.usersRepository.findByProviderAccount(
      linkAccountDto.provider, 
      linkAccountDto.providerAccountId
    ).catch(() => null);
    
    if (existingUser && existingUser.id !== userId) {
      // Log the conflict
      await this.auditService.logAccountChange({
        userId,
        action: 'MANUAL_ACCOUNT_LINKING',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: {
          provider: linkAccountDto.provider,
          providerAccountId: linkAccountDto.providerAccountId,
          reason: 'Provider already linked to another account',
          conflictingUserId: existingUser.id
        }
      });
      
      throw new ConflictException('This provider account is already linked to another user');
    }
    
    // Validate the provider
    const validProviders = ['google', 'facebook', 'apple'];
    if (!validProviders.includes(linkAccountDto.provider)) {
      // Log the invalid provider
      await this.auditService.logAccountChange({
        userId,
        action: 'MANUAL_ACCOUNT_LINKING',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: {
          provider: linkAccountDto.provider,
          reason: 'Invalid provider'
        }
      });
      
      throw new BadRequestException('Invalid provider');
    }
    
    // In a real implementation, you might need to verify the OAuth token here
    // by making a request to the provider's API
    
    // Update user with the provider info
    const updatedUser = await this.usersRepository.update(userId, {
      provider: linkAccountDto.provider,
      providerAccountId: linkAccountDto.providerAccountId || null,
    });
    
    // Log the successful account linking
    await this.auditService.logAccountChange({
      userId,
      action: 'MANUAL_ACCOUNT_LINKING',
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      details: {
        provider: linkAccountDto.provider,
        providerAccountId: linkAccountDto.providerAccountId,
        linkedAt: new Date()
      }
    });
    
    return {
      success: true,
      message: `Account successfully linked with ${linkAccountDto.provider}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        provider: updatedUser.provider,
      }
    };
  }
  
  /**
   * Unlink a provider from a user account
   * Only allowed if the user has a password (can still login)
   */
  async unlinkProvider(userId: string, provider: string, ipAddress = 'unknown', userAgent = 'unknown') {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      // Log the failed provider unlinking
      await this.auditService.logAccountChange({
        userId,
        action: 'PROVIDER_UNLINK',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: {
          provider,
          reason: 'User not found'
        }
      });
      
      throw new BadRequestException('User not found');
    }
    
    // Make sure the provider matches what the user has set
    if (user.provider !== provider) {
      // Log the mismatch
      await this.auditService.logAccountChange({
        userId,
        action: 'PROVIDER_UNLINK',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: {
          requestedProvider: provider,
          actualProvider: user.provider,
          reason: 'Provider mismatch'
        }
      });
      
      throw new BadRequestException(`Your account is not linked with ${provider}`);
    }
    
    // Check if user has a password set (to ensure they can still login)
    const userAuth = await this.usersRepository.findUserAuthById(userId);
    
    if (!userAuth || !userAuth.password) {
      // Log the no password issue
      await this.auditService.logAccountChange({
        userId,
        action: 'PROVIDER_UNLINK',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: {
          provider,
          reason: 'No password set'
        }
      });
      
      throw new BadRequestException(
        'Cannot unlink provider because you don\'t have a password set. ' +
        'Please set a password first to ensure you can still log in.'
      );
    }
    
    // Update user to remove provider info
    const updatedUser = await this.usersRepository.update(userId, {
      provider: null,
      providerAccountId: null,
    });
    
    // Log the successful provider unlinking
    await this.auditService.logAccountChange({
      userId,
      action: 'PROVIDER_UNLINK',
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      details: {
        provider,
        unlinkedAt: new Date()
      }
    });
    
    return {
      success: true,
      message: `${provider} successfully unlinked from your account`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
      }
    };
  }

  /**
   * Generic OAuth login handler for all providers
   */
  async oauthLogin(user: User, ipAddress = 'unknown', userAgent = 'unknown') {
    if (!user) {
      // Log the failed OAuth login
      await this.auditService.logAuth({
        userId: 'unknown',
        action: 'OAUTH_LOGIN',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: {
          reason: 'User object is null or undefined'
        }
      });
      
      throw new UnauthorizedException('OAuth authentication failed');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'USER',
    };
    
    // Log the successful OAuth login
    await this.auditService.logAuth({
      userId: user.id,
      action: `${user.provider?.toUpperCase() || 'OAUTH'}_LOGIN`,
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      details: {
        email: user.email,
        provider: user.provider,
        loginAt: new Date()
      }
    });

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
