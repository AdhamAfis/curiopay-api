import { IsString, IsOptional, IsEnum, IsBoolean, Length, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryTypeEnum } from './create-category.dto';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    example: 'Groceries',
    description: 'Name of the category',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message: 'Name can only contain letters, numbers, spaces, hyphens, and underscores',
  })
  name?: string;

  @ApiPropertyOptional({
    example: '🛒',
    description: 'Emoji icon for the category',
  })
  @IsString()
  @IsOptional()
  @Length(1, 2)
  icon?: string;

  @ApiPropertyOptional({
    enum: CategoryTypeEnum,
    example: CategoryTypeEnum.EXPENSE,
    description: 'Type of the category (INCOME or EXPENSE)',
  })
  @IsEnum(CategoryTypeEnum)
  @IsOptional()
  type?: CategoryTypeEnum;

  @ApiPropertyOptional({
    example: '#FF5733',
    description: 'Color code for the category (hex format)',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color code (e.g., #FF5733)',
  })
  color?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is a default category',
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
} 