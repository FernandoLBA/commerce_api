import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { AllowedFileSizes } from '../common/enums';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { FilesValidationPipe } from '../common/pipes';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Patch(':slug/files/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: AllowedFileSizes.IMAGE },
    }),
  )
  async uploadFile(
    @Param('slug') slug: string,
    @UploadedFile(new FilesValidationPipe())
    file: Express.Multer.File,
  ) {
    return await this.categoriesService.uploadFile(slug, file);
  }

  @Get(':search')
  findOne(@Param('search') search: string) {
    return this.categoriesService.findOne(search);
  }

  @Patch(':slug')
  update(
    @Param('slug') slug: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(slug, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
