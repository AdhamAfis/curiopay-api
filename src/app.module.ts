import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { IncomeModule } from './modules/income/income.module';
import { EncryptionModule } from './common/encryption.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { ExportModule } from './modules/export/export.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { GuardsModule } from './common/guards/guards.module';
import { ThrottlerGuard } from './common/guards/throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 1 minute cache TTL
      max: 100, // Maximum number of items in cache
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 30, // 30 requests per minute for regular endpoints
      },
      {
        name: 'medium',
        ttl: 60000 * 15, // 15 minutes
        limit: 100, // 100 requests per 15 minutes for most endpoints
      },
      {
        name: 'long',
        ttl: 60000 * 60, // 1 hour
        limit: 1000, // 1000 requests per hour overall
      },
      {
        name: 'sensitive',
        ttl: 60000 * 15, // 15 minutes
        limit: 5, // 5 requests per 15 minutes for sensitive operations
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    ExpensesModule,
    CategoriesModule,
    IncomeModule,
    EncryptionModule,
    NewsletterModule,
    ExportModule,
    PaymentMethodsModule,
    GuardsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useFactory: (reflector) => new JwtAuthGuard(reflector),
      inject: [Reflector],
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
