import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './services/email.service';
import { AuditService } from './services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheModule } from '@nestjs/cache-manager';

@Global()
@Module({
  imports: [
    ConfigModule,
    CacheModule.register({
      ttl: 60000, // 1 minute default TTL
    }),
  ],
  providers: [EmailService, AuditService, PrismaService],
  exports: [EmailService, AuditService, CacheModule],
})
export class CommonModule {}
