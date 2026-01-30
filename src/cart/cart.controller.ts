import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: User) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  addToCart(@CurrentUser() user: User, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(user.id, addToCartDto);
  }

  @Patch('items/:itemId')
  updateCartItem(
    @CurrentUser() user: User,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(user.id, itemId, updateDto);
  }

  @Delete('items/:itemId')
  removeCartItem(
    @CurrentUser() user: User,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.cartService.removeCartItem(user.id, itemId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clearCart(@CurrentUser() user: User) {
    return this.cartService.clearCart(user.id);
  }

  @Get('validate')
  validateCart(@CurrentUser() user: User) {
    return this.cartService.validateCartForCheckout(user.id);
  }
}
