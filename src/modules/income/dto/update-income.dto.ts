import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIncomeDto {
  @IsString()
  id: string;

  @ApiPropertyOptional({
    example: '2023-05-15',
    description: 'Date when the income was received',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @ApiPropertyOptional({
    example: 'Monthly Salary',
    description: 'Description of the income',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 200000,
    description: 'Income amount in cents (e.g., $2000.00 = 200000)',
  })
  @IsNumber()
  @Min(0)
  @Max(999999999.99)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    example: 'category-uuid',
    description: 'Category ID for the income',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'payment-method-uuid',
    description: 'Payment method ID (e.g., bank account, cash)',
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    example: 'End of month bonus included',
    description: 'Additional notes about the income',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
