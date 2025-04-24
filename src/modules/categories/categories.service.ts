import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    // Check for duplicate category name for this user
    const { categories } = await this.categoriesRepository.findAll({
      userId,
      take: 1,
      where: {
        name: createCategoryDto.name,
      },
    });

    if (categories.length > 0) {
      throw new ConflictException(`Category with name '${createCategoryDto.name}' already exists`);
    }

    return this.categoriesRepository.create({
      name: createCategoryDto.name,
      icon: createCategoryDto.icon,
      color: createCategoryDto.color,
      budget: createCategoryDto.budget,
      isDefault: createCategoryDto.isDefault || false,
      isSystem: false, // Users can't create system categories
      type: {
        connect: { id: createCategoryDto.typeId },
      },
      user: {
        connect: { id: userId },
      },
    });
  }

  async findAll(userId: string, queryDto: QueryCategoryDto) {
    const { page = 1, limit = 10, typeId } = queryDto;
    const skip = (page - 1) * limit;
    
    return this.categoriesRepository.findAll({
      skip,
      take: limit,
      userId,
      typeId,
    });
  }

  async findOne(id: string, userId: string) {
    const category = await this.categoriesRepository.findById(id);
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    // System categories are accessible to all users
    if (!category.isSystem && category.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this category');
    }
    
    return category;
  }

  async update(id: string, userId: string, updateCategoryDto: UpdateCategoryDto) {
    // Verify the category exists and belongs to the user
    const category = await this.findOne(id, userId);
    
    if (category.isSystem) {
      throw new ForbiddenException('System categories cannot be modified');
    }
    
    const updateData: any = { ...updateCategoryDto };
    
    // Handle relations
    if (updateCategoryDto.typeId) {
      updateData.type = { connect: { id: updateCategoryDto.typeId } };
      delete updateData.typeId;
    }
    
    return this.categoriesRepository.update(id, updateData);
  }

  async remove(id: string, userId: string) {
    // Verify the category exists and belongs to the user
    const category = await this.findOne(id, userId);
    
    if (category.isSystem) {
      throw new ForbiddenException('System categories cannot be deleted');
    }
    
    // TODO: Check if there are any expenses using this category
    // If there are, we should either prevent deletion or implement a soft delete
    
    return this.categoriesRepository.delete(id);
  }

  async findAllTypes() {
    return this.categoriesRepository.findAllTypes();
  }

  async findDefaultCategories(userId: string) {
    return this.categoriesRepository.findDefaultCategories(userId);
  }

  async findSystemCategories() {
    return this.categoriesRepository.findSystemCategories();
  }
} 