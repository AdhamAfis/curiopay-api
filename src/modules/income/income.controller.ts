import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { QueryIncomeDto } from './dto/query-income.dto';
import { VoidIncomeDto } from './dto/void-income.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IUser } from '../users/interfaces/user.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { BaseController } from '../../common/base.controller';

@ApiTags('income')
@ApiBearerAuth('JWT-auth')
@Controller('income')
@UseGuards(JwtAuthGuard)
export class IncomeController extends BaseController {
  constructor(private readonly incomeService: IncomeService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Get all income records with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns income records with pagination.',
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
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'paymentMethodId',
    required: false,
    description: 'Filter by payment method ID',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    description: 'Search in description',
  })
  @ApiQuery({
    name: 'minAmount',
    required: false,
    description: 'Minimum amount in cents',
  })
  @ApiQuery({
    name: 'maxAmount',
    required: false,
    description: 'Maximum amount in cents',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: 'number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: 'number',
  })
  async findAll(@CurrentUser() user: IUser, @Query() query: QueryIncomeDto) {
    return this.incomeService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an income record by ID' })
  @ApiParam({
    name: 'id',
    description: 'Income ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the income record.',
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
  @ApiResponse({ status: 404, description: 'Income record not found' })
  async findById(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.incomeService.findById(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new income record' })
  @ApiResponse({
    status: 201,
    description: 'Income record created successfully.',
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
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(
    @CurrentUser() user: IUser,
    @Body() createIncomeDto: CreateIncomeDto,
  ) {
    return this.incomeService.create(user.id, createIncomeDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update an income record' })
  @ApiResponse({
    status: 200,
    description: 'Income record updated successfully.',
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
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Income record not found.' })
  async update(
    @CurrentUser() user: IUser,
    @Body() updateIncomeDto: UpdateIncomeDto,
  ) {
    return this.incomeService.update(user.id, updateIncomeDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Void an income record' })
  @ApiResponse({
    status: 200,
    description: 'Income record voided successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Income record not found.' })
  @ApiQuery({
    name: 'id',
    required: true,
    description: 'Income record ID to void',
  })
  async void(
    @CurrentUser() user: IUser,
    @Query() voidIncomeDto: VoidIncomeDto,
  ) {
    return this.incomeService.void(user.id, voidIncomeDto);
  }

  @Get('stats/by-category')
  @ApiOperation({ summary: 'Get income totals by category' })
  @ApiResponse({
    status: 200,
    description: 'Returns income totals by category.',
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
  async getIncomeTotalsByCategory(
    @Query() query: QueryIncomeDto,
    @CurrentUser() user: IUser,
  ) {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('Start date and end date are required');
    }
    return this.incomeService.getIncomeTotalsByCategory(
      user.id,
      new Date(query.startDate),
      new Date(query.endDate),
    );
  }
}
