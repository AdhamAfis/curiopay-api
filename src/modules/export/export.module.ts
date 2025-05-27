import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  controllers: [ExportController],
  providers: [ExportService, PrismaService, EmailService, EncryptionService],
  exports: [ExportService],
})
export class ExportModule {}
