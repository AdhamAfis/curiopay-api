import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../users/users.repository';
import { EncryptionService } from '../../common/services/encryption.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
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
}
