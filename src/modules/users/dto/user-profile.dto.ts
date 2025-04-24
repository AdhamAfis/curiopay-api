import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'USER' })
  role: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '+1234567890' })
  phone?: string;

  @ApiProperty({ example: 'usd' })
  currencyId?: string;

  @ApiProperty({ example: 'en' })
  languageId?: string;

  @ApiProperty({ example: 'light' })
  themeId?: string;

  @ApiProperty({ example: '2024-03-20T12:00:00Z' })
  lastLoginAt?: Date;

  @ApiProperty({ example: '2024-03-20T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-20T12:00:00Z' })
  updatedAt: Date;
} 