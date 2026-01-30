import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Profile endpoints
  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  // Address endpoints
  @Get('addresses')
  getAddresses(@Request() req) {
    return this.usersService.getAddresses(req.user.id);
  }

  @Get('addresses/:id')
  getAddress(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getAddress(req.user.id, id);
  }

  @Post('addresses')
  createAddress(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    return this.usersService.createAddress(req.user.id, createAddressDto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(req.user.id, id, updateAddressDto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAddress(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deleteAddress(req.user.id, id);
  }

  @Patch('addresses/:id/default')
  setDefaultAddress(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.setDefaultAddress(req.user.id, id);
  }
}
