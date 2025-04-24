import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, CategoryTypeEnum } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { CategoriesSeeder } from './seeds/categories.seeder';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesSeeder: CategoriesSeeder,
  ) {}

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    try {
      // Check if category with same name exists for user
      const existingCategory = await this.prisma.category.findUnique({
        where: {
          userId_name: {
            userId,
            name: createCategoryDto.name,
          },
        },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Category with name '${createCategoryDto.name}' already exists`,
        );
      }

      // Get or create category type
      const categoryType = await this.prisma.categoryType.upsert({
        where: { name: createCategoryDto.type },
        update: {},
        create: {
          name: createCategoryDto.type,
          icon:
            createCategoryDto.type === CategoryTypeEnum.INCOME ? '💰' : '💸',
        },
      });

      return await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          icon: createCategoryDto.icon,
          color: createCategoryDto.color,
          isDefault: createCategoryDto.isDefault ?? false,
          isSystem: createCategoryDto.isSystem ?? false,
          typeId: categoryType.id,
          userId,
        },
        include: {
          type: true,
        },
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create category');
    }
  }

  async findAll(userId: string, query: QueryCategoryDto) {
    try {
      const { search, type, isDefault, isSystem } = query;

      const categories = await this.prisma.category.findMany({
        where: {
          userId,
          ...(search && {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }),
          ...(type && {
            type: {
              name: type,
            },
          }),
          ...(isDefault !== undefined && { isDefault }),
          ...(isSystem !== undefined && { isSystem }),
        },
        include: {
          type: true,
          _count: {
            select: {
              expenses: {
                where: { isVoid: false },
              },
              incomes: {
                where: { isVoid: false },
              },
            },
          },
        },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });

      return categories.map((category) => ({
        ...category,
        transactionCount: category._count.expenses + category._count.incomes,
        _count: undefined,
      }));
    } catch (error) {
      throw new BadRequestException('Failed to fetch categories');
    }
  }

  async findOne(userId: string, id: string) {
    try {
      const category = await this.prisma.category.findFirst({
        where: { id, userId },
        include: {
          type: true,
          _count: {
            select: {
              expenses: {
                where: { isVoid: false },
              },
              incomes: {
                where: { isVoid: false },
              },
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID '${id}' not found`);
      }

      return {
        ...category,
        transactionCount: category._count.expenses + category._count.incomes,
        _count: undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch category');
    }
  }

  async update(
    userId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    try {
      const category = await this.prisma.category.findFirst({
        where: { id, userId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID '${id}' not found`);
      }

      if (category.isSystem) {
        throw new BadRequestException('System categories cannot be modified');
      }

      if (updateCategoryDto.name) {
        const existingCategory = await this.prisma.category.findFirst({
          where: {
            userId,
            name: updateCategoryDto.name,
            id: { not: id },
          },
        });

        if (existingCategory) {
          throw new ConflictException(
            `Category with name '${updateCategoryDto.name}' already exists`,
          );
        }
      }

      let typeId = category.typeId;
      if (updateCategoryDto.type) {
        const categoryType = await this.prisma.categoryType.upsert({
          where: { name: updateCategoryDto.type },
          update: {},
          create: {
            name: updateCategoryDto.type,
            icon:
              updateCategoryDto.type === CategoryTypeEnum.INCOME ? '💰' : '💸',
          },
        });
        typeId = categoryType.id;
      }

      return await this.prisma.category.update({
        where: { id },
        data: {
          name: updateCategoryDto.name,
          icon: updateCategoryDto.icon,
          color: updateCategoryDto.color,
          isDefault: updateCategoryDto.isDefault,
          typeId,
        },
        include: {
          type: true,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update category');
    }
  }

  async remove(userId: string, id: string) {
    try {
      const category = await this.prisma.category.findFirst({
        where: { id, userId },
        include: {
          _count: {
            select: {
              expenses: true,
              incomes: true,
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID '${id}' not found`);
      }

      if (category.isSystem) {
        throw new BadRequestException('System categories cannot be deleted');
      }

      if (category.isDefault) {
        throw new BadRequestException('Default categories cannot be deleted');
      }

      if (category._count.expenses > 0 || category._count.incomes > 0) {
        throw new BadRequestException(
          'Categories with transactions cannot be deleted',
        );
      }

      return await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to delete category');
    }
  }

  async findAllTypes() {
    return this.prisma.categoryType.findMany();
  }

  async findDefaultCategories(userId: string) {
    return this.prisma.category.findMany({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  async findSystemCategories() {
    return this.prisma.category.findMany({
      where: {
        isSystem: true,
      },
    });
  }

  async seedUserDefaultCategories(userId: string) {
    return this.categoriesSeeder.seedDefaultCategories(userId);
  }
}
