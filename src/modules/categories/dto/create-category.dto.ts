import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Groceries', description: 'Category name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'category-type-id', description: 'Category type ID' })
  @IsString()
  typeId: string;

  @ApiPropertyOptional({ example: 'shopping-cart', description: 'Icon name' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: '#ff5722', description: 'Color in hex format' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 500, description: 'Monthly budget for this category' })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether this is a default category' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;
} 