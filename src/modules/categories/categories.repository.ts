import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Category, CategoryType, Prisma } from '@prisma/client';

@Injectable()
export class CategoriesRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        type: true,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    userId: string;
    typeId?: string;
  }): Promise<{ categories: Category[]; total: number }> {
    const { skip, take, userId, typeId } = params;
    
    const where: Prisma.CategoryWhereInput = {
      userId,
      ...(typeId && { typeId }),
    };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        skip,
        take,
        where,
        include: {
          type: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return { categories, total };
  }

  async findAllTypes(): Promise<CategoryType[]> {
    return this.prisma.categoryType.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({
      data,
      include: {
        type: true,
      },
    });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data,
      include: {
        type: true,
      },
    });
  }

  async delete(id: string): Promise<Category> {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async findDefaultCategories(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        userId,
        isDefault: true,
      },
      include: {
        type: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findSystemCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        isSystem: true,
      },
      include: {
        type: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
} 