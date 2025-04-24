import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryTypeEnum } from './create-category.dto';

export class QueryCategoryDto {
  @ApiPropertyOptional({
    example: 'Groceries',
    description: 'Search categories by name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: CategoryTypeEnum,
    example: CategoryTypeEnum.EXPENSE,
    description: 'Filter by category type',
  })
  @IsEnum(CategoryTypeEnum)
  @IsOptional()
  type?: CategoryTypeEnum;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter default categories',
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter system categories',
  })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
} 