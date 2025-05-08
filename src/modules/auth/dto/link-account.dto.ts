import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkAccountDto {
  @ApiProperty({ 
    example: 'google', 
    description: 'OAuth provider to link with' 
  })
  @IsString()
  @IsNotEmpty()
  provider: string;
  
  @ApiProperty({ 
    example: '123456789', 
    description: 'Provider account ID (optional, can be provided by the OAuth flow)',
    required: false
  })
  @IsString()
  @IsOptional()
  providerAccountId?: string;
  
  @ApiProperty({ 
    example: 'token123', 
    description: 'Provider access token or verification token', 
    required: false
  })
  @IsString()
  @IsOptional()
  accessToken?: string;
} 