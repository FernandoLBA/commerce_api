import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ShippingModule } from './shipping/shipping.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InventoryModule } from './inventory/inventory.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CouponsModule } from './coupons/coupons.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { SecurityModule } from './security/security.module';
import { securityConfig } from './common';
import { BcryptModule } from './bcrypt/bcrypt.module';

@Module({
  imports: [
    // Prisma - Database ORM
    PrismaModule,
    // Rate Limiting - Global configuration
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: securityConfig.throttle.global.ttl,
        limit: securityConfig.throttle.global.limit,
      },
      {
        name: 'auth',
        ttl: securityConfig.throttle.auth.ttl,
        limit: securityConfig.throttle.auth.limit,
      },
    ]),
    AuthModule,
    ProductsModule,
    CategoriesModule,
    UsersModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    NotificationsModule,
    InventoryModule,
    ReviewsModule,
    CouponsModule,
    WishlistModule,
    SecurityModule,
    BcryptModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global ThrottlerGuard - applies rate limiting to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
