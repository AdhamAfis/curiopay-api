import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 2, // 2 requests per minute
    }]),
    PrismaModule,
    UsersModule,
    AuthModule,
    ExpensesModule,
    CategoriesModule,
    IncomeModule,
    EncryptionModule,
    NewsletterModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useFactory: (reflector) => new JwtAuthGuard(reflector),
      inject: [Reflector],
    }
  ],
})
export class AppModule {}
