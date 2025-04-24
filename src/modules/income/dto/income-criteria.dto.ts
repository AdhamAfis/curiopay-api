import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class IncomeCriteriaDto {
  @ApiPropertyOptional({
    example: '2023-01-01',
    description: 'Filter incomes received on or after this date',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    example: '2023-12-31',
    description: 'Filter incomes received on or before this date',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({
    example: 'salary',
    description: 'Filter incomes by description (partial match)',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 10000,
    description: 'Filter incomes with minimum amount in cents',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({
    example: 500000,
    description: 'Filter incomes with maximum amount in cents',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({
    example: 'category-uuid',
    description: 'Filter incomes by category ID',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'payment-method-uuid',
    description: 'Filter incomes by payment method ID',
  })
  @IsUUID()
  @IsOptional()
  paymentMethodId?: string;
} 