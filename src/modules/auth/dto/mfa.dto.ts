import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnableMfaDto {
  @ApiProperty({ example: '123456', description: 'MFA verification code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class VerifyMfaDto {
  @ApiProperty({ example: '123456', description: 'MFA verification code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class DisableMfaDto {
  @ApiProperty({ example: '123456', description: 'MFA verification code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: true, description: 'Confirm MFA disable action' })
  @IsBoolean()
  @IsNotEmpty()
  confirm: boolean;
} 