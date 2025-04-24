import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, Type } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../services/encryption.service';
import { ContextType } from '@nestjs/common/interfaces/features/arguments-host.interface';

export const mockExecutionContext = (request: any): ExecutionContext => ({
  switchToHttp: () => ({
    getRequest: () => request,
    getResponse: () => ({} as any),
    getNext: () => ({} as any),
  }),
  getType: <TContext extends string = ContextType>() => 'http' as TContext,
  getClass: () => ({} as Type<any>),
  getHandler: () => (() => {}) as Function,
  getArgs: <T extends Array<any> = any[]>() => [request] as T,
  getArgByIndex: <T = any>(index: number): T => [request][index] as T,
  switchToRpc: () => ({
    getContext: () => ({} as any),
    getData: () => ({} as any),
  }),
  switchToWs: () => ({
    getClient: () => ({} as any),
    getData: () => ({} as any),
    getPattern: () => ({} as any),
  }),
});

export const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  expense: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  income: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
};

export const mockJwtService = {
  sign: jest.fn(() => 'mock.jwt.token'),
  verify: jest.fn(),
};

export const mockEncryptionService = {
  encrypt: jest.fn((data) => `encrypted_${data}`),
  decrypt: jest.fn((data) => data.replace('encrypted_', '')),
  encryptObject: jest.fn(),
  decryptObject: jest.fn(),
};

export const createTestingModule = async (providers: any[]): Promise<TestingModule> => {
  return Test.createTestingModule({
    providers: [
      ...providers,
      {
        provide: PrismaService,
        useValue: mockPrismaService,
      },
      {
        provide: JwtService,
        useValue: mockJwtService,
      },
      {
        provide: EncryptionService,
        useValue: mockEncryptionService,
      },
    ],
  }).compile();
};

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'USER',
  isActive: true,
};

export const mockCategory = {
  id: 'test-category-id',
  name: 'Test Category',
  icon: '💰',
  userId: mockUser.id,
  typeId: 'expense',
};

export const mockExpense = {
  id: 'test-expense-id',
  amount: 100,
  description: 'Test expense',
  date: new Date(),
  categoryId: mockCategory.id,
  userId: mockUser.id,
  paymentMethodId: 'test-payment-method-id',
};

export const mockIncome = {
  id: 'test-income-id',
  amount: 1000,
  description: 'Test income',
  date: new Date(),
  categoryId: mockCategory.id,
  userId: mockUser.id,
  paymentMethodId: 'test-payment-method-id',
}; 