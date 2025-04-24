import { Test } from '@nestjs/testing';
import { IncomesService } from '../incomes.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { EncryptionService } from '../../../common/services/encryption.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { mockUser, mockCategory } from '../../../common/test/test-utils';
import { Decimal } from '@prisma/client/runtime/library';

describe('IncomesService', () => {
  let service: IncomesService;
  let prismaService: PrismaService;
  let encryptionService: EncryptionService;

  const mockIncome = {
    id: 'test-id',
    amount: new Decimal(1000),
    description: 'Test income',
    date: new Date(),
    categoryId: 'test-category-id',
    userId: mockUser.id,
    paymentMethodId: 'test-payment-method-id',
    notes: 'Test notes',
    isVoid: false,
    voidReason: null,
    originalAmount: new Decimal(1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    securityLevel: 1,
    partitionKey: 'test-partition',
    auditLog: null,
    severity: 1,
    category: mockCategory,
    paymentMethod: {
      id: 'test-payment-method-id',
      name: 'Test Payment Method',
      icon: '💳',
      isDefault: false,
      userId: mockUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    recurring: null
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        IncomesService,
        {
          provide: PrismaService,
          useValue: {
            income: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
              aggregate: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback()),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn((data) => `encrypted_${data}`),
            decrypt: jest.fn((data) => data.replace('encrypted_', '')),
          },
        },
      ],
    }).compile();

    service = module.get<IncomesService>(IncomesService);
    prismaService = module.get<PrismaService>(PrismaService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  describe('findAll', () => {
    it('should return all incomes for a user', async () => {
      const incomes = [mockIncome];
      jest.spyOn(prismaService.income, 'findMany').mockResolvedValue(incomes);

      const result = await service.findAll(mockUser.id, {});
      
      expect(result).toEqual(incomes);
      expect(prismaService.income.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isVoid: false },
        include: {
          category: true,
          paymentMethod: true,
          recurring: {
            include: { pattern: true },
          },
        },
        skip: undefined,
        take: undefined,
        orderBy: { date: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single income', async () => {
      jest.spyOn(prismaService.income, 'findUnique').mockResolvedValue(mockIncome);

      const result = await service.findOne(mockIncome.id);
      
      expect(result).toEqual(mockIncome);
      expect(prismaService.income.findUnique).toHaveBeenCalledWith({
        where: { id: mockIncome.id },
        include: {
          category: true,
          paymentMethod: true,
          recurring: {
            include: { pattern: true },
          },
        },
      });
    });

    it('should throw NotFoundException if income not found', async () => {
      jest.spyOn(prismaService.income, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent-id'))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createIncomeDto = {
      amount: new Decimal(1000),
      description: 'Test income',
      date: new Date(),
      categoryId: 'test-category-id',
      paymentMethodId: 'test-payment-method-id',
      notes: 'Test notes',
      userId: mockUser.id,
    };

    it('should create a new income', async () => {
      const createdIncome = { ...mockIncome };
      jest.spyOn(prismaService.income, 'create').mockResolvedValue(createdIncome);

      const result = await service.create(createIncomeDto);
      
      expect(result).toEqual(createdIncome);
      expect(prismaService.income.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createIncomeDto,
          partitionKey: expect.any(String),
        }),
        include: {
          category: true,
          paymentMethod: true,
          recurring: {
            include: { pattern: true },
          },
        },
      });
    });

    it('should throw BadRequestException if creation fails', async () => {
      jest.spyOn(prismaService.income, 'create').mockRejectedValue(new Error('Database error'));
      jest.spyOn(service, 'create').mockRejectedValue(new BadRequestException('Failed to create income'));

      await expect(service.create(createIncomeDto))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateIncomeDto = {
      amount: new Decimal(1500),
      description: 'Updated income',
    };

    it('should update an income', async () => {
      const updatedIncome = { ...mockIncome, ...updateIncomeDto };
      jest.spyOn(prismaService.income, 'update').mockResolvedValue(updatedIncome);

      const result = await service.update(mockIncome.id, updateIncomeDto);
      
      expect(result).toEqual(updatedIncome);
      expect(prismaService.income.update).toHaveBeenCalledWith({
        where: { id: mockIncome.id },
        data: updateIncomeDto,
        include: {
          category: true,
          paymentMethod: true,
          recurring: {
            include: { pattern: true },
          },
        },
      });
    });

    it('should throw NotFoundException if income not found', async () => {
      jest.spyOn(prismaService.income, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.income, 'update').mockRejectedValue(new NotFoundException());

      await expect(service.update('non-existent-id', updateIncomeDto))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete an income', async () => {
      const deletedIncome = { ...mockIncome, isVoid: true };
      jest.spyOn(prismaService.income, 'update').mockResolvedValue(deletedIncome);

      const result = await service.remove(mockIncome.id);
      
      expect(result).toEqual(deletedIncome);
      expect(prismaService.income.update).toHaveBeenCalledWith({
        where: { id: mockIncome.id },
        data: { isVoid: true },
      });
    });

    it('should throw NotFoundException if income not found', async () => {
      jest.spyOn(prismaService.income, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.income, 'update').mockRejectedValue(new NotFoundException());

      await expect(service.remove('non-existent-id'))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('getMonthlyTotal', () => {
    it('should return total income for a month', async () => {
      const total = { _count: {}, _avg: {}, _sum: { amount: new Decimal(5000) }, _min: {}, _max: {} };
      jest.spyOn(prismaService.income, 'aggregate').mockResolvedValue(total);

      const result = await service.getMonthlyTotal(mockUser.id, 2024, 1);
      
      expect(result).toBe(5000);
      expect(prismaService.income.aggregate).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          isVoid: false,
          date: {
            gte: new Date(2024, 0, 1),
            lt: new Date(2024, 1, 1),
          },
        },
        _sum: {
          amount: true,
        },
      });
    });

    it('should return 0 if no income found', async () => {
      const total = { _count: {}, _avg: {}, _sum: { amount: null }, _min: {}, _max: {} };
      jest.spyOn(prismaService.income, 'aggregate').mockResolvedValue(total);

      const result = await service.getMonthlyTotal(mockUser.id, 2024, 1);
      
      expect(result).toBe(0);
    });
  });
}); 