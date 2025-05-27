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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
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

@ApiTags('categories')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(AdminPropertiesGuard())
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create a new category',
    description:
      'Creates a new category. Note: Setting isDefault or isSystem to true requires admin privileges.',
  })
  @ApiResponse({ status: 201, description: 'Category created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden. Admin privileges required for setting isDefault or isSystem.',
  })
  @ApiResponse({ status: 409, description: 'Category already exists.' })
  async create(
    @CurrentUser() user: IUser,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.id, createCategoryDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Returns a list of categories.' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by type',
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
  async findAll(@CurrentUser() user: IUser, @Query() query: QueryCategoryDto) {
    return this.categoriesService.findAll(user.id, query);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ status: 200, description: 'Returns the category.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async findOne(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.categoriesService.findOne(user.id, id);
  }

  @Patch(':id')
  @UseGuards(AdminPropertiesGuard())
  @ApiOperation({
    summary: 'Update a category',
    description:
      'Updates a category. Note: Setting isDefault or isSystem to true requires admin privileges.',
  })
  @ApiResponse({ status: 200, description: 'Category updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden. Admin privileges required for setting isDefault or isSystem.',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async update(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.id, id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad request or category has associated transactions.',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async remove(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.categoriesService.remove(user.id, id);
  }

  @Get('types/all')
  @ApiOperation({ summary: 'Get all category types' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of category types.',
  })
  findAllTypes() {
    return this.categoriesService.findAllTypes();
  }

  @Get('default/all')
  @ApiOperation({ summary: 'Get all default categories' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of default categories.',
  })
  findDefaultCategories(@CurrentUser() user: IUser) {
    return this.categoriesService.findDefaultCategories(user.id);
  }

  @Get('system/all')
  @ApiOperation({ summary: 'Get all system categories' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of system categories.',
  })
  findSystemCategories() {
    return this.categoriesService.findSystemCategories();
  }
}
