import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIncomeDto {
  @ApiProperty({
    example: '2023-05-15',
    description: 'Date when the income was received',
  })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({
    example: 'Monthly Salary',
    description: 'Description of the income',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 200000,
    description: 'Income amount in cents (e.g., $2000.00 = 200000)',
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    example: 'category-uuid',
    description: 'Category ID for the income',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    example: 'payment-method-uuid',
    description: 'Payment method ID (e.g., bank account, cash)',
  })
  @IsUUID()
  paymentMethodId: string;

  @ApiPropertyOptional({
    example: 'End of month bonus included',
    description: 'Additional notes about the income',
  })
  @IsString()
  @IsOptional()
  notes?: string;
} 