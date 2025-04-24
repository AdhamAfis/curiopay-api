import { Module } from '@nestjs/common';
import { IncomeController } from './income.controller';
import { IncomeService } from './income.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [IncomeController],
  providers: [IncomeService, PrismaService],
  exports: [IncomeService],
})
export class IncomeModule {} 