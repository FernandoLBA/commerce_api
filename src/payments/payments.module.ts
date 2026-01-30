import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe.service';
import { MercadoPagoService } from './mercadopago.service';
import { Payment } from '../orders/entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order]),
    NotificationsModule,
  ],
  controllers: [PaymentsController],
  providers: [StripeService, MercadoPagoService],
  exports: [StripeService, MercadoPagoService],
})
export class PaymentsModule {}
