import { Controller, Get, Post, Put, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { QueryIncomeDto } from './dto/query-income.dto';
import { VoidIncomeDto } from './dto/void-income.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IUser } from '../users/interfaces/user.interface';

@Controller('income')
@UseGuards(JwtAuthGuard)
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Get()
  async findAll(@CurrentUser() user: IUser, @Query() query: QueryIncomeDto) {
    return this.incomeService.findAll(user.id, query);
  }

  @Post()
  async create(@CurrentUser() user: IUser, @Body() createIncomeDto: CreateIncomeDto) {
    return this.incomeService.create(user.id, createIncomeDto);
  }

  @Put()
  async update(@CurrentUser() user: IUser, @Body() updateIncomeDto: UpdateIncomeDto) {
    return this.incomeService.update(user.id, updateIncomeDto);
  }

  @Delete()
  async void(@CurrentUser() user: IUser, @Query() voidIncomeDto: VoidIncomeDto) {
    return this.incomeService.void(user.id, voidIncomeDto);
  }
} 