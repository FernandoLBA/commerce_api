import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';
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
import { Product } from './products/entities/product.entity';
import { Category } from './categories/entities/category.entity';
import { Address } from './users/entities/address.entity';
import { ProductVariant } from './products/entities/product-variant.entity';
import { ProductAttribute } from './products/entities/product-attribute.entity';
import { ProductAttributeValue } from './products/entities/product-attribute-value.entity';
import { ProductImage } from './products/entities/product-image.entity';
import { Cart } from './cart/entities/cart.entity';
import { CartItem } from './cart/entities/cart-item.entity';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { Payment } from './orders/entities/payment.entity';
import { Shipment } from './shipping/entities/shipment.entity';
import { ShipmentEvent } from './shipping/entities/shipment-event.entity';
import { InventoryMovement } from './inventory/entities/inventory-movement.entity';
import { StockAlert } from './inventory/entities/stock-alert.entity';
import { Review } from './reviews/entities/review.entity';
import { Coupon } from './coupons/entities/coupon.entity';
import { CouponUsage } from './coupons/entities/coupon-usage.entity';
import { WishlistItem } from './wishlist/entities/wishlist-item.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'api',
      entities: [
        User,
        Product,
        Category,
        Address,
        ProductVariant,
        ProductAttribute,
        ProductAttributeValue,
        ProductImage,
        Cart,
        CartItem,
        Order,
        OrderItem,
        Payment,
        Shipment,
        ShipmentEvent,
        InventoryMovement,
        StockAlert,
        Review,
        Coupon,
        CouponUsage,
        WishlistItem,
      ],
      synchronize: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
