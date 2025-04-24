import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsStrongPassword } from '../decorators/password-strength.decorator';

export class RegisterDto {
  @ApiProperty({ 
    example: 'user@example.com', 
    description: 'User email address - must be a valid email format',
    required: true
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ 
    example: 'Tr0ub4dour&3', 
    description: `Password requirements:
    - Must be between 8 and 64 characters
    - Must be strong enough according to zxcvbn password strength estimator
    - Should include a mix of letters, numbers, and symbols`,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  @IsStrongPassword()
  password: string;

  @ApiProperty({ 
    example: 'John', 
    description: `First name requirements:
    - Must be between 2 and 50 characters
    - Can only contain letters, accents, spaces, hyphens, and apostrophes`,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-zÀ-ÖØ-öø-ÿ\s\-']+$/, {
    message: 'First name can only contain letters, accents, spaces, hyphens, and apostrophes'
  })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ 
    example: 'Doe', 
    description: `Last name requirements:
    - Must be between 2 and 50 characters
    - Can only contain letters, accents, spaces, hyphens, and apostrophes`,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-zÀ-ÖØ-öø-ÿ\s\-']+$/, {
    message: 'Last name can only contain letters, accents, spaces, hyphens, and apostrophes'
  })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({ 
    example: '+1234567890', 
    description: 'Phone number in international format (e.g., +1234567890)',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9][0-9]{1,14}$/)
  phone?: string;
} 