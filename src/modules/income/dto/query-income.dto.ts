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

export class QueryIncomeDto {
  @ApiPropertyOptional({
    example: '2023-01-01',
    description: 'Start date for filtering income entries',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    example: '2023-12-31',
    description: 'End date for filtering income entries',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({
    example: 'category-uuid',
    description: 'Filter by category ID',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'payment-method-uuid',
    description: 'Filter by payment method ID',
  })
  @IsUUID()
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    example: 'Salary',
    description: 'Search term for description',
  })
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @ApiPropertyOptional({
    example: 10000,
    description: 'Minimum amount in cents',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({
    example: 100000,
    description: 'Maximum amount in cents',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items per page',
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
