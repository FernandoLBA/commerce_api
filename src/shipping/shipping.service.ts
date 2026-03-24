import { Injectable } from '@nestjs/common';
import { Prisma, ShippingCarrier, ShippingStatus } from '@prisma/client';

import { ValidationException } from '../common';
import { PrismaService } from '../prisma';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

// Peru shipping rates by department
const SHIPPING_RATES: Record<
  string,
  { base: number; perKg: number; estimatedDays: number }
> = {
  // Lima Metro
  Lima: { base: 10, perKg: 2, estimatedDays: 1 },
  Callao: { base: 10, perKg: 2, estimatedDays: 1 },
  // Costa Norte
  Tumbes: { base: 25, perKg: 4, estimatedDays: 3 },
  Piura: { base: 22, perKg: 3.5, estimatedDays: 3 },
  Lambayeque: { base: 20, perKg: 3, estimatedDays: 2 },
  'La Libertad': { base: 18, perKg: 3, estimatedDays: 2 },
  Ancash: { base: 18, perKg: 3, estimatedDays: 2 },
  // Costa Sur
  Ica: { base: 15, perKg: 2.5, estimatedDays: 2 },
  Arequipa: { base: 20, perKg: 3, estimatedDays: 2 },
  Moquegua: { base: 25, perKg: 4, estimatedDays: 3 },
  Tacna: { base: 28, perKg: 4, estimatedDays: 3 },
  // Sierra
  Cajamarca: { base: 25, perKg: 4, estimatedDays: 3 },
  Huánuco: { base: 22, perKg: 3.5, estimatedDays: 3 },
  Pasco: { base: 22, perKg: 3.5, estimatedDays: 3 },
  Junín: { base: 18, perKg: 3, estimatedDays: 2 },
  Huancavelica: { base: 22, perKg: 3.5, estimatedDays: 3 },
  Ayacucho: { base: 25, perKg: 4, estimatedDays: 3 },
  Apurímac: { base: 28, perKg: 4.5, estimatedDays: 4 },
  Cusco: { base: 25, perKg: 4, estimatedDays: 3 },
  Puno: { base: 28, perKg: 4.5, estimatedDays: 4 },
  // Selva
  Amazonas: { base: 35, perKg: 5, estimatedDays: 5 },
  'San Martín': { base: 30, perKg: 4.5, estimatedDays: 4 },
  Loreto: { base: 45, perKg: 6, estimatedDays: 7 },
  Ucayali: { base: 35, perKg: 5, estimatedDays: 5 },
  'Madre de Dios': { base: 40, perKg: 5.5, estimatedDays: 6 },
};

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate shipping cost based on department and weight
   */
  calculateShippingCost(
    department: string,
    weightKg = 1,
  ): { cost: number; estimatedDays: number } {
    const rate = SHIPPING_RATES[department] || {
      base: 30,
      perKg: 4,
      estimatedDays: 5,
    };
    const cost = rate.base + rate.perKg * Math.max(0, weightKg - 1);
    return {
      cost: Math.round(cost * 100) / 100,
      estimatedDays: rate.estimatedDays,
    };
  }

  /**
   * Get available carriers for a department
   */
  getAvailableCarriers(department: string): ShippingCarrier[] {
    const limaMetro = ['Lima', 'Callao'];
    const majorCities = [
      'Arequipa',
      'Cusco',
      'Piura',
      'La Libertad',
      'Lambayeque',
      'Junín',
    ];

    if (limaMetro.includes(department)) {
      return [
        ShippingCarrier.OLVA,
        ShippingCarrier.SHALOM,
        ShippingCarrier.SERVIENTREGA,
        ShippingCarrier.PICKUP,
      ];
    }

    if (majorCities.includes(department)) {
      return [
        ShippingCarrier.OLVA,
        ShippingCarrier.SHALOM,
        ShippingCarrier.CRUZ_DEL_SUR,
      ];
    }

    return [ShippingCarrier.OLVA, ShippingCarrier.CRUZ_DEL_SUR];
  }

  /**
   * Create a shipment for an order
   */
  async create(createShipmentDto: CreateShipmentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: createShipmentDto.orderId },
    });

    if (!order) {
      throw new ValidationException(
        `Order with ID "${createShipmentDto.orderId}" not found`,
      );
    }

    // Check if shipment already exists for this order
    const existingShipment = await this.prisma.shipment.findFirst({
      where: { orderId: createShipmentDto.orderId },
    });

    if (existingShipment) {
      throw new ValidationException('Shipment already exists for this order');
    }

    // Calculate shipping cost
    const department = (order.shippingAddress as any)?.department || 'Lima';
    const { cost, estimatedDays } = this.calculateShippingCost(
      department,
      createShipmentDto.weightKg,
    );

    // Calculate estimated delivery date
    const estimatedDeliveryDate = createShipmentDto.estimatedDeliveryDate
      ? new Date(createShipmentDto.estimatedDeliveryDate)
      : this.addBusinessDays(new Date(), estimatedDays);

    const savedShipment = await this.prisma.shipment.create({
      data: {
        orderId: createShipmentDto.orderId,
        carrier: createShipmentDto.carrier,
        trackingNumber: createShipmentDto.trackingNumber,
        weightKg: createShipmentDto.weightKg,
        shippingCost: cost,
        estimatedDeliveryDate,
        status: ShippingStatus.PENDING,
        recipientName: (order.shippingAddress as any)?.recipientName || '',
        recipientPhone: (order.shippingAddress as any)?.phone || '',
        addressLine1: (order.shippingAddress as any)?.street || '',
        addressLine2: (order.shippingAddress as any)?.number || '',
        city: (order.shippingAddress as any)?.city || '',
        department: (order.shippingAddress as any)?.department || '',
        postalCode: (order.shippingAddress as any)?.postalCode,
      },
    });

    // Create initial event
    await this.createEvent(
      savedShipment.id,
      ShippingStatus.PENDING,
      'Shipment created',
    );

    return savedShipment;
  }

  async findAll() {
    return this.prisma.shipment.findMany({
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!shipment) {
      throw new ValidationException(`Shipment with ID "${id}" not found`);
    }

    return shipment;
  }

  async findByOrder(orderId: string) {
    return this.prisma.shipment.findFirst({
      where: { orderId },
      include: { order: true },
    });
  }

  async findByTrackingNumber(trackingNumber: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { trackingNumber },
      include: { order: true },
    });

    if (!shipment) {
      throw new ValidationException(
        `Shipment with tracking "${trackingNumber}" not found`,
      );
    }

    return shipment;
  }

  /**
   * Update shipment status and create event
   */
  async update(id: string, updateShipmentDto: UpdateShipmentDto) {
    const shipment = await this.findOne(id);

    const { location, eventDescription, ...updateData } = updateShipmentDto;

    const prismaUpdateData: Prisma.ShipmentUpdateInput = { ...updateData };

    // Handle status change
    if (updateData.status && updateData.status !== shipment.status) {
      this.validateStatusTransition(
        shipment.status as ShippingStatus,
        updateData.status,
      );

      // Set timestamps
      if (updateData.status === ShippingStatus.SHIPPED) {
        prismaUpdateData.shippedAt = new Date();
      } else if (updateData.status === ShippingStatus.DELIVERED) {
        prismaUpdateData.deliveredAt = new Date();
      }

      // Create event
      await this.createEvent(
        id,
        updateData.status,
        eventDescription || this.getStatusDescription(updateData.status),
        location,
      );
    }

    return this.prisma.shipment.update({
      where: { id },
      data: prismaUpdateData,
    });
  }

  /**
   * Get shipment tracking history
   */
  async getTrackingHistory(shipmentId: string) {
    return this.prisma.shipmentEvent.findMany({
      where: { shipmentId },
      orderBy: { occurredAt: 'desc' },
    });
  }

  /**
   * Track shipment by tracking number (public endpoint)
   */
  async track(trackingNumber: string) {
    const shipment = await this.findByTrackingNumber(trackingNumber);
    const events = await this.getTrackingHistory(shipment.id);

    // Return limited info for public tracking
    return {
      shipment: {
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        status: shipment.status,
        estimatedDeliveryDate: shipment.estimatedDeliveryDate,
        deliveredAt: shipment.deliveredAt,
      },
      events,
    };
  }

  private async createEvent(
    shipmentId: string,
    status: ShippingStatus,
    description: string,
    location?: string,
  ) {
    return this.prisma.shipmentEvent.create({
      data: {
        shipmentId,
        status,
        description,
        location,
        occurredAt: new Date(),
      },
    });
  }

  private validateStatusTransition(
    current: ShippingStatus,
    next: ShippingStatus,
  ): void {
    const validTransitions: Record<ShippingStatus, ShippingStatus[]> = {
      [ShippingStatus.PENDING]: [
        ShippingStatus.PROCESSING,
        ShippingStatus.CANCELLED,
      ],
      [ShippingStatus.PROCESSING]: [
        ShippingStatus.SHIPPED,
        ShippingStatus.CANCELLED,
      ],
      [ShippingStatus.SHIPPED]: [
        ShippingStatus.IN_TRANSIT,
        ShippingStatus.CANCELLED,
      ],
      [ShippingStatus.IN_TRANSIT]: [
        ShippingStatus.OUT_FOR_DELIVERY,
        ShippingStatus.FAILED,
      ],
      [ShippingStatus.OUT_FOR_DELIVERY]: [
        ShippingStatus.DELIVERED,
        ShippingStatus.FAILED,
      ],
      [ShippingStatus.FAILED]: [
        ShippingStatus.IN_TRANSIT,
        ShippingStatus.RETURNED,
      ],
      [ShippingStatus.DELIVERED]: [],
      [ShippingStatus.RETURNED]: [],
      [ShippingStatus.CANCELLED]: [],
    };

    if (!validTransitions[current].includes(next)) {
      throw new ValidationException(
        `Cannot transition shipment from "${current}" to "${next}"`,
      );
    }
  }

  private getStatusDescription(status: ShippingStatus): string {
    const descriptions: Record<ShippingStatus, string> = {
      [ShippingStatus.PENDING]: 'Shipment created, waiting for processing',
      [ShippingStatus.PROCESSING]: 'Shipment being prepared',
      [ShippingStatus.SHIPPED]: 'Package shipped by carrier',
      [ShippingStatus.IN_TRANSIT]: 'Package in transit',
      [ShippingStatus.OUT_FOR_DELIVERY]: 'Out for delivery',
      [ShippingStatus.DELIVERED]: 'Package delivered',
      [ShippingStatus.FAILED]: 'Delivery attempt failed',
      [ShippingStatus.RETURNED]: 'Package returned to sender',
      [ShippingStatus.CANCELLED]: 'Shipment cancelled',
    };

    return descriptions[status];
  }

  private addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let added = 0;

    while (added < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        added++;
      }
    }

    return result;
  }
}
