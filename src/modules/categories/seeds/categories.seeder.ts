import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DEFAULT_CATEGORIES } from './default-categories.seed';

@Injectable()
export class CategoriesSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaultCategories(userId: string) {
    // Create category types if they don't exist
    const categoryTypes = await Promise.all(
      [...new Set(DEFAULT_CATEGORIES.map((cat) => cat.type))].map((type) =>
        this.prisma.categoryType.upsert({
          where: { name: type },
          update: {},
          create: {
            name: type,
            icon: type === 'INCOME' ? '💰' : '💸',
          },
        }),
      ),
    );

    // Create default categories for the user
    const typeMap = new Map(categoryTypes.map((type) => [type.name, type.id]));

    await Promise.all(
      DEFAULT_CATEGORIES.map((category) =>
        this.prisma.category.upsert({
          where: {
            userId_name: {
              userId,
              name: category.name,
            },
          },
          update: {},
          create: {
            name: category.name,
            icon: category.icon,
            color: category.color,
            isDefault: true,
            isSystem: true,
            typeId: typeMap.get(category.type)!,
            userId,
          },
        }),
      ),
    );
  }
}
