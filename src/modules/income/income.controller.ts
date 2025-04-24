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
} from '@nestjs/swagger';

@ApiTags('income')
@Controller('income')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all income records with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns income records with pagination.',
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

  @Post()
  @ApiOperation({ summary: 'Create a new income record' })
  @ApiResponse({
    status: 201,
    description: 'Income record created successfully.',
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
}
