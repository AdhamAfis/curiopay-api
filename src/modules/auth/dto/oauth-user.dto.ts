import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class OAuthUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsNotEmpty()
  providerAccountId: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}
