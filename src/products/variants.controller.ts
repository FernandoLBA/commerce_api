import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { VariantsService } from './variants.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createVariantDto: CreateVariantDto) {
    return this.variantsService.create(createVariantDto);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.variantsService.findAllByProduct(productId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.variantsService.findOne(id);
  }

  @Get('sku/:sku')
  findBySku(@Param('sku') sku: string) {
    return this.variantsService.findBySku(sku);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVariantDto: UpdateVariantDto,
  ) {
    return this.variantsService.update(id, updateVariantDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.variantsService.remove(id);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.variantsService.updateStock(id, quantity);
  }

  @Get(':id/availability')
  checkAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.variantsService.checkAvailability(id, quantity || 1);
  }
}
