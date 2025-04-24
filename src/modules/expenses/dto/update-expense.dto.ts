import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateExpenseDto {
  @IsString()
  id: string;

  @ApiPropertyOptional({
    example: '2023-05-15',
    description: 'Date when the expense occurred',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @ApiPropertyOptional({
    example: 'Grocery Shopping',
    description: 'Description of the expense',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 15000,
    description: 'Expense amount in cents (e.g., $150.00 = 15000)',
  })
  @IsNumber()
  @Min(0)
  @Max(999999999.99)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    example: 'category-uuid',
    description: 'Category ID for the expense',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'payment-method-uuid',
    description: 'Payment method ID (e.g., credit card, cash)',
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    example: 'Monthly groceries including special items',
    description: 'Additional notes about the expense',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
