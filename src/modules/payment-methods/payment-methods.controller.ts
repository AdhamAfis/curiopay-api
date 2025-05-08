import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  Header,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { QueryPaymentMethodDto } from './dto/query-payment-method.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminPropertiesGuard } from '../../common/guards/admin-properties.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IUser } from '../users/interfaces/user.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('payment-methods')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @UseGuards(AdminPropertiesGuard())
  @HttpCode(201)
  @ApiOperation({ 
    summary: 'Create a new payment method',
    description: 'Creates a new payment method. Note: Setting isDefault or isSystem to true requires admin privileges.'
  })
  @ApiResponse({ status: 201, description: 'Payment method created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin privileges required for setting isDefault or isSystem.' })
  @ApiResponse({ status: 409, description: 'Payment method already exists.' })
  async create(
    @CurrentUser() user: IUser,
    @Body() createPaymentMethodDto: CreatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.create(user.id, createPaymentMethodDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({ summary: 'Get all payment methods' })
  @ApiResponse({ status: 200, description: 'Returns a list of payment methods.' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name',
  })
  @ApiQuery({
    name: 'isDefault',
    required: false,
    description: 'Filter by default flag',
  })
  @ApiQuery({
    name: 'isSystem',
    required: false,
    description: 'Filter by system flag',
  })
  async findAll(
    @CurrentUser() user: IUser,
    @Query() query: QueryPaymentMethodDto,
  ) {
    return this.paymentMethodsService.findAll(user.id, query);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({ summary: 'Get a payment method by ID' })
  @ApiResponse({ status: 200, description: 'Returns the payment method.' })
  @ApiResponse({ status: 404, description: 'Payment method not found.' })
  @ApiParam({ name: 'id', description: 'Payment method ID' })
  async findOne(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.paymentMethodsService.findOne(user.id, id);
  }

  @Patch(':id')
  @UseGuards(AdminPropertiesGuard())
  @ApiOperation({ 
    summary: 'Update a payment method',
    description: 'Updates a payment method. Note: Setting isDefault or isSystem to true requires admin privileges.'
  })
  @ApiResponse({ status: 200, description: 'Payment method updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin privileges required for setting isDefault or isSystem.' })
  @ApiResponse({ status: 404, description: 'Payment method not found.' })
  @ApiParam({ name: 'id', description: 'Payment method ID' })
  async update(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.update(user.id, id, updatePaymentMethodDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment method' })
  @ApiResponse({ status: 200, description: 'Payment method deleted successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad request or payment method has associated transactions.',
  })
  @ApiResponse({ status: 404, description: 'Payment method not found.' })
  @ApiParam({ name: 'id', description: 'Payment method ID' })
  async remove(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.paymentMethodsService.remove(user.id, id);
  }

  @Get('default/all')
  @ApiOperation({ summary: 'Get all default payment methods' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of default payment methods.',
  })
  findDefaultPaymentMethods(@CurrentUser() user: IUser) {
    return this.paymentMethodsService.findDefaultPaymentMethods(user.id);
  }

  @Get('system/all')
  @ApiOperation({ summary: 'Get all system payment methods' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of system payment methods.',
  })
  findSystemPaymentMethods() {
    return this.paymentMethodsService.findSystemPaymentMethods();
  }
} 