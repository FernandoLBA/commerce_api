import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  /**
   * Calculate shipping cost (public)
   */
  @Get('calculate')
  calculateCost(
    @Query('department') department: string,
    @Query('weight') weight?: string,
  ) {
    const weightKg = weight ? parseFloat(weight) : 1;
    return this.shippingService.calculateShippingCost(department, weightKg);
  }

  /**
   * Get available carriers for department (public)
   */
  @Get('carriers')
  getCarriers(@Query('department') department: string) {
    return {
      department,
      carriers: this.shippingService.getAvailableCarriers(department),
    };
  }

  /**
   * Track shipment by tracking number (public)
   */
  @Get('track/:trackingNumber')
  track(@Param('trackingNumber') trackingNumber: string) {
    return this.shippingService.track(trackingNumber);
  }

  /**
   * Create shipment (admin only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createShipmentDto: CreateShipmentDto) {
    return this.shippingService.create(createShipmentDto);
  }

  /**
   * List all shipments (admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.shippingService.findAll();
  }

  /**
   * Get shipment by ID (admin only)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shippingService.findOne(id);
  }

  /**
   * Get shipment by order ID (admin only)
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.shippingService.findByOrder(orderId);
  }

  /**
   * Get tracking history (admin only)
   */
  @Get(':id/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.shippingService.getTrackingHistory(id);
  }

  /**
   * Update shipment status (admin only)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateShipmentDto: UpdateShipmentDto,
  ) {
    return this.shippingService.update(id, updateShipmentDto);
  }
}
