import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Role, Roles, RolesGuard } from 'src/common';
import { AllowedFileSizes } from 'src/common/enums';
import { FilesValidationPipe } from 'src/common/pipes';
import { CreateProductDto, UpdateProductDto } from './dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    return this.productsService.findAll(categoryId);
  }

  @Get(':search')
  findOne(@Param('search') search: string) {
    return this.productsService.findOne(search);
  }

  @Post(':productId/files/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FilesInterceptor('files', 6, {
      limits: { fieldSize: AllowedFileSizes.IMAGE },
    }),
  )
  async uploadImagesToCloudinary(
    @Param('productId') productId: string,
    @UploadedFiles(new FilesValidationPipe())
    files: Express.Multer.File[],
  ) {
    return await this.productsService.uploadFiles(productId, files);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('slug') slug: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(slug, updateProductDto);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('slug') slug: string) {
    return this.productsService.removeOne(slug);
  }

  @Delete(':imageId/files/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteImage(@Param('imageId') imageId: string): Promise<string> {
    return await this.productsService.deleteImage(imageId);
  }
}
