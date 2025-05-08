import { Module, forwardRef, Injectable, OnModuleInit } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserPreferencesController } from './user-preferences.controller';
import { UserPreferencesService } from './user-preferences.service';
import { UserPreferencesRepository } from './users-preferences.repository';
import { AuthModule } from '../auth/auth.module';

@Injectable()
export class PreferencesInitializer implements OnModuleInit {
  constructor(private userPreferencesRepository: UserPreferencesRepository) {}

  async onModuleInit() {
    console.log('Initializing default preferences...');
    try {
      await this.userPreferencesRepository.ensureDefaultsExist();
      console.log('Default preferences initialized successfully');
    } catch (error) {
      console.error('Failed to initialize default preferences:', error);
    }
  }
}

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback-secret-key-not-for-production',
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1d' },
      }),
    }),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController, UserPreferencesController],
  providers: [
    UsersService,
    UsersRepository,
    UserPreferencesService,
    UserPreferencesRepository,
    PreferencesInitializer,
  ],
  exports: [UsersService, UsersRepository], // Export for use in other modules like auth
})
export class UsersModule {}
