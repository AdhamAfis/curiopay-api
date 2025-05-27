import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateUserPreferencesDto {
  @ApiProperty({
    description: 'Currency ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  currencyId?: string;

  @ApiProperty({
    description: 'Language ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  languageId?: string;

  @ApiProperty({
    description: 'Theme ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  themeId?: string;

  @ApiProperty({
    description: 'Monthly budget',
    required: false,
    type: Number,
    example: 1000,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyBudget?: number;

  @ApiProperty({
    description: 'Enable AI features',
    required: false,
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  enableAiFeatures?: boolean;
}

export class UserPreferencesResponseDto {
  @ApiProperty({
    description: 'User preference ID',
  })
  id: string;

  @ApiProperty({
    description: 'Currency',
    type: 'object',
    properties: {
      id: { type: 'string' },
      code: { type: 'string' },
      symbol: { type: 'string' },
      name: { type: 'string' },
    },
  })
  currency: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  };

  @ApiProperty({
    description: 'Language',
    type: 'object',
    properties: {
      id: { type: 'string' },
      code: { type: 'string' },
      name: { type: 'string' },
    },
  })
  language: {
    id: string;
    code: string;
    name: string;
  };

  @ApiProperty({
    description: 'Theme',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
    },
  })
  theme: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Monthly budget',
    type: Number,
    example: 1000,
    nullable: true,
  })
  monthlyBudget: number;

  @ApiProperty({
    description: 'Enable AI features',
    type: Boolean,
    default: true,
  })
  enableAiFeatures: boolean;
}
