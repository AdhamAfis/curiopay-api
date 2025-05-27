import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NewsletterPreferencesDto {
  @ApiProperty({ description: 'Receive weekly digest emails', default: true })
  @IsBoolean()
  @IsOptional()
  weeklyDigest?: boolean;

  @ApiProperty({ description: 'Receive promotional emails', default: true })
  @IsBoolean()
  @IsOptional()
  promotionalEmails?: boolean;

  @ApiProperty({ description: 'Receive product updates', default: true })
  @IsBoolean()
  @IsOptional()
  productUpdates?: boolean;
}
