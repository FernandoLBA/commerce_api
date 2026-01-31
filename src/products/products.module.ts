import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';
import { VariantsService } from './variants.service';
import { VariantsController } from './variants.controller';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { CloudinaryService } from '../common';
import { SlugService } from 'src/common/services/slug.service';

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
  ],
  exports: [ProductsService, VariantsService, AttributesService, ImagesService],
})
export class ProductsModule {}
