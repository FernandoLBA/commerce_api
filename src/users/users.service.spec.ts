import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma';
import { AddressNotFoundException } from '../common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    address: {
      create: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
    };
  };

  const userId = 'user-uuid-123';

  const mockUser = {
    id: userId,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+51999999999',
    role: 'USER',
    isActive: true,
    createdAt: new Date(),
  };

  const mockAddress = {
    id: 'address-uuid-123',
    userId,
    label: 'Casa',
    recipientName: 'John Doe',
    phone: '+51999999999',
    street: 'Av. Larco 123',
    number: '123',
    apartment: '201',
    district: 'Miraflores',
    city: 'Lima',
    department: 'Lima',
    postalCode: '15074',
    reference: 'Frente al parque',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateAddressDto = {
    label: 'Casa',
    recipientName: 'John Doe',
    recipientPhone: '+51999999999',
    street: 'Av. Larco 123',
    number: '123',
    apartment: '201',
    district: 'Miraflores',
    city: 'Lima',
    department: 'Lima',
    postalCode: '15074',
    reference: 'Frente al parque',
    isDefault: true,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      address: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(result.email).toBe('test@example.com');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updatedUser = { ...mockUser, firstName: 'Jane' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(updatedUser);
      // Mock for getProfile call after update
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);

      const result = await service.updateProfile(userId, { firstName: 'Jane' });

      expect(result.firstName).toBe('Jane');
    });
  });

  describe('getAddresses', () => {
    it('should return user addresses', async () => {
      prisma.address.findMany.mockResolvedValue([mockAddress]);

      const result = await service.getAddresses(userId);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Casa');
    });

    it('should return empty array if no addresses', async () => {
      prisma.address.findMany.mockResolvedValue([]);

      const result = await service.getAddresses(userId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getAddress', () => {
    it('should return a specific address', async () => {
      prisma.address.findFirst.mockResolvedValue(mockAddress);

      const result = await service.getAddress(userId, mockAddress.id);

      expect(result.id).toBe(mockAddress.id);
      expect(result.label).toBe('Casa');
    });

    it('should throw AddressNotFoundException if not found', async () => {
      prisma.address.findFirst.mockResolvedValue(null);

      await expect(
        service.getAddress(userId, 'non-existent-id'),
      ).rejects.toThrow(AddressNotFoundException);
    });
  });

  describe('createAddress', () => {
    it('should create a new address', async () => {
      prisma.address.count.mockResolvedValue(0); // First address
      prisma.address.create.mockResolvedValue(mockAddress);

      const result = await service.createAddress(userId, mockCreateAddressDto);

      expect(result.label).toBe('Casa');
      expect(prisma.address.create).toHaveBeenCalled();
    });

    it('should set first address as default', async () => {
      prisma.address.count.mockResolvedValue(0);
      prisma.address.create.mockResolvedValue({
        ...mockAddress,
        isDefault: true,
      });

      const result = await service.createAddress(userId, {
        ...mockCreateAddressDto,
        isDefault: false,
      });

      expect(result.isDefault).toBe(true);
    });

    it('should unset other defaults when creating default address', async () => {
      prisma.address.count.mockResolvedValue(1);
      prisma.address.updateMany.mockResolvedValue({ count: 1 });
      prisma.address.create.mockResolvedValue(mockAddress);

      await service.createAddress(userId, mockCreateAddressDto);

      expect(prisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { isDefault: false },
      });
    });
  });

  describe('updateAddress', () => {
    it('should update an address', async () => {
      const updatedAddress = { ...mockAddress, label: 'Oficina' };
      prisma.address.findFirst.mockResolvedValue(mockAddress);
      prisma.address.update.mockResolvedValue(updatedAddress);

      const result = await service.updateAddress(userId, mockAddress.id, {
        label: 'Oficina',
      });

      expect(result.label).toBe('Oficina');
    });

    it('should throw AddressNotFoundException if address not found', async () => {
      prisma.address.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAddress(userId, 'non-existent-id', { label: 'Test' }),
      ).rejects.toThrow(AddressNotFoundException);
    });

    it('should unset other defaults when updating to default', async () => {
      prisma.address.findFirst.mockResolvedValue(mockAddress);
      prisma.address.updateMany.mockResolvedValue({ count: 1 });
      prisma.address.update.mockResolvedValue({
        ...mockAddress,
        isDefault: true,
      });

      await service.updateAddress(userId, mockAddress.id, { isDefault: true });

      expect(prisma.address.updateMany).toHaveBeenCalled();
    });
  });

  describe('deleteAddress', () => {
    it('should delete an address', async () => {
      prisma.address.findFirst.mockResolvedValue({
        ...mockAddress,
        isDefault: false,
      });
      prisma.address.delete.mockResolvedValue(mockAddress);

      await service.deleteAddress(userId, mockAddress.id);

      expect(prisma.address.delete).toHaveBeenCalledWith({
        where: { id: mockAddress.id },
      });
    });

    it('should set another address as default after deleting default', async () => {
      const anotherAddress = {
        ...mockAddress,
        id: 'address-2',
        isDefault: false,
      };
      prisma.address.findFirst
        .mockResolvedValueOnce({ ...mockAddress, isDefault: true }) // getAddress
        .mockResolvedValueOnce(anotherAddress); // find new default
      prisma.address.delete.mockResolvedValue(mockAddress);
      prisma.address.update.mockResolvedValue({
        ...anotherAddress,
        isDefault: true,
      });

      await service.deleteAddress(userId, mockAddress.id);

      expect(prisma.address.update).toHaveBeenCalledWith({
        where: { id: anotherAddress.id },
        data: { isDefault: true },
      });
    });

    it('should throw AddressNotFoundException if not found', async () => {
      prisma.address.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteAddress(userId, 'non-existent-id'),
      ).rejects.toThrow(AddressNotFoundException);
    });
  });

  describe('setDefaultAddress', () => {
    it('should set address as default', async () => {
      prisma.address.findFirst.mockResolvedValue(mockAddress);
      prisma.address.updateMany.mockResolvedValue({ count: 1 });
      prisma.address.update.mockResolvedValue({
        ...mockAddress,
        isDefault: true,
      });

      const result = await service.setDefaultAddress(userId, mockAddress.id);

      expect(result.isDefault).toBe(true);
      expect(prisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { isDefault: false },
      });
    });

    it('should throw AddressNotFoundException if not found', async () => {
      prisma.address.findFirst.mockResolvedValue(null);

      await expect(
        service.setDefaultAddress(userId, 'non-existent-id'),
      ).rejects.toThrow(AddressNotFoundException);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users (admin)', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.getAllUsers();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('test@example.com');
    });
  });
});
