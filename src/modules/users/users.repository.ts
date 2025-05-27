import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User, UserAuth } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        contactInfo: true,
        preferences: {
          include: {
            currency: true,
            language: true,
            theme: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        auth: true,
        contactInfo: true,
        preferences: {
          include: {
            currency: true,
            language: true,
            theme: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
      include: {
        contactInfo: true,
      },
    });
  }

  async update(userId: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data,
      include: {
        contactInfo: true,
        preferences: true,
      },
    });
  }

  async delete(id: string): Promise<User> {
    // Implement soft delete
    return this.prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        email: `deleted_${new Date().getTime()}_${Math.random().toString(36).substring(2, 15)}`,
      },
    });
  }

  async findUserAuthById(userId: string): Promise<UserAuth | null> {
    return this.prisma.userAuth.findUnique({
      where: {
        userId,
      },
    });
  }

  async createUserAuth(data: Prisma.UserAuthCreateInput): Promise<UserAuth> {
    return this.prisma.userAuth.create({ data });
  }

  async updateUserAuth(
    userId: string,
    data: Prisma.UserAuthUpdateInput,
  ): Promise<UserAuth> {
    return this.prisma.userAuth.update({
      where: {
        userId,
      },
      data,
    });
  }

  async findUserAuthByResetToken(token: string): Promise<UserAuth | null> {
    return this.prisma.userAuth.findFirst({
      where: {
        passwordResetToken: token,
      },
    });
  }

  async findUserAuthByVerificationToken(
    token: string,
  ): Promise<UserAuth | null> {
    return this.prisma.userAuth.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });
  }

  /**
   * Find a user by their OAuth provider details
   * Used for account linking and preventing duplicate OAuth connections
   */
  async findByProviderAccount(
    provider: string,
    providerAccountId?: string,
  ): Promise<User | null> {
    const whereClause: any = {
      provider,
    };

    if (providerAccountId) {
      whereClause.providerAccountId = providerAccountId;
    }

    return this.prisma.user.findFirst({
      where: whereClause,
      include: {
        auth: true,
      },
    });
  }

  // Expose transaction method for services
  async executeTransaction<T>(
    callback: (prisma: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.executeInTransaction(callback);
  }
}
