import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: Role,
    description: 'User role',
    example: 'ADMIN',
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
