import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ForbiddenException,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserProfileResponseDto } from './dto/user-profile.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IUser } from './interfaces/user.interface';
import { ROLE_HIERARCHY } from './interfaces/role.enum';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { RegisterDto } from '../auth/dto/register.dto';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard, AdminGuard)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createUser(@Body() createUserDto: RegisterDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard, AdminGuard)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard, AdminGuard)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns the user.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@CurrentUser() currentUser: IUser, @Param('id') id: string) {
    // Users can only view their own profile unless they are admin/super_admin
    const userRoleHierarchy = ROLE_HIERARCHY[currentUser.role] || [];
    if (currentUser.id !== id && !userRoleHierarchy.includes(Role.ADMIN)) {
      throw new ForbiddenException(
        'You do not have permission to view this user',
      );
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard, AdminGuard)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(id, updateUserRoleDto, Role.ADMIN);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User status has been toggled successfully.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async toggleActive(@Param('id') id: string, @CurrentUser() currentUser: IUser) {
    if (currentUser.id !== id) {
      throw new ForbiddenException('You can only toggle your own account status');
    }
    return this.usersService.toggleActive(id);
  }

  @Get('me/profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current user profile with decrypted data.',
    type: UserProfileResponseDto
  })
  async getProfile(@CurrentUser() user: IUser) {
    return this.usersService.getProfile(user.id);
  }

  @Delete('me/delete-account')
  @ApiOperation({ summary: 'Delete current user account and all associated data' })
  @ApiResponse({
    status: 200,
    description: 'Account successfully deleted.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or confirmation not provided.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid password.',
  })
  async deleteAccount(
    @CurrentUser() user: IUser,
    @Body() deleteAccountDto: DeleteAccountDto,
  ) {
    return this.usersService.deleteAccount(user.id, deleteAccountDto);
  }
}
