import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { EmailVerifiedGuard } from './email-verified.guard';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [JwtAuthGuard, EmailVerifiedGuard],
  exports: [JwtAuthGuard, EmailVerifiedGuard],
})
export class GuardsModule {} 