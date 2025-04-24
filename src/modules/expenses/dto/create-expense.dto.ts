import { IsString, IsNumber, IsOptional, IsDate, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @ApiProperty({ example: '2023-04-21T00:00:00.000Z', description: 'Expense date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ example: 'Groceries', description: 'Expense description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 50.25, description: 'Expense amount' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'category-id', description: 'Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'payment-method-id', description: 'Payment method ID' })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @ApiPropertyOptional({ example: 'Additional notes about the expense', description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Receipt file information (to be implemented)' })
  @IsOptional()
  receipt?: any;
} 