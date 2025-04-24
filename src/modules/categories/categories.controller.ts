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
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({
    status: 409,
    description: 'Category with this name already exists.',
  })
  create(
    @CurrentUser() user: IUser,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.id, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of categories.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search categories by name',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by category type',
  })
  @ApiQuery({
    name: 'isDefault',
    required: false,
    description: 'Filter default categories',
  })
  @ApiQuery({
    name: 'isSystem',
    required: false,
    description: 'Filter system categories',
  })
  findAll(@CurrentUser() user: IUser, @Query() query: QueryCategoryDto) {
    return this.categoriesService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the category.',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  findOne(@CurrentUser() user: IUser, @Param('id') id: string) {
    return this.categoriesService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or system category.',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({
    status: 409,
    description: 'Category with this name already exists.',
  })
  update(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.id, id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully deleted.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Cannot delete: system category, default category, or has transactions.',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  remove(@CurrentUser() user: IUser, @Param('id') id: string) {
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
