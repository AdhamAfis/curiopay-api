import { IsNotEmpty, IsString, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Verification token sent to user email',
    example: 'e0b9f5c4-3d2e-4c9d-b2c3-2a9a3f8c6e5b',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class RequestEmailVerificationDto {
  @ApiProperty({
    description: 'Email address to send verification link to (for unauthenticated users)',
    example: 'user@example.com',
    required: false
  })
  @IsString()
  @IsOptional()
  @ValidateIf(o => !o.userId)
  email?: string;

  @ApiProperty({
    description: 'User ID (for authenticated users)',
    example: 'e0b9f5c4-3d2e-4c9d-b2c3-2a9a3f8c6e5b',
    required: false
  })
  @IsString()
  @IsOptional()
  @ValidateIf(o => !o.email)
  userId?: string;
} 