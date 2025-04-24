import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Match } from '../decorators/match.decorator';

export class RegisterDto {
  @ApiProperty({ 
    example: 'user@example.com', 
    description: 'User email address - must be a valid email format' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ 
    example: 'StrongP@ssw0rd', 
    description: 'User password - must be 8-32 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(32, { message: 'Password must not exceed 32 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])(?=.*[^\s])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @ApiProperty({ 
    example: 'StrongP@ssw0rd', 
    description: 'Confirm password - must match password field' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  @Match('password', { message: 'Passwords do not match' })
  passwordConfirm: string;

  @ApiProperty({ 
    example: 'John', 
    description: 'User first name - 2 to 50 characters, letters only' 
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Matches(
    /^[A-Za-z\s\-']+$/,
    { message: 'First name can only contain letters, spaces, hyphens, and apostrophes' }
  )
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ 
    example: 'Doe', 
    description: 'User last name - 2 to 50 characters, letters only' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Matches(
    /^[A-Za-z\s\-']+$/,
    { message: 'Last name can only contain letters, spaces, hyphens, and apostrophes' }
  )
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({ 
    example: '+1234567890', 
    description: 'User phone number (optional) - must be in international format' 
  })
  @IsOptional()
  @IsString()
  @Matches(
    /^\+[1-9]\d{1,14}$/,
    { message: 'Phone number must be in international format (e.g., +1234567890)' }
  )
  phone?: string;
} 