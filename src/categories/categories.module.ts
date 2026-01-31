import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { SlugService } from 'src/common/services/slug.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, SlugService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
