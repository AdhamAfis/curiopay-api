import { IsString } from 'class-validator';

export class VoidExpenseDto {
  @IsString()
  id: string;
}
