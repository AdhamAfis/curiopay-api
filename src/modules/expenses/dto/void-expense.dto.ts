import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VoidExpenseDto {
  @ApiProperty({ example: 'Expense was created by mistake', description: 'Reason for voiding the expense' })
  @IsString()
  @IsNotEmpty()
  reason: string;
} 