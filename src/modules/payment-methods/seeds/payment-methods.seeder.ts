import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentMethodEnum } from '@prisma/client';

@Injectable()
export class PaymentMethodsSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaultPaymentMethods(userId: string) {
    // Create default payment methods if they don't exist
    const paymentMethods = Object.values(PaymentMethodEnum);
    const defaultIcons = {
      [PaymentMethodEnum.CASH]: 'cash',
      [PaymentMethodEnum.CREDIT_CARD]: 'credit-card',
      [PaymentMethodEnum.DEBIT_CARD]: 'debit-card',
      [PaymentMethodEnum.BANK_TRANSFER]: 'bank',
      [PaymentMethodEnum.CHECK]: 'check',
      [PaymentMethodEnum.CRYPTO]: 'crypto',
      [PaymentMethodEnum.OTHER]: 'other',
    };

    await Promise.all(
      paymentMethods.map((methodName) =>
        this.prisma.paymentMethod.upsert({
          where: {
            userId_name: {
              userId,
              name: methodName,
            },
          },
          update: {},
          create: {
            name: methodName,
            icon: defaultIcons[methodName] || 'default',
            isDefault: true,
            isSystem: true,
            userId,
          },
        }),
      ),
    );

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
}
