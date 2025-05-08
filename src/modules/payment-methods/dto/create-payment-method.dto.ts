import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodEnum } from '@prisma/client';

export class CreatePaymentMethodDto {
  @ApiProperty({
    description: 'Payment method name (from enum)',
    enum: PaymentMethodEnum,
    example: 'CREDIT_CARD',
  })
  @IsEnum(PaymentMethodEnum)
  name: PaymentMethodEnum;

  @ApiProperty({
    description: 'Icon for the payment method',
    example: 'credit-card',
    required: false,
  })
  @IsString()
  @IsOptional()
  icon?: string;
  
  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is a default payment method. Note: Requires admin privileges to set to true.',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is a system payment method. Note: Requires admin privileges to set to true.',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
} 