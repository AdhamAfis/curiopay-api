import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { VoidExpenseDto } from './dto/void-expense.dto';
import { calculateNextProcessDate } from '../../common/utils/dates.util';
import { Expense, Prisma } from '@prisma/client';
import { format } from 'date-fns';
import { EncryptionService } from '../../common/services/encryption.service';
import { PaginationParams } from '../../common/interfaces/pagination.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private generatePartitionKey(date: Date): string {
    return format(date, 'yyyy_MM');
  }

  async findAll(userId: string, query: QueryExpenseDto) {
    try {
      // Create a cache key based on user ID and query parameters
      const cacheKey = `expenses:${userId}:${JSON.stringify(query)}`;

      // Try to get data from cache first
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const {
        page = 1,
        limit = 10,
        startDate,
        endDate,
        categoryId,
        minAmount,
        maxAmount,
        searchTerm,
        paymentMethodId,
        includeVoid = false,
      } = query;

      const skip = (page - 1) * limit;

      // Build filter conditions
      const where: Prisma.ExpenseWhereInput = {
        userId,
        isVoid: includeVoid ? undefined : false,
        ...(startDate && endDate
          ? { date: { gte: new Date(startDate), lte: new Date(endDate) } }
          : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(paymentMethodId ? { paymentMethodId } : {}),
        ...(minAmount || maxAmount
          ? {
              amount: {
                ...(minAmount ? { gte: parseFloat(minAmount.toString()) } : {}),
                ...(maxAmount ? { lte: parseFloat(maxAmount.toString()) } : {}),
              },
            }
          : {}),
        ...(searchTerm
          ? {
              description: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            }
          : {}),
      };

      // Optimize data loading - only get what we need
      const [expenses, total] = await Promise.all([
        this.prisma.expense.findMany({
          where,
          select: {
            id: true,
            date: true,
            description: true,
            amount: true,
            notes: true,
            isVoid: true,
            categoryId: true,
            paymentMethodId: true,
            createdAt: true,
            category: {
              select: {
                name: true,
                icon: true,
                color: true,
              },
            },
            paymentMethod: {
              select: {
                name: true,
              },
            },
            // Only load recurring info if needed
            recurring: query.includeRecurring
              ? {
                  select: {
                    id: true,
                    nextProcessDate: true,
                    pattern: {
                      select: {
                        type: true,
                        frequency: true,
                      },
                    },
                  },
                }
              : undefined,
          },
          skip,
          take: limit,
          orderBy: { date: 'desc' },
        }),
        this.prisma.expense.count({ where }),
      ]);

      // Calculate pagination metadata
      const result = {
        data: expenses,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
          hasNextPage: skip + expenses.length < total,
          hasPreviousPage: page > 1,
        },
      };

      // Store in cache for future requests (1 minute TTL)
      await this.cacheManager.set(cacheKey, result, 60000);

      return result;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch expenses: ${error.message}`,
      );
    }
  }

  async findOne(id: string, userId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        paymentMethod: true,
        recurring: {
          include: { pattern: true },
        },
      },
    });

    if (!expense || expense.userId !== userId) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async create(data: any, userId: string) {
    try {
      const encryptedData = {
        ...data,
        description: await this.encryptionService.encrypt(data.description),
        notes: data.notes
          ? await this.encryptionService.encrypt(data.notes)
          : null,
      };

      return await this.prisma.expense.create({
        data: {
          ...encryptedData,
          userId,
        },
        include: {
          category: true,
          paymentMethod: true,
          recurring: {
            include: { pattern: true },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException('Failed to create expense');
    }
  }

  async update(id: string, data: any) {
    const expense = await this.findOne(id, data.userId);

    const encryptedData = {
      ...data,
      description: data.description
        ? await this.encryptionService.encrypt(data.description)
        : undefined,
      notes: data.notes
        ? await this.encryptionService.encrypt(data.notes)
        : undefined,
    };

    return this.prisma.expense.update({
      where: { id },
      data: encryptedData,
      include: {
        category: true,
        paymentMethod: true,
        recurring: {
          include: { pattern: true },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const expense = await this.findOne(id, userId);

    return this.prisma.expense.update({
      where: { id },
      data: { isVoid: true },
    });
  }

  async findById(id: string, userId: string) {
    try {
      const cacheKey = `expense:${userId}:${id}`;

      // Try to get data from cache first
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const expense = await this.prisma.expense.findFirst({
        where: { id, userId },
        include: {
          category: {
            select: { name: true, icon: true, color: true },
          },
          paymentMethod: {
            select: { name: true },
          },
          recurring: {
            select: {
              id: true,
              pattern: {
                select: {
                  type: true,
                  frequency: true,
                },
              },
              startDate: true,
              endDate: true,
              nextProcessDate: true,
            },
          },
        },
      });

      if (!expense) {
        throw new NotFoundException('Expense record not found');
      }

      // Store in cache for future requests (5 minutes TTL)
      await this.cacheManager.set(cacheKey, expense, 300000);

      return expense;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch expense record');
    }
  }

  async getExpenseTotalsByCategory(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      return await this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          isVoid: false,
        },
        _sum: {
          amount: true,
        },
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch expense totals');
    }
  }
}
