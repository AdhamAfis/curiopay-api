import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryExpenseDto {
  @ApiPropertyOptional({
    example: '2023-01-01',
    description: 'Start date for filtering expense entries',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    example: '2023-12-31',
    description: 'End date for filtering expense entries',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({
    example: 'category-uuid',
    description: 'Filter by category ID',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'payment-method-uuid',
    description: 'Filter by payment method ID',
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    example: 'Groceries',
    description: 'Search term for description',
  })
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Minimum amount in cents',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({
    example: 50000,
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

  @ApiPropertyOptional({ description: 'Include void expenses', example: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeVoid?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include recurring expenses',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeRecurring?: boolean = false;
}
