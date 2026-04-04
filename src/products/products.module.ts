import { Module } from '@nestjs/common';

import { SlugService } from 'src/common/services/slug.service';
import { FilesService } from 'src/files/files.service';
import { CloudinaryService } from '../common';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { ProductImageService } from './product-image.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { VariantsController } from './variants.controller';
import { VariantsService } from './variants.service';

@Module({
  controllers: [
    ProductsController,
    AttributesController,
    VariantsController,
    ImagesController,
  ],
  providers: [
    ProductsService,
    AttributesService,
    VariantsService,
    ImagesService,
    CloudinaryService,
    SlugService,
    FilesService,
    ImagesService,
    ProductImageService,
  ],
  exports: [ProductsService, VariantsService, AttributesService, ImagesService],
})
export class ProductsModule {}
