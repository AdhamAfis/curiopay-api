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
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 409, description: 'Category already exists.' })
  async create(@Req() req, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(req.user.id, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Returns categories with pagination.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(@Req() req, @Query() query: QueryCategoryDto) {
    return this.categoriesService.findAll(req.user.id, query);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all category types' })
  @ApiResponse({ status: 200, description: 'Returns all category types.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAllTypes() {
    return this.categoriesService.findAllTypes();
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default categories for the user' })
  @ApiResponse({ status: 200, description: 'Returns default categories.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findDefaultCategories(@Req() req) {
    return this.categoriesService.findDefaultCategories(req.user.id);
  }

  @Get('system')
  @ApiOperation({ summary: 'Get system categories' })
  @ApiResponse({ status: 200, description: 'Returns system categories.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findSystemCategories() {
    return this.categoriesService.findSystemCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Returns the category.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async findOne(@Req() req, @Param('id') id: string) {
    return this.categoriesService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, req.user.id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async remove(@Req() req, @Param('id') id: string) {
    return this.categoriesService.remove(id, req.user.id);
  }
}