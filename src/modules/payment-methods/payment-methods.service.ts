import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodEnum } from '@prisma/client';
import { QueryPaymentMethodDto } from './dto/query-payment-method.dto';
import { PaymentMethodsSeeder } from './seeds/payment-methods.seeder';

@Injectable()
export class PaymentMethodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentMethodsSeeder: PaymentMethodsSeeder,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(userId: string, query: QueryPaymentMethodDto = {}) {
    try {
      // Create a cache key based on the userId and query parameters
      const cacheKey = `payment-methods:${userId}:${JSON.stringify(query)}`;
      
      // Try to get data from cache first
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const { search, isDefault, isSystem } = query;
      
      const paymentMethods = await this.prisma.paymentMethod.findMany({
        where: {
          userId,
          ...(isDefault !== undefined && { isDefault }),
          ...(isSystem !== undefined && { isSystem }),
        },
        include: {
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

      // Filter results by name if search parameter is provided
      let filteredPaymentMethods = paymentMethods;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredPaymentMethods = paymentMethods.filter(method => 
          method.name.toLowerCase().includes(searchLower)
        );
      }

      const result = filteredPaymentMethods.map((method) => ({
        ...method,
        transactionCount: method._count?.expenses + method._count?.incomes || 0,
        _count: undefined,
      }));
      
      // Store in cache for future requests
      await this.cacheManager.set(cacheKey, result);
      
      return result;
    } catch (error) {
      throw new BadRequestException('Failed to fetch payment methods');
    }
  }

  async findOne(userId: string, id: string) {
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { 
        id,
        userId,
      },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    return paymentMethod;
  }

  async findByName(name: PaymentMethodEnum, userId: string) {
    return this.prisma.paymentMethod.findFirst({
      where: { 
        name,
        userId,
      },
    });
  }

  async create(userId: string, createPaymentMethodDto: CreatePaymentMethodDto) {
    // Check if payment method with this name already exists for this user
    const existingMethod = await this.prisma.paymentMethod.findFirst({
      where: { 
        name: createPaymentMethodDto.name,
        userId,
      },
    });

    if (existingMethod) {
      throw new ConflictException(`Payment method ${createPaymentMethodDto.name} already exists`);
    }

    return this.prisma.paymentMethod.create({
      data: {
        ...createPaymentMethodDto,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async update(userId: string, id: string, updatePaymentMethodDto: UpdatePaymentMethodDto) {
    // Check if payment method exists and belongs to the user
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { 
        id,
        userId,
      },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    // Cannot update name as it's an enum value tied to the ID
    const { id: _, ...updateData } = updatePaymentMethodDto;

    return this.prisma.paymentMethod.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(userId: string, id: string) {
    // Check if payment method exists and belongs to the user
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { 
        id,
        userId,
      },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    // Check if payment method is in use
    const expenseCount = await this.prisma.expense.count({
      where: { 
        paymentMethodId: id,
        userId,
      },
    });

    const incomeCount = await this.prisma.income.count({
      where: { 
        paymentMethodId: id,
        userId,
      },
    });

    if (expenseCount > 0 || incomeCount > 0) {
      throw new ConflictException(`Payment method is in use and cannot be deleted`);
    }

    return this.prisma.paymentMethod.delete({
      where: { id },
    });
  }

  async findDefaultPaymentMethods(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  async findSystemPaymentMethods() {
    return this.prisma.paymentMethod.findMany({
      where: {
        isSystem: true,
      },
    });
  }

  async seedDefaultPaymentMethods(userId: string) {
    return this.paymentMethodsSeeder.seedDefaultPaymentMethods(userId);
  }

  async seedUserDefaultPaymentMethods(userId: string) {
    return this.paymentMethodsSeeder.seedDefaultPaymentMethods(userId);
  }
} 