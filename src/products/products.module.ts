import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';
import { VariantsService } from './variants.service';
import { VariantsController } from './variants.controller';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from '../categories/entities/category.entity';
import { CloudinaryService } from '../common';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      ProductAttribute,
      ProductAttributeValue,
      ProductImage,
      Category,
    ]),
  ],
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
  ],
  exports: [ProductsService, VariantsService, AttributesService, ImagesService],
})
export class ProductsModule {}
