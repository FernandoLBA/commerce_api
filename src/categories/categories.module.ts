import { Module } from '@nestjs/common';

import { CloudinaryService } from 'src/common';
import { SlugService } from 'src/common/services/slug.service';
import { FilesService } from 'src/files/files.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, FilesService, CloudinaryService, SlugService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
