import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Income, Prisma } from '@prisma/client';
import { format } from 'date-fns';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { QueryIncomeDto } from './dto/query-income.dto';
import { VoidIncomeDto } from './dto/void-income.dto';
import { calculateNextProcessDate } from '../../common/utils/dates.util';

@Injectable()
export class IncomeService {
  constructor(private readonly prisma: PrismaService) {}

  private generatePartitionKey(date: Date): string {
    return format(date, 'yyyy_MM');
  }

  async findAll(userId: string, query: QueryIncomeDto) {
    try {
      return await this.prisma.income.findMany({
        where: {
          userId,
          ...(query.categoryId && { categoryId: query.categoryId }),
          ...(query.startDate &&
            query.endDate && {
              date: {
                gte: new Date(query.startDate),
                lte: new Date(query.endDate),
              },
            }),
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
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch income records');
    }
  }

  async create(userId: string, createIncomeDto: CreateIncomeDto) {
    const { categoryId, paymentMethodId, recurring, ...incomeData } =
      createIncomeDto;

    try {
      const date = new Date(incomeData.date);
      const incomeCreate: Prisma.IncomeUncheckedCreateInput = {
        ...incomeData,
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
                      ? new Date(incomeData.date).getDay()
                      : null,
                  dayOfMonth: ['MONTHLY', 'YEARLY'].includes(
                    recurring.pattern.type,
                  )
                    ? new Date(incomeData.date).getDate()
                    : null,
                  monthOfYear:
                    recurring.pattern.type === 'YEARLY'
                      ? new Date(incomeData.date).getMonth() + 1
                      : null,
                },
              },
              startDate: new Date(incomeData.date),
              endDate: recurring.endDate ? new Date(recurring.endDate) : null,
              lastProcessed: new Date(),
              nextProcessDate: calculateNextProcessDate(
                new Date(incomeData.date),
                recurring.pattern.type,
                recurring.pattern.frequency,
                ['MONTHLY', 'YEARLY'].includes(recurring.pattern.type)
                  ? new Date(incomeData.date).getDate()
                  : null,
                recurring.pattern.type === 'WEEKLY'
                  ? new Date(incomeData.date).getDay()
                  : null,
                recurring.pattern.type === 'YEARLY'
                  ? new Date(incomeData.date).getMonth() + 1
                  : null,
              ),
            },
          },
        }),
      };

      return await this.prisma.income.create({
        data: incomeCreate,
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
      throw new BadRequestException('Failed to create income record');
    }
  }

  async update(userId: string, updateIncomeDto: UpdateIncomeDto) {
    const { id, ...updateData } = updateIncomeDto;

    try {
      const income = await this.prisma.income.findFirst({
        where: { id, userId },
      });

      if (!income) {
        throw new NotFoundException('Income record not found');
      }

      const updateInput: Prisma.IncomeUncheckedUpdateInput = {
        ...updateData,
        ...(updateData.date && {
          partitionKey: this.generatePartitionKey(new Date(updateData.date)),
        }),
      };

      return await this.prisma.income.update({
        where: { id },
        data: updateInput,
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update income record');
    }
  }

  async void(userId: string, voidIncomeDto: VoidIncomeDto) {
    try {
      const income = await this.prisma.income.findFirst({
        where: { id: voidIncomeDto.id, userId },
      });

      if (!income) {
        throw new NotFoundException('Income record not found');
      }

      return await this.prisma.income.update({
        where: { id: voidIncomeDto.id },
        data: { isVoid: true },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to void income record');
    }
  }
}
