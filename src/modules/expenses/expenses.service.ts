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
import { EncryptionService } from '../../common/services/encryption.service';
import { PaginationParams } from '../../common/interfaces/pagination.interface';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  private generatePartitionKey(date: Date): string {
    return format(date, 'yyyy_MM');
  }

  async findAll(userId: string, pagination: PaginationParams) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    return this.prisma.expense.findMany({
      where: { userId, isVoid: false },
      include: {
        category: true,
        paymentMethod: true,
        recurring: {
          include: { pattern: true },
        },
      },
      skip,
      take: limit,
    });
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
        notes: data.notes ? await this.encryptionService.encrypt(data.notes) : null,
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
      description: data.description ? await this.encryptionService.encrypt(data.description) : undefined,
      notes: data.notes ? await this.encryptionService.encrypt(data.notes) : undefined,
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
