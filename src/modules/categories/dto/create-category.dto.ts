import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CategoryTypeEnum {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Groceries',
    description: 'Name of the category',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message: 'Name can only contain letters, numbers, spaces, hyphens, and underscores',
  })
  name: string;

  @ApiProperty({
    example: '🛒',
    description: 'Emoji icon for the category',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 2)
  icon: string;

  @ApiProperty({
    enum: CategoryTypeEnum,
    example: CategoryTypeEnum.EXPENSE,
    description: 'Type of the category (INCOME or EXPENSE)',
  })
  @IsEnum(CategoryTypeEnum)
  type: CategoryTypeEnum;

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
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is a system category',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
} 