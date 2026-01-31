import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    address: {
      create: jest.Mock;
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
  };

  const mockAddress = {
    id: 'address-uuid-123',
    userId,
    recipientName: 'John Doe',
    phone: '+51999999999',
    street: '123 Main St',
    district: 'Miraflores',
    city: 'Lima',
    department: 'Lima',
    isDefault: true,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      address: {
        create: jest.fn(),
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
    });
  });
});
