import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringPatternDto } from './recurring-pattern.dto';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateExpenseDto {
  @ApiProperty({
    example: '2023-05-15',
    description: 'Date when the expense occurred',
  })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({
    example: 'Grocery Shopping',
    description: 'Description of the expense',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 15000,
    description: 'Expense amount in cents (e.g., $150.00 = 15000)',
  })
  @IsNumber()
  @Min(0)
  @Max(999999999.99)
  amount: Decimal;

  @ApiProperty({
    example: 'category-uuid',
    description: 'Category ID for the expense',
  })
  @IsString()
  categoryId: string;

  @ApiProperty({
    example: 'payment-method-uuid',
    description: 'Payment method ID (e.g., credit card, cash)',
  })
  @IsString()
  paymentMethodId: string;

  @ApiPropertyOptional({
    example: 'Monthly groceries including special items',
    description: 'Additional notes about the expense',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RecurringPatternDto)
  recurring?: {
    pattern: {
      type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
      frequency: number;
    };
    endDate?: Date;
  };
}
