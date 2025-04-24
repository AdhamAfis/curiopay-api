import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { VoidExpenseDto } from './dto/void-expense.dto';
import { calculateNextProcessDate } from '../../common/utils/dates.util';
import { Expense, Prisma } from '@prisma/client';
import { format } from 'date-fns';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  private generatePartitionKey(date: Date): string {
    return format(date, 'yyyy_MM');
  }

  async findAll(userId: string, query: QueryExpenseDto) {
    try {
      const {
        categoryId,
        paymentMethodId,
        startDate,
        endDate,
        searchTerm,
        minAmount,
        maxAmount,
        page = 1,
        limit = 20,
      } = query;

      return await this.prisma.expense.findMany({
        where: {
          userId,
          ...(categoryId && { categoryId }),
          ...(paymentMethodId && { paymentMethodId }),
          ...(startDate &&
            endDate && {
              date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }),
          ...(searchTerm && {
            description: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          }),
          ...(minAmount && { amount: { gte: minAmount } }),
          ...(maxAmount && { amount: { lte: maxAmount } }),
          isVoid: false,
        },
        include: {
          category: {
            select: { name: true, icon: true },
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
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch expense records');
    }
  }

  async create(userId: string, createExpenseDto: CreateExpenseDto) {
    const { categoryId, paymentMethodId, recurring, ...expenseData } = createExpenseDto;

    try {
      const date = new Date(expenseData.date);
      const expenseCreate: Prisma.ExpenseUncheckedCreateInput = {
        ...expenseData,
        userId,
        categoryId,
        paymentMethodId,
        partitionKey: this.generatePartitionKey(date),
        ...(recurring && {
          recurring: {
            create: {
              pattern: {
                create: {
                  type: recurring.pattern.type,
                  frequency: recurring.pattern.frequency,
                  dayOfWeek:
                    recurring.pattern.type === 'WEEKLY'
                      ? new Date(expenseData.date).getDay()
                      : null,
                  dayOfMonth: ['MONTHLY', 'YEARLY'].includes(
                    recurring.pattern.type,
                  )
                    ? new Date(expenseData.date).getDate()
                    : null,
                  monthOfYear:
                    recurring.pattern.type === 'YEARLY'
                      ? new Date(expenseData.date).getMonth() + 1
                      : null,
                },
              },
              startDate: new Date(expenseData.date),
              endDate: recurring.endDate ? new Date(recurring.endDate) : null,
              lastProcessed: new Date(),
              nextProcessDate: calculateNextProcessDate(
                new Date(expenseData.date),
                recurring.pattern.type,
                recurring.pattern.frequency,
                ['MONTHLY', 'YEARLY'].includes(recurring.pattern.type)
                  ? new Date(expenseData.date).getDate()
                  : null,
                recurring.pattern.type === 'WEEKLY'
                  ? new Date(expenseData.date).getDay()
                  : null,
                recurring.pattern.type === 'YEARLY'
                  ? new Date(expenseData.date).getMonth() + 1
                  : null,
              ),
            },
          },
        }),
      };

      return await this.prisma.expense.create({
        data: expenseCreate,
        include: {
          category: true,
          paymentMethod: true,
          recurring: {
            include: {
              pattern: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException('Failed to create expense record');
    }
  }

  async update(userId: string, updateExpenseDto: UpdateExpenseDto) {
    const { id, ...updateData } = updateExpenseDto;

    try {
      const expense = await this.prisma.expense.findFirst({
        where: { id, userId },
      });

      if (!expense) {
        throw new NotFoundException('Expense record not found');
      }

      const updateInput: Prisma.ExpenseUncheckedUpdateInput = {
        ...updateData,
        ...(updateData.date && {
          partitionKey: this.generatePartitionKey(new Date(updateData.date)),
        }),
      };

      return await this.prisma.expense.update({
        where: { id },
        data: updateInput,
        include: {
          category: {
            select: { name: true, icon: true },
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update expense record');
    }
  }

  async void(userId: string, voidExpenseDto: VoidExpenseDto) {
    try {
      const expense = await this.prisma.expense.findFirst({
        where: { id: voidExpenseDto.id, userId },
      });

      if (!expense) {
        throw new NotFoundException('Expense record not found');
      }

      return await this.prisma.expense.update({
        where: { id: voidExpenseDto.id },
        data: { isVoid: true },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to void expense record');
    }
  }

  async findById(id: string, userId: string) {
    try {
      const expense = await this.prisma.expense.findFirst({
        where: { id, userId },
        include: {
          category: {
            select: { name: true, icon: true },
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
