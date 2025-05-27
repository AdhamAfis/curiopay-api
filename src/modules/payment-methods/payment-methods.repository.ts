import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod, Prisma } from '@prisma/client';

@Injectable()
export class PaymentMethodsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findUnique({
      where: { id },
    });
  }

  async findByUserId(
    id: string,
    userId: string,
  ): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    userId: string;
    search?: string;
    isDefault?: boolean;
    isSystem?: boolean;
  }): Promise<{ paymentMethods: PaymentMethod[]; total: number }> {
    const { skip, take, userId, search, isDefault, isSystem } = params;

    const where: Prisma.PaymentMethodWhereInput = {
      userId,
      ...(isDefault !== undefined && { isDefault }),
      ...(isSystem !== undefined && { isSystem }),
    };

    const [paymentMethods, total] = await Promise.all([
      this.prisma.paymentMethod.findMany({
        skip,
        take,
        where,
        include: {
          _count: {
            select: {
              expenses: true,
              incomes: true,
            },
          },
        },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.paymentMethod.count({ where }),
    ]);

    let filteredPaymentMethods = paymentMethods;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPaymentMethods = paymentMethods.filter((method) =>
        method.name.toLowerCase().includes(searchLower),
      );
    }

    return {
      paymentMethods: filteredPaymentMethods.map((method) => ({
        ...method,
        transactionCount: method._count?.expenses + method._count?.incomes || 0,
        _count: undefined,
      })),
      total: search ? filteredPaymentMethods.length : total,
    };
  }

  async create(data: Prisma.PaymentMethodCreateInput): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.create({
      data,
    });
  }

  async update(
    id: string,
    data: Prisma.PaymentMethodUpdateInput,
  ): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.delete({
      where: { id },
    });
  }

  async findDefaultPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({
      where: {
        userId,
        isDefault: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findSystemPaymentMethods(): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({
      where: {
        isSystem: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
