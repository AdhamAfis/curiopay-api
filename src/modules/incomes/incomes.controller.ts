import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IncomesService } from './incomes.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@ApiTags('incomes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new income' })
  @ApiResponse({ status: 201, description: 'Income created successfully.' })
  create(@Body() createIncomeDto: any, @GetUser() user: User) {
    return this.incomesService.create({
      ...createIncomeDto,
      userId: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all incomes' })
  @ApiResponse({ status: 200, description: 'Returns a list of incomes.' })
  findAll(
    @GetUser() user: User,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.incomesService.findAll(user.id, {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      categoryId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an income by id' })
  @ApiResponse({ status: 200, description: 'Returns the income.' })
  findOne(@Param('id') id: string) {
    return this.incomesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an income' })
  @ApiResponse({ status: 200, description: 'Income updated successfully.' })
  update(@Param('id') id: string, @Body() updateIncomeDto: any) {
    return this.incomesService.update(id, updateIncomeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an income' })
  @ApiResponse({ status: 200, description: 'Income deleted successfully.' })
  remove(@Param('id') id: string) {
    return this.incomesService.remove(id);
  }

  @Get('monthly/:year/:month')
  @ApiOperation({ summary: 'Get monthly total income' })
  @ApiResponse({ status: 200, description: 'Returns the monthly total.' })
  getMonthlyTotal(
    @GetUser() user: User,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.incomesService.getMonthlyTotal(
      user.id,
      parseInt(year),
      parseInt(month),
    );
  }
} 