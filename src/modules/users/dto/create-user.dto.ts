import { IsEmail, IsString, IsOptional, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: '+1234567890', description: 'User phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Password123!', description: 'User password' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: 'usd', description: 'Default currency ID' })
  @IsString()
  @IsOptional()
  currencyId?: string;

  @ApiPropertyOptional({ example: 'en', description: 'Default language ID' })
  @IsString()
  @IsOptional()
  languageId?: string;

  @ApiPropertyOptional({ example: 'light', description: 'Default theme ID' })
  @IsString()
  @IsOptional()
  themeId?: string;
} 