import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './services/email.service';
import { AuditService } from './services/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailService, AuditService, PrismaService],
  exports: [EmailService, AuditService],
})
export class CommonModule {}
