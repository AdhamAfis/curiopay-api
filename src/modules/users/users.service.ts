import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRole, ROLE_HIERARCHY } from './interfaces/role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
        role: createUserDto.role || 'USER',
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

  async findAll(currentUserRole: UserRole) {
    const allowedRoles = ROLE_HIERARCHY[currentUserRole];

    return this.prisma.user.findMany({
      where: {
        role: { in: allowedRoles },
        isDeleted: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        contactInfo: {
          select: {
            phone: true,
          },
        },
        preferences: {
          select: {
            currencyId: true,
            languageId: true,
            themeId: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateRole(
    id: string,
    updateUserRoleDto: UpdateUserRoleDto,
    currentUserRole: UserRole,
  ) {
    const user = await this.findOne(id);

    // Check if current user has permission to update to the new role
    const currentUserHierarchy = ROLE_HIERARCHY[currentUserRole];
    if (!currentUserHierarchy.includes(updateUserRoleDto.role)) {
      throw new BadRequestException(
        'You do not have permission to assign this role',
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: updateUserRoleDto.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        updatedAt: true,
      },
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
        contactInfo: true,
        preferences: true,
      },
    });
  }
}
