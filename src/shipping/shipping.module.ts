import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { Shipment } from './entities/shipment.entity';
import { ShipmentEvent } from './entities/shipment-event.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment, ShipmentEvent, Order])],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
