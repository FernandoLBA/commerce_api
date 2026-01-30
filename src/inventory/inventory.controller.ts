import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SetAlertThresholdDto } from './dto/set-alert-threshold.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Adjust stock (admin only)
   */
  @Post('adjust')
  @Roles(Role.ADMIN)
  adjustStock(
    @Body() adjustStockDto: AdjustStockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventoryService.adjustStock(adjustStockDto, userId);
  }

  /**
   * Set alert threshold (admin only)
   */
  @Post('alerts')
  @Roles(Role.ADMIN)
  setAlertThreshold(@Body() setAlertDto: SetAlertThresholdDto) {
    return this.inventoryService.setAlertThreshold(setAlertDto);
  }

  /**
   * Get all low stock items
   */
  @Get('low-stock')
  @Roles(Role.ADMIN)
  getLowStockItems() {
    return this.inventoryService.getLowStockItems();
  }

  /**
   * Get stock level for a product
   */
  @Get('stock/product/:productId')
  @Roles(Role.ADMIN)
  getProductStock(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.inventoryService.getStockLevel(productId);
  }

  /**
   * Get stock level for a variant
   */
  @Get('stock/variant/:variantId')
  @Roles(Role.ADMIN)
  getVariantStock(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.inventoryService.getStockLevel(undefined, variantId);
  }

  /**
   * Get movement history for a product
   */
  @Get('movements/product/:productId')
  @Roles(Role.ADMIN)
  getProductMovements(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.inventoryService.getMovementHistory(productId, undefined, page, limit);
  }

  /**
   * Get movement history for a variant
   */
  @Get('movements/variant/:variantId')
  @Roles(Role.ADMIN)
  getVariantMovements(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.inventoryService.getMovementHistory(undefined, variantId, page, limit);
  }

  /**
   * Check stock availability for multiple items
   */
  @Post('check-availability')
  @Roles(Role.ADMIN, Role.USER)
  checkAvailability(
    @Body()
    items: { productId?: string; variantId?: string; quantity: number }[],
  ) {
    return this.inventoryService.checkStockAvailability(items);
  }
}
