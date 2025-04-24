import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserProfileResponseDto } from './dto/user-profile.dto';
import { UserRole, ROLE_HIERARCHY } from './interfaces/role.enum';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { RegisterDto } from '../auth/dto/register.dto';
import { Role } from '@prisma/client';
import { EncryptionService } from '../../common/services/encryption.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersRepository: UsersRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordSalt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      passwordSalt,
    );

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: (createUserDto.role as Role) || Role.USER,
        isActive: true,
        auth: {
          create: {
            password: hashedPassword,
            passwordSalt,
            passwordHashVersion: 1,
          },
        },
        contactInfo: {
          create: {
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            phone: createUserDto.phone,
          },
        },
        preferences:
          createUserDto.currencyId ||
          createUserDto.languageId ||
          createUserDto.themeId
            ? {
                create: {
                  currencyId: createUserDto.currencyId || 'usd',
                  languageId: createUserDto.languageId || 'en',
                  themeId: createUserDto.themeId || 'light',
                },
              }
            : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(currentUserRole?: Role) {
    if (!currentUserRole) {
      return this.prisma.user.findMany();
    }

    const allowedRoles = [currentUserRole, ...ROLE_HIERARCHY[currentUserRole]];
    return this.prisma.user.findMany({
      where: {
        role: {
          in: allowedRoles,
        },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async updateRole(id: string, updateUserRoleDto: UpdateUserRoleDto, currentUserRole: Role) {
    const targetUser = await this.findOne(id);
    const newRole = updateUserRoleDto.role as Role;

    if (!ROLE_HIERARCHY[currentUserRole].includes(newRole)) {
      throw new UnauthorizedException('You are not authorized to assign this role');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: newRole },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        isDeleted: false,
      },
      include: {
        auth: true,
      },
    });
  }

  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        contactInfo: true,
        preferences: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Decrypt sensitive data
    const decryptedFirstName = user.firstName 
      ? await this.encryptionService.decrypt(user.firstName)
      : '';
    const decryptedLastName = user.lastName
      ? await this.encryptionService.decrypt(user.lastName)
      : '';
    const decryptedPhone = user.contactInfo?.phone 
      ? await this.encryptionService.decrypt(user.contactInfo.phone)
      : undefined;

    return {
      id: user.id,
      email: user.email,
      firstName: decryptedFirstName,
      lastName: decryptedLastName,
      role: user.role,
      isActive: user.isActive,
      phone: decryptedPhone,
      currencyId: user.preferences?.currencyId,
      languageId: user.preferences?.languageId,
      themeId: user.preferences?.themeId,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async createUser(createUserDto: RegisterDto) {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        firstName: await this.encryptionService.encrypt(createUserDto.firstName),
        lastName: await this.encryptionService.encrypt(createUserDto.lastName),
        role: Role.USER,
        isActive: true,
        auth: {
          create: {
            password: hashedPassword,
            passwordSalt: salt,
          },
        },
      },
    });
  }
}
