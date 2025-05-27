import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { AuditService } from '../../common/services/audit.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [],
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
