import { IsOptional, IsString, IsNumber, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryExpenseDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by category ID', example: 'category-id' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering', example: '2023-01-01T00:00:00.000Z' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date for filtering', example: '2023-12-31T23:59:59.999Z' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Include void expenses', example: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeVoid?: boolean = false;
} 