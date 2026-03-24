import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ImagesService } from './images.service';

@Controller('products/:productId/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() createImageDto: CreateProductImageDto,
  ) {
    return this.imagesService.create(productId, createImageDto);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType: /^image\/(jpeg|jpg|png|webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('alt') alt?: string,
  ) {
    return this.imagesService.uploadFile(productId, file, { alt });
  }

  @Post('upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  uploadFromUrl(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body('url') url: string,
    @Body('alt') alt?: string,
  ) {
    return this.imagesService.uploadFromUrl(productId, url, { alt });
  }

  @Get()
  findAll(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.imagesService.findAllByProduct(productId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.imagesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateImageDto: UpdateProductImageDto,
  ) {
    return this.imagesService.update(id, updateImageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.imagesService.remove(id);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  reorder(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body('imageIds') imageIds: string[],
  ) {
    return this.imagesService.reorder(productId, imageIds);
  }
}
