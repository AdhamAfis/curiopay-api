import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { VoidExpenseDto } from './dto/void-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IUser } from '../users/interfaces/user.interface';

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({ status: 201, description: 'Expense created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(
    @CurrentUser() user: IUser,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.expensesService.create(user.id, createExpenseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns expenses with pagination.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(@CurrentUser() user: IUser, @Query() query: QueryExpenseDto) {
    return this.expensesService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expense by ID' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Returns the expense.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  async findById(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.expensesService.findById(id, user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update an expense' })
  @ApiResponse({ status: 200, description: 'Expense updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  async update(
    @CurrentUser() user: IUser,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user.id, updateExpenseDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  async void(
    @CurrentUser() user: IUser,
    @Query() voidExpenseDto: VoidExpenseDto,
  ) {
    return this.expensesService.void(user.id, voidExpenseDto);
  }

  @Get('stats/by-category')
  @ApiOperation({ summary: 'Get expense totals by category' })
  @ApiResponse({
    status: 200,
    description: 'Returns expense totals by category.',
  })
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
