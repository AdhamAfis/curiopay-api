import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../interfaces/role.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z]{2,}$/, {
    message:
      'First name must contain only letters and be at least 2 characters long',
  })
  firstName: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z]{2,}$/, {
    message:
      'Last name must contain only letters and be at least 2 characters long',
  })
  lastName?: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.USER,
    description: 'User role',
    default: UserRole.USER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'User phone number',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: 'usd',
    description: 'Default currency ID',
  })
  @IsString()
  @IsOptional()
  currencyId?: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Default language ID',
  })
  @IsString()
  @IsOptional()
  languageId?: string;

  @ApiPropertyOptional({
    example: 'light',
    description: 'Default theme ID',
  })
  @IsString()
  @IsOptional()
  themeId?: string;
}
