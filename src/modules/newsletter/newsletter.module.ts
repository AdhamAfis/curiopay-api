import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { AuditService } from '../../common/services/audit.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 2, // 2 requests per minute
    }]),
  ],
  controllers: [NewsletterController],
  providers: [
    NewsletterService,
    PrismaService,
    EmailService,
    AuditService,
    ConfigService,
  ],
  exports: [NewsletterService],
})
export class NewsletterModule {} 