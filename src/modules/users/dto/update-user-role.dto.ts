import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../interfaces/role.enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.MANAGER,
    description: 'New user role',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
} 