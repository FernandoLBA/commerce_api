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
  Query,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { UpdateWishlistItemDto } from './dto/update-wishlist-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  addItem(
    @CurrentUser('id') userId: string,
    @Body() addToWishlistDto: AddToWishlistDto,
  ) {
    return this.wishlistService.addItem(userId, addToWishlistDto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.wishlistService.findAll(userId);
  }

  @Get('count')
  getCount(@CurrentUser('id') userId: string) {
    return this.wishlistService.getWishlistCount(userId);
  }

  @Get('check')
  isInWishlist(
    @CurrentUser('id') userId: string,
    @Query('productId', ParseUUIDPipe) productId: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.wishlistService.isInWishlist(userId, productId, variantId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.wishlistService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateWishlistItemDto,
  ) {
    return this.wishlistService.update(id, userId, updateDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.wishlistService.remove(id, userId);
  }

  @Delete()
  clearWishlist(@CurrentUser('id') userId: string) {
    return this.wishlistService.clearWishlist(userId);
  }

  @Post(':id/move-to-cart')
  moveToCart(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.wishlistService.moveToCart(id, userId);
  }
}
