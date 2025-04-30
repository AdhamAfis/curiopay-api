import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePaymentMethodDto {
  @ApiProperty({
    description: 'Payment method ID',
    example: 'cma3sh4it0000reguowhqncor',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

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
    description: 'Whether this is a default payment method',
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
} 