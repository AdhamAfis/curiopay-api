import { IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum RecurringPatternType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export class RecurringPatternDto {
  @IsEnum(RecurringPatternType)
  type: RecurringPatternType;

  @IsNumber()
  @Min(1)
  @Max(366)
  frequency: number;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
