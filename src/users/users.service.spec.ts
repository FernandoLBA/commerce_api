import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from '../auth/entities/user.entity';
import { Address } from './entities/address.entity';
import { Role } from '../common/enums/role.enum';
import { UserNotFoundException, AddressNotFoundException } from '../common';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let addressRepository: jest.Mocked<Repository<Address>>;

  const mockUser: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+51999888777',
    role: Role.CUSTOMER,
    isActive: true,
    createdAt: new Date(),
  };

  const mockAddress: Partial<Address> = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    userId: mockUser.id,
    label: 'Casa',
    street: 'Av. Larco',
    number: '123',
    district: 'Miraflores',
    city: 'Lima',
    department: 'Lima',
    postalCode: '15074',
    recipientName: 'John Doe',
    recipientPhone: '+51999888777',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockAddressRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Address),
          useValue: mockAddressRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    addressRepository = module.get(getRepositoryToken(Address));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =============== Profile Tests ===============

  describe('getProfile', () => {
    it('should return user profile', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await service.getProfile(mockUser.id!);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'createdAt'],
      });
    });

    it('should throw UserNotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { firstName: 'Jane', phone: '+51999111222' };
      const updatedUser = { ...mockUser, ...updateDto };

      userRepository.findOne
        .mockResolvedValueOnce(mockUser as User) // First call for update
        .mockResolvedValueOnce(updatedUser as User); // Second call for getProfile
      userRepository.save.mockResolvedValue(updatedUser as User);

      const result = await service.updateProfile(mockUser.id!, updateDto);

      expect(result.firstName).toEqual('Jane');
      expect(result.phone).toEqual('+51999111222');
    });

    it('should throw UserNotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('nonexistent', {})).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  // =============== Address Tests ===============

  describe('getAddresses', () => {
    it('should return all addresses for a user', async () => {
      const addresses = [mockAddress as Address];
      addressRepository.find.mockResolvedValue(addresses);

      const result = await service.getAddresses(mockUser.id!);

      expect(result).toEqual(addresses);
      expect(addressRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
    });
  });

  describe('getAddress', () => {
    it('should return a specific address', async () => {
      addressRepository.findOne.mockResolvedValue(mockAddress as Address);

      const result = await service.getAddress(mockUser.id!, mockAddress.id!);

      expect(result).toEqual(mockAddress);
    });

    it('should throw AddressNotFoundException if address not found', async () => {
      addressRepository.findOne.mockResolvedValue(null);

      await expect(service.getAddress(mockUser.id!, 'nonexistent')).rejects.toThrow(
        AddressNotFoundException,
      );
    });
  });

  describe('createAddress', () => {
    it('should create a new address', async () => {
      const createDto = {
        label: 'Oficina',
        street: 'Av. Javier Prado',
        number: '456',
        district: 'San Isidro',
        city: 'Lima',
        department: 'Lima',
        postalCode: '15036',
        recipientName: 'John Doe',
        recipientPhone: '+51999888777',
      };

      addressRepository.count.mockResolvedValue(1); // Not first address
      addressRepository.create.mockReturnValue({ ...createDto, userId: mockUser.id } as Address);
      addressRepository.save.mockResolvedValue({ ...createDto, userId: mockUser.id, id: 'new-id' } as Address);

      const result = await service.createAddress(mockUser.id!, createDto);

      expect(result).toBeDefined();
      expect(addressRepository.create).toHaveBeenCalled();
    });

    it('should set first address as default', async () => {
      const createDto = {
        label: 'Casa',
        street: 'Av. Larco',
        number: '123',
        district: 'Miraflores',
        city: 'Lima',
        department: 'Lima',
        postalCode: '15074',
        recipientName: 'John Doe',
        recipientPhone: '+51999888777',
      };

      addressRepository.count.mockResolvedValue(0); // First address
      addressRepository.create.mockReturnValue({
        ...createDto,
        userId: mockUser.id,
        isDefault: true,
      } as Address);
      addressRepository.save.mockResolvedValue({
        ...createDto,
        userId: mockUser.id,
        isDefault: true,
        id: 'new-id',
      } as Address);

      const result = await service.createAddress(mockUser.id!, createDto);

      expect(addressRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true }),
      );
    });

    it('should reset other default addresses when creating with isDefault', async () => {
      const createDto = {
        label: 'Nueva Casa',
        street: 'Calle Nueva',
        number: '999',
        district: 'Barranco',
        city: 'Lima',
        department: 'Lima',
        postalCode: '15063',
        recipientName: 'John Doe',
        recipientPhone: '+51999888777',
        isDefault: true,
      };

      addressRepository.count.mockResolvedValue(1);
      addressRepository.update.mockResolvedValue({ affected: 1 } as any);
      addressRepository.create.mockReturnValue({ ...createDto, userId: mockUser.id } as Address);
      addressRepository.save.mockResolvedValue({ ...createDto, userId: mockUser.id, id: 'new-id' } as Address);

      await service.createAddress(mockUser.id!, createDto);

      expect(addressRepository.update).toHaveBeenCalledWith(
        { userId: mockUser.id },
        { isDefault: false },
      );
    });
  });

  describe('updateAddress', () => {
    it('should update an address', async () => {
      const updateDto = { street: 'Av. Nueva' };
      const updatedAddress = { ...mockAddress, ...updateDto };

      addressRepository.findOne.mockResolvedValue(mockAddress as Address);
      addressRepository.save.mockResolvedValue(updatedAddress as Address);

      const result = await service.updateAddress(mockUser.id!, mockAddress.id!, updateDto);

      expect(result.street).toEqual('Av. Nueva');
    });

    it('should reset other defaults when setting as default', async () => {
      const updateDto = { isDefault: true };

      addressRepository.findOne.mockResolvedValue({ ...mockAddress, isDefault: false } as Address);
      addressRepository.update.mockResolvedValue({ affected: 1 } as any);
      addressRepository.save.mockResolvedValue({ ...mockAddress, isDefault: true } as Address);

      await service.updateAddress(mockUser.id!, mockAddress.id!, updateDto);

      expect(addressRepository.update).toHaveBeenCalledWith(
        { userId: mockUser.id },
        { isDefault: false },
      );
    });
  });

  describe('deleteAddress', () => {
    it('should delete an address', async () => {
      addressRepository.findOne
        .mockResolvedValueOnce({ ...mockAddress, isDefault: false } as Address) // getAddress
        .mockResolvedValueOnce(null); // findOne for next default (none)
      addressRepository.remove.mockResolvedValue(mockAddress as Address);

      await service.deleteAddress(mockUser.id!, mockAddress.id!);

      expect(addressRepository.remove).toHaveBeenCalled();
    });

    it('should set another address as default when deleting default', async () => {
      const anotherAddress = { ...mockAddress, id: 'another-id', isDefault: false };

      addressRepository.findOne
        .mockResolvedValueOnce({ ...mockAddress, isDefault: true } as Address) // getAddress
        .mockResolvedValueOnce(anotherAddress as Address); // findOne for next default
      addressRepository.remove.mockResolvedValue(mockAddress as Address);
      addressRepository.save.mockResolvedValue({ ...anotherAddress, isDefault: true } as Address);

      await service.deleteAddress(mockUser.id!, mockAddress.id!);

      expect(addressRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true }),
      );
    });
  });

  describe('setDefaultAddress', () => {
    it('should set an address as default', async () => {
      const nonDefaultAddress = { ...mockAddress, isDefault: false };

      addressRepository.findOne.mockResolvedValue(nonDefaultAddress as Address);
      addressRepository.update.mockResolvedValue({ affected: 1 } as any);
      addressRepository.save.mockResolvedValue({ ...nonDefaultAddress, isDefault: true } as Address);

      const result = await service.setDefaultAddress(mockUser.id!, mockAddress.id!);

      expect(result.isDefault).toBe(true);
      expect(addressRepository.update).toHaveBeenCalledWith(
        { userId: mockUser.id },
        { isDefault: false },
      );
    });
  });
});
