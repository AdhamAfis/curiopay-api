import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsBoolean, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetIncomeDto {
  @ApiPropertyOptional({ example: 10, description: 'Number of items per page (default: 10)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 0, description: 'Page number starting from 0 (default: 0)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  page?: number = 0;

  @ApiPropertyOptional({ example: 'description', description: 'Field to sort by' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'date';

  @ApiPropertyOptional({ example: 'asc', description: 'Sort order (asc or desc)' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ example: '2023-01-01', description: 'Filter by start date (inclusive)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2023-12-31', description: 'Filter by end date (inclusive)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 'category-id', description: 'Filter by category ID' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'search term', description: 'Search term for description or notes' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'payment-method-id', description: 'Filter by payment method ID' })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({ example: 'true', description: 'Include deleted income entries' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({ example: '100', description: 'Minimum amount' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minAmount?: number;

  @ApiPropertyOptional({ example: '1000', description: 'Maximum amount' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxAmount?: number;
} 