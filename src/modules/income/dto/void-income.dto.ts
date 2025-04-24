import { IsString } from 'class-validator';

export class VoidIncomeDto {
  @IsString()
  id: string;
} 