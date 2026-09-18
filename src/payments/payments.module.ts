import { Module } from '@nestjs/common';
import { InventoryModule } from 'src/inventory';
import { NotificationsModule } from '../notifications/notifications.module';
import { MercadoPagoService } from './mercadopago.service';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe.service';

@Module({
  imports: [NotificationsModule, InventoryModule],
  controllers: [PaymentsController],
  providers: [StripeService, MercadoPagoService],
  exports: [StripeService, MercadoPagoService],
})
export class PaymentsModule {}
