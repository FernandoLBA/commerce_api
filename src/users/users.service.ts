import { Injectable } from '@nestjs/common';
import { AddressNotFoundException, UserNotFoundException } from '../common';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Profile methods
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
    });

    return this.getProfile(userId);
  }

  // Address methods
  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new AddressNotFoundException();
    }

    return address;
  }

  async createAddress(userId: string, createAddressDto: CreateAddressDto) {
    // If this is the first address or marked as default, handle default logic
    if (createAddressDto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Check if this is the first address
    const addressCount = await this.prisma.address.count({ where: { userId } });
    const isFirstAddress = addressCount === 0;

    const { recipientPhone, ...addressData } = createAddressDto;

    return this.prisma.address.create({
      data: {
        ...addressData,
        recipientPhone: recipientPhone,
        userId,
        isDefault: createAddressDto.isDefault || isFirstAddress,
      },
    });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    await this.getAddress(userId, addressId); // Verify exists

    // Handle default address logic
    if (updateAddressDto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: updateAddressDto,
    });
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.getAddress(userId, addressId);
    const wasDefault = address.isDefault;

    await this.prisma.address.delete({ where: { id: addressId } });

    // If deleted address was default, set another one as default
    if (wasDefault) {
      const firstAddress = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      if (firstAddress) {
        await this.prisma.address.update({
          where: { id: firstAddress.id },
          data: { isDefault: true },
        });
      }
    }
  }

  async setDefaultAddress(userId: string, addressId: string) {
    await this.getAddress(userId, addressId); // Verify exists

    // Remove default from all other addresses
    await this.prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Set this address as default
    return this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }

  // Admin methods
  async updateUserRole(userId: string, role: Role) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
