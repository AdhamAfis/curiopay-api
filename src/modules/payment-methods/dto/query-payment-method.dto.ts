import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPaymentMethodDto {
  @ApiPropertyOptional({
    example: 'Credit',
    description: 'Search payment methods by name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter default payment methods',
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter system payment methods',
  })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
}
