import { IsNotEmpty, IsString } from 'class-validator';
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
    description: 'Email address to send verification link to',
    example: 'user@example.com'
  })
  @IsString()
  @IsNotEmpty()
  email: string;
} 