import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { EnableMfaDto, VerifyMfaDto, DisableMfaDto } from './dto/mfa.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../users/users.repository';
import { EncryptionService } from '../../common/services/encryption.service';
import { EmailService } from '../../common/services/email.service';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
    private emailService: EmailService,
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

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
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
        accessToken: this.jwtService.sign(payload),
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
    // Check if user already exists
    const existingUser = await this.usersService
      .findByEmail(registerDto.email)
      .catch(() => null);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(registerDto.password, salt);
      
      const user = await this.usersRepository.create({
        email: registerDto.email,
        firstName: await this.encryptionService.encrypt(registerDto.firstName),
        lastName: await this.encryptionService.encrypt(registerDto.lastName),
        role: 'USER', // Restrict to USER role only
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
        role: user.role,
      };

      return {
        accessToken: this.jwtService.sign(payload),
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
}
