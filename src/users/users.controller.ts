import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UsersService } from './users.service';

interface RequestUser {
  id: string;
  email?: string;
  role?: Role;
}

interface RequestWithUser extends ExpressRequest {
  user: RequestUser;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Profile endpoints
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  // Address endpoints
  @Get('addresses')
  getAddresses(@Request() req: RequestWithUser) {
    return this.usersService.getAddresses(req.user.id);
  }

  @Get('addresses/:id')
  getAddress(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.getAddress(req.user.id, id);
  }

  @Post('addresses')
  createAddress(
    @Request() req: RequestWithUser,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(req.user.id, createAddressDto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(req.user.id, id, updateAddressDto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAddress(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.deleteAddress(req.user.id, id);
  }

  @Patch('addresses/:id/default')
  setDefaultAddress(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.setDefaultAddress(req.user.id, id);
  }

  // Admin endpoints - Manage user roles
  @Patch(':userId/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateUserRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.usersService.updateUserRole(userId, updateRoleDto.role);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getAllUsers() {
    return this.usersService.getAllUsers();
  }
}
