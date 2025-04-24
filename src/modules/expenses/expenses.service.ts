import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ExpensesRepository } from './expenses.repository';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { VoidExpenseDto } from './dto/void-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private expensesRepository: ExpensesRepository) {}

  async create(userId: string, createExpenseDto: CreateExpenseDto) {
    return this.expensesRepository.create({
      date: createExpenseDto.date,
      description: createExpenseDto.description,
      amount: createExpenseDto.amount,
      notes: createExpenseDto.notes,
      category: {
        connect: { id: createExpenseDto.categoryId },
      },
      paymentMethod: {
        connect: { id: createExpenseDto.paymentMethodId },
      },
      user: {
        connect: { id: userId },
      },
    });
  }

  async findAll(userId: string, queryDto: QueryExpenseDto) {
    const { page = 1, limit = 10, categoryId, startDate, endDate, includeVoid } = queryDto;
    const skip = (page - 1) * limit;
    
    return this.expensesRepository.findAll({
      skip,
      take: limit,
      userId,
      categoryId,
      startDate,
      endDate,
      includeVoid,
    });
  }

  async findOne(id: string, userId: string) {
    const expense = await this.expensesRepository.findById(id);
    
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    
    if (expense.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this expense');
    }
    
    return expense;
  }

  async update(id: string, userId: string, updateExpenseDto: UpdateExpenseDto) {
    // Verify the expense exists and belongs to the user
    await this.findOne(id, userId);
    
    const updateData: any = { ...updateExpenseDto };
    
    // Handle relations
    if (updateExpenseDto.categoryId) {
      updateData.category = { connect: { id: updateExpenseDto.categoryId } };
      delete updateData.categoryId;
    }
    
    if (updateExpenseDto.paymentMethodId) {
      updateData.paymentMethod = { connect: { id: updateExpenseDto.paymentMethodId } };
      delete updateData.paymentMethodId;
    }
    
    return this.expensesRepository.update(id, updateData);
  }

  async remove(id: string, userId: string) {
    // Verify the expense exists and belongs to the user
    await this.findOne(id, userId);
    
    return this.expensesRepository.delete(id);
  }

  async void(id: string, userId: string, voidDto: VoidExpenseDto) {
    // Verify the expense exists and belongs to the user
    const expense = await this.findOne(id, userId);
    
    if (expense.isVoid) {
      throw new ForbiddenException('This expense is already voided');
    }
    
    return this.expensesRepository.voidExpense(id, voidDto.reason);
  }

  async getTotalByCategory(userId: string, startDate: Date, endDate: Date) {
    return this.expensesRepository.getTotalExpensesByCategory(userId, startDate, endDate);
  }
} 