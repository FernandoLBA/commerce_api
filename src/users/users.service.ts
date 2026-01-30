import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UserNotFoundException,
  AddressNotFoundException,
} from '../common';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}

  // Profile methods
  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'createdAt'],
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    Object.assign(user, updateProfileDto);
    await this.userRepository.save(user);

    return this.getProfile(userId);
  }

  // Address methods
  async getAddresses(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async getAddress(userId: string, addressId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new AddressNotFoundException();
    }

    return address;
  }

  async createAddress(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    // If this is the first address or marked as default, handle default logic
    if (createAddressDto.isDefault) {
      await this.addressRepository.update(
        { userId },
        { isDefault: false },
      );
    }

    // Check if this is the first address
    const addressCount = await this.addressRepository.count({ where: { userId } });
    const isFirstAddress = addressCount === 0;

    const address = this.addressRepository.create({
      ...createAddressDto,
      userId,
      isDefault: createAddressDto.isDefault || isFirstAddress,
    });

    return this.addressRepository.save(address);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.getAddress(userId, addressId);

    // Handle default address logic
    if (updateAddressDto.isDefault) {
      await this.addressRepository.update(
        { userId },
        { isDefault: false },
      );
    }

    Object.assign(address, updateAddressDto);
    return this.addressRepository.save(address);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.getAddress(userId, addressId);
    const wasDefault = address.isDefault;

    await this.addressRepository.remove(address);

    // If deleted address was default, set another one as default
    if (wasDefault) {
      const firstAddress = await this.addressRepository.findOne({
        where: { userId },
        order: { createdAt: 'ASC' },
      });

      if (firstAddress) {
        firstAddress.isDefault = true;
        await this.addressRepository.save(firstAddress);
      }
    }
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<Address> {
    const address = await this.getAddress(userId, addressId);

    // Remove default from all other addresses
    await this.addressRepository.update(
      { userId },
      { isDefault: false },
    );

    // Set this address as default
    address.isDefault = true;
    return this.addressRepository.save(address);
  }
}
