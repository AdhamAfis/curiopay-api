import { Module } from '@nestjs/common';
import { IncomeController } from './income.controller';
import { IncomeService } from './income.service';
import { IncomeRepository } from './income.repository';

@Module({
  controllers: [IncomeController],
  providers: [IncomeService, IncomeRepository],
  exports: [IncomeService, IncomeRepository],
})
export class IncomeModule {} 