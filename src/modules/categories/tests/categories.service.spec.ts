import { Test } from '@nestjs/testing';
import { CategoriesService } from '../categories.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CategoryTypeEnum } from '../dto/create-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockCategory = {
    id: 'test-id',
    name: 'Test Category',
    icon: '💰',
    color: '#FF0000',
    typeId: 'test-type-id',
    userId: mockUser.id,
    budget: null,
    isDefault: false,
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    type: {
      id: 'test-type-id',
      name: CategoryTypeEnum.INCOME,
      icon: '💰',
    },
    _count: {
      expenses: 0,
      incomes: 0,
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            categoryType: {
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('findAll', () => {
    it('should return all categories for a user', async () => {
      const categories = [mockCategory];
      jest
        .spyOn(prismaService.category, 'findMany')
        .mockResolvedValue(categories);

      const result = await service.findAll(mockUser.id, {});

      expect(result).toEqual(
        categories.map((category) => ({
          ...category,
          transactionCount: category._count.expenses + category._count.incomes,
          _count: undefined,
        })),
      );
      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: {
          type: true,
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
    });
  });

  describe('findOne', () => {
    it('should return a single category', async () => {
      jest
        .spyOn(prismaService.category, 'findFirst')
        .mockResolvedValue(mockCategory);

      const result = await service.findOne(mockUser.id, mockCategory.id);

      expect(result).toEqual({
        ...mockCategory,
        transactionCount:
          mockCategory._count.expenses + mockCategory._count.incomes,
        _count: undefined,
      });
      expect(prismaService.category.findFirst).toHaveBeenCalledWith({
        where: { id: mockCategory.id, userId: mockUser.id },
        include: {
          type: true,
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
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      jest.spyOn(prismaService.category, 'findFirst').mockResolvedValue(null);

      await expect(
        service.findOne(mockUser.id, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createCategoryDto = {
      name: 'New Category',
      icon: '💰',
      type: CategoryTypeEnum.INCOME,
      color: '#FF0000',
    };

    it('should create a new category', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.categoryType, 'upsert').mockResolvedValue({
        id: 'test-type-id',
        name: CategoryTypeEnum.INCOME,
        icon: '💰',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(prismaService.category, 'create').mockResolvedValue({
        ...mockCategory,
        name: createCategoryDto.name,
      });

      const result = await service.create(mockUser.id, createCategoryDto);

      expect(result).toBeDefined();
      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: createCategoryDto.name,
          icon: createCategoryDto.icon,
          color: createCategoryDto.color,
          isDefault: false,
          isSystem: false,
          typeId: 'test-type-id',
          userId: mockUser.id,
        },
        include: {
          type: true,
        },
      });
    });

    it('should throw ConflictException if category with same name exists', async () => {
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(mockCategory);

      await expect(
        service.create(mockUser.id, createCategoryDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const updateCategoryDto = {
      name: 'Updated Category',
      icon: '🔄',
    };

    it('should update a category', async () => {
      const updatedCategory = { ...mockCategory, ...updateCategoryDto };
      const findFirstMock = jest.spyOn(prismaService.category, 'findFirst');

      // First call - category lookup
      findFirstMock.mockResolvedValueOnce(mockCategory);
      // Second call - name check
      findFirstMock.mockResolvedValueOnce(null);

      jest
        .spyOn(prismaService.category, 'update')
        .mockResolvedValue(updatedCategory);

      const result = await service.update(
        mockUser.id,
        mockCategory.id,
        updateCategoryDto,
      );

      expect(result).toEqual(updatedCategory);
      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        data: expect.objectContaining(updateCategoryDto),
        include: {
          type: true,
        },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      jest.spyOn(prismaService.category, 'findFirst').mockResolvedValue(null);

      await expect(
        service.update(mockUser.id, 'non-existent-id', updateCategoryDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to update system category', async () => {
      const systemCategory = { ...mockCategory, isSystem: true };
      jest
        .spyOn(prismaService.category, 'findFirst')
        .mockResolvedValue(systemCategory);

      await expect(
        service.update(mockUser.id, systemCategory.id, updateCategoryDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      jest
        .spyOn(prismaService.category, 'findFirst')
        .mockResolvedValue(mockCategory);
      jest
        .spyOn(prismaService.category, 'delete')
        .mockResolvedValue(mockCategory);

      const result = await service.remove(mockUser.id, mockCategory.id);

      expect(result).toEqual(mockCategory);
      expect(prismaService.category.delete).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      jest.spyOn(prismaService.category, 'findFirst').mockResolvedValue(null);

      await expect(
        service.remove(mockUser.id, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to delete system category', async () => {
      const systemCategory = { ...mockCategory, isSystem: true };
      jest
        .spyOn(prismaService.category, 'findFirst')
        .mockResolvedValue(systemCategory);

      await expect(
        service.remove(mockUser.id, systemCategory.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if trying to delete default category', async () => {
      const defaultCategory = { ...mockCategory, isDefault: true };
      jest
        .spyOn(prismaService.category, 'findFirst')
        .mockResolvedValue(defaultCategory);

      await expect(
        service.remove(mockUser.id, defaultCategory.id),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
