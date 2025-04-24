import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Expense, Prisma } from '@prisma/client';

@Injectable()
export class ExpensesRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Expense | null> {
    return this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        paymentMethod: true,
        receipt: true,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    userId: string;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    includeVoid?: boolean;
  }): Promise<{ expenses: Expense[]; total: number }> {
    const { skip, take, userId, categoryId, startDate, endDate, includeVoid = false } = params;
    
    const where: Prisma.ExpenseWhereInput = {
      userId,
      ...(categoryId && { categoryId }),
      ...(startDate && endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
      ...(!includeVoid && { isVoid: false }),
    };

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        skip,
        take,
        where,
        include: {
          category: true,
          paymentMethod: true,
          receipt: true,
        },
        orderBy: {
          date: 'desc',
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { expenses, total };
  }

  async create(data: Prisma.ExpenseCreateInput): Promise<Expense> {
    return this.prisma.expense.create({
      data,
      include: {
        category: true,
        paymentMethod: true,
      },
    });
  }

  async update(id: string, data: Prisma.ExpenseUpdateInput): Promise<Expense> {
    return this.prisma.expense.update({
      where: { id },
      data,
      include: {
        category: true,
        paymentMethod: true,
        receipt: true,
      },
    });
  }

  async delete(id: string): Promise<Expense> {
    return this.prisma.expense.delete({
      where: { id },
    });
  }

  async voidExpense(id: string, reason: string): Promise<Expense> {
    return this.prisma.expense.update({
      where: { id },
      data: {
        isVoid: true,
        voidReason: reason,
      },
      include: {
        category: true,
        paymentMethod: true,
      },
    });
  }

  async getTotalExpensesByCategory(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT c."id", c."name", c."color", SUM(e."amount") as total
      FROM "expenses" e
      JOIN "categories" c ON e."categoryId" = c."id"
      WHERE e."userId" = ${userId}
        AND e."date" >= ${startDate}
        AND e."date" <= ${endDate}
        AND e."isVoid" = false
      GROUP BY c."id", c."name", c."color"
      ORDER BY total DESC
    `;
  }

  async executeTransaction<T>(callback: (prisma: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.executeInTransaction(callback);
  }
} 