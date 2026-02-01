import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';

interface MercadoPagoWebhookBody {
  action?: string;
  type?: string;
  data?: {
    id?: string;
  };
}
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { MercadoPagoService } from './mercadopago.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  // =============== STRIPE ===============

  @Post('stripe/create-intent/:orderId')
  @UseGuards(JwtAuthGuard)
  createStripePaymentIntent(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.stripeService.createPaymentIntent(orderId);
  }

  @Post('stripe/webhook')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhook(req.rawBody!, signature);
  }

  @Post('stripe/refund/:paymentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createStripeRefund(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body('amount') amount?: number,
  ) {
    return this.stripeService.createRefund(paymentId, amount);
  }

  // =============== MERCADOPAGO ===============

  @Post('mercadopago/create-preference/:orderId')
  @UseGuards(JwtAuthGuard)
  createMercadoPagoPreference(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.mercadoPagoService.createPreference(orderId);
  }

  @Post('mercadopago/webhook')
  async handleMercadoPagoWebhook(@Body() body: MercadoPagoWebhookBody) {
    return this.mercadoPagoService.handleWebhook(body);
  }

  @Get('mercadopago/status/:externalId')
  @UseGuards(JwtAuthGuard)
  getMercadoPagoStatus(@Param('externalId') externalId: string) {
    return this.mercadoPagoService.getPaymentStatus(externalId);
  }

  @Post('mercadopago/refund/:paymentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createMercadoPagoRefund(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body('amount') amount?: number,
  ) {
    return this.mercadoPagoService.createRefund(paymentId, amount);
  }

  // =============== REDIRECT HANDLERS ===============

  @Get('mercadopago/success')
  mercadoPagoSuccess() {
    return { status: 'success', message: 'Payment successful' };
  }

  @Get('mercadopago/failure')
  mercadoPagoFailure() {
    return { status: 'failure', message: 'Payment failed' };
  }

  @Get('mercadopago/pending')
  mercadoPagoPending() {
    return { status: 'pending', message: 'Payment pending' };
  }
}
