import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Income, Prisma } from '@prisma/client';
import { format } from 'date-fns';

@Injectable()
export class IncomesService {
  constructor(private prisma: PrismaService) {}

  private generatePartitionKey(date: Date): string {
    return format(date, 'yyyy_MM');
  }

  async create(data: Prisma.IncomeUncheckedCreateInput): Promise<Income> {
    const date = new Date(data.date as Date | string);
    const createData = {
      ...data,
      partitionKey: this.generatePartitionKey(date),
    };

    return this.prisma.income.create({
      data: createData,
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
  }

  async findAll(userId: string, params: {
    skip?: number;
    take?: number;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Income[]> {
    const { skip, take, categoryId, startDate, endDate } = params;

    return this.prisma.income.findMany({
      where: {
        userId,
        ...(categoryId && { categoryId }),
        ...(startDate && endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
        isVoid: false,
      },
      include: {
        category: true,
        paymentMethod: true,
        recurring: {
          include: {
            pattern: true,
          },
        },
      },
      skip,
      take,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string): Promise<Income> {
    const income = await this.prisma.income.findUnique({
      where: { id },
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

    if (!income) {
      throw new NotFoundException(`Income with ID ${id} not found`);
    }

    return income;
  }

  async update(id: string, data: Prisma.IncomeUncheckedUpdateInput): Promise<Income> {
    const updateData = { ...data };
    
    // If date is being updated, update partitionKey
    if (data.date) {
      const date = new Date(data.date as Date | string);
      updateData.partitionKey = this.generatePartitionKey(date);
    }

    return this.prisma.income.update({
      where: { id },
      data: updateData,
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
  }

  async remove(id: string): Promise<Income> {
    return this.prisma.income.update({
      where: { id },
      data: { isVoid: true },
    });
  }

  async getMonthlyTotal(userId: string, year: number, month: number): Promise<number> {
    const result = await this.prisma.income.aggregate({
      where: {
        userId,
        isVoid: false,
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }
} 