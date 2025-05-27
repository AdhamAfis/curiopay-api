import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Current password to confirm account deletion',
    example: 'currentPassword123',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'Confirmation that user wants to delete their account',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  confirm: boolean;
}
