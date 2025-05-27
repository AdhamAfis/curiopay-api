import { Module } from '@nestjs/common';
import { EmailVerifiedGuard } from './email-verified.guard';
import { ThrottlerGuard } from './throttler.guard';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EmailVerifiedGuard, ThrottlerGuard],
  exports: [EmailVerifiedGuard, ThrottlerGuard],
})
export class GuardsModule {}
