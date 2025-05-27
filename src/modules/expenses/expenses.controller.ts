import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { VoidExpenseDto } from './dto/void-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IUser } from '../users/interfaces/user.interface';
import { BaseController } from '../../common/base.controller';

@ApiTags('expenses')
@Controller('expenses')
export class ExpensesController extends BaseController {
  constructor(private readonly expensesService: ExpensesService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({
    status: 201,
    description: 'Expense created successfully.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        amount: { type: 'number' },
        description: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
        categoryId: { type: 'string' },
        userId: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  async create(
    @CurrentUser() user: IUser,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.expensesService.create(createExpenseDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns expenses with pagination.',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              amount: { type: 'number' },
              description: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              categoryId: { type: 'string' },
              userId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: 'string',
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: 'string',
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: 'string',
    description: 'Category ID',
  })
  async findAll(@CurrentUser() user: IUser, @Query() query: QueryExpenseDto) {
    return this.expensesService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expense by ID' })
  @ApiParam({
    name: 'id',
    description: 'Expense ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the expense.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        amount: { type: 'number' },
        description: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
        categoryId: { type: 'string' },
        userId: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async findById(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.expensesService.findById(id, user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update an expense' })
  @ApiResponse({
    status: 200,
    description: 'Expense updated successfully.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        amount: { type: 'number' },
        description: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
        categoryId: { type: 'string' },
        userId: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async update(
    @CurrentUser() user: IUser,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user.id, updateExpenseDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiQuery({
    name: 'id',
    required: true,
    type: 'string',
    description: 'Expense ID to delete',
  })
  async remove(
    @CurrentUser() user: IUser,
    @Query() voidExpenseDto: VoidExpenseDto,
  ) {
    return this.expensesService.remove(voidExpenseDto.id, user.id);
  }

  @Get('stats/by-category')
  @ApiOperation({ summary: 'Get expense totals by category' })
  @ApiResponse({
    status: 200,
    description: 'Returns expense totals by category.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          categoryId: { type: 'string' },
          categoryName: { type: 'string' },
          total: { type: 'number' },
          count: { type: 'number' },
        },
      },
    },
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: 'string',
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: 'string',
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Missing date range' })
  async getExpenseTotalsByCategory(
    @Query() query: QueryExpenseDto,
    @CurrentUser() user: IUser,
  ) {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('Start date and end date are required');
    }
    return this.expensesService.getExpenseTotalsByCategory(
      user.id,
      new Date(query.startDate),
      new Date(query.endDate),
    );
  }
}
