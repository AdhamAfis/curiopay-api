import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodEnum } from '@prisma/client';

export class PaymentMethodResponseDto {
  @ApiProperty({
    description: 'Payment method ID',
    example: 'cma3sh4it0000reguowhqncor',
  })
  id: string;

  @ApiProperty({
    description: 'Payment method name (from enum)',
    enum: PaymentMethodEnum,
    example: 'CREDIT_CARD',
  })
  name: PaymentMethodEnum;

  @ApiProperty({
    description: 'Icon for the payment method',
    example: 'credit-card',
    required: false,
  })
  icon?: string;

  @ApiProperty({
    description: 'Whether this is a default payment method',
    example: true,
  })
  isDefault: boolean;

  @ApiProperty({
    description: 'Whether this is a system payment method',
    example: false,
  })
  isSystem: boolean;

  @ApiProperty({
    description: 'User ID that owns this payment method',
    example: 'cma3sh4ot0000reguowhqabcd',
  })
  userId: string;

  @ApiProperty({
    description: 'Number of transactions using this payment method',
    example: 12,
  })
  transactionCount: number;

  @ApiProperty({
    description: 'Creation date',
    example: '2025-04-30T10:24:20.261Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2025-04-30T10:24:20.261Z',
  })
  updatedAt: Date;
} 