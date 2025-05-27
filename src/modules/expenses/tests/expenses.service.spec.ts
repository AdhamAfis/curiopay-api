import { Test } from '@nestjs/testing';
import { ExpensesService } from '../expenses.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { EncryptionService } from '../../../common/services/encryption.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { mockUser, mockCategory } from '../../../common/test/test-utils';
import { Decimal } from '@prisma/client/runtime/library';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let prismaService: PrismaService;
  let encryptionService: EncryptionService;

  const mockExpense = {
    id: 'test-expense-id',
    amount: new Decimal(100),
    description: 'Test expense',
    date: new Date(),
    categoryId: mockCategory.id,
    userId: mockUser.id,
    paymentMethodId: 'test-payment-method-id',
    notes: null,
    isVoid: false,
    voidReason: null,
    originalAmount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    partitionKey: null,
    auditLog: null,
    securityLevel: 1,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: PrismaService,
          useValue: {
            expense: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
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

    service = module.get<ExpensesService>(ExpensesService);
    prismaService = module.get<PrismaService>(PrismaService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  describe('findAll', () => {
    it('should return all expenses for a user', async () => {
      const expenses = [mockExpense];
      jest.spyOn(prismaService.expense, 'findMany').mockResolvedValue(expenses);

      const result = await service.findAll(mockUser.id, { page: 1, limit: 10 });

      expect(result).toEqual(expenses);
      expect(prismaService.expense.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isVoid: false },
        include: {
          category: true,
          paymentMethod: true,
          recurring: {
            include: { pattern: true },
          },
        },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single expense', async () => {
      jest
        .spyOn(prismaService.expense, 'findUnique')
        .mockResolvedValue(mockExpense);

      const result = await service.findOne(mockExpense.id, mockUser.id);

      expect(result).toEqual(mockExpense);
      expect(prismaService.expense.findUnique).toHaveBeenCalledWith({
        where: { id: mockExpense.id },
        include: {
          category: true,
          paymentMethod: true,
          recurring: {
            include: { pattern: true },
          },
        },
      });
    });

    it('should throw NotFoundException if expense not found', async () => {
      jest.spyOn(prismaService.expense, 'findUnique').mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createExpenseData = {
      amount: new Decimal(100),
      description: 'Test expense',
      date: new Date(),
      categoryId: mockCategory.id,
      paymentMethodId: 'test-payment-method-id',
      notes: 'Test notes',
    };

    it('should create a new expense', async () => {
      const createdExpense = { ...mockExpense, notes: createExpenseData.notes };
      jest
        .spyOn(prismaService.expense, 'create')
        .mockResolvedValue(createdExpense);

      const result = await service.create(createExpenseData, mockUser.id);

      expect(result).toEqual(createdExpense);
      expect(prismaService.expense.create).toHaveBeenCalledWith({
        data: {
          ...createExpenseData,
          userId: mockUser.id,
          description: expect.stringContaining('encrypted_'),
          notes: expect.stringContaining('encrypted_'),
        },
        include: {
          category: true,
          paymentMethod: true,
          recurring: {
            include: { pattern: true },
          },
        },
      });
      expect(encryptionService.encrypt).toHaveBeenCalledWith(
        createExpenseData.description,
      );
      expect(encryptionService.encrypt).toHaveBeenCalledWith(
        createExpenseData.notes,
      );
    });

    it('should throw BadRequestException if creation fails', async () => {
      jest
        .spyOn(prismaService.expense, 'create')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        service.create(createExpenseData, mockUser.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateExpenseData = {
      amount: new Decimal(150),
      description: 'Updated expense',
      userId: mockUser.id,
    };

    it('should update an expense', async () => {
      const updatedExpense = { ...mockExpense, ...updateExpenseData };
      jest
        .spyOn(prismaService.expense, 'findUnique')
        .mockResolvedValue(mockExpense);
      jest
        .spyOn(prismaService.expense, 'update')
        .mockResolvedValue(updatedExpense);

      const result = await service.update(mockExpense.id, updateExpenseData);

      expect(result).toEqual(updatedExpense);
      expect(prismaService.expense.update).toHaveBeenCalledWith({
        where: { id: mockExpense.id },
        data: {
          ...updateExpenseData,
          description: expect.stringContaining('encrypted_'),
        },
        include: {
          category: true,
          paymentMethod: true,
          recurring: {
            include: { pattern: true },
          },
        },
      });
    });

    it('should throw NotFoundException if expense not found', async () => {
      jest.spyOn(prismaService.expense, 'findUnique').mockResolvedValue(null);

      await expect(
        service.update(mockExpense.id, updateExpenseData),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete an expense', async () => {
      const deletedExpense = { ...mockExpense, isVoid: true };
      jest
        .spyOn(prismaService.expense, 'findUnique')
        .mockResolvedValue(mockExpense);
      jest
        .spyOn(prismaService.expense, 'update')
        .mockResolvedValue(deletedExpense);

      const result = await service.remove(mockExpense.id, mockUser.id);

      expect(result).toEqual(deletedExpense);
      expect(prismaService.expense.update).toHaveBeenCalledWith({
        where: { id: mockExpense.id },
        data: { isVoid: true },
      });
    });

    it('should throw NotFoundException if expense not found', async () => {
      jest.spyOn(prismaService.expense, 'findUnique').mockResolvedValue(null);

      await expect(
        service.remove('non-existent-id', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
