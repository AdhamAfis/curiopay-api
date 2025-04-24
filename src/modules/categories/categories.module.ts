import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';
import { CategoriesSeeder } from './seeds/categories.seeder';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository, CategoriesSeeder],
  exports: [CategoriesService, CategoriesRepository, CategoriesSeeder],
})
export class CategoriesModule {}
