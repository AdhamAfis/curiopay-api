import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ExportOptionsDto {
  @ApiProperty({
    description: 'Include expense data in export',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeExpenses?: boolean = true;

  @ApiProperty({
    description: 'Include income data in export',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeIncome?: boolean = true;

  @ApiProperty({
    description: 'Include categories in export',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeCategories?: boolean = true;

  @ApiProperty({
    description: 'Include user preferences in export',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includePreferences?: boolean = true;

  @ApiProperty({
    description: 'Include newsletter preferences in export',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeNewsletter?: boolean = true;
} 