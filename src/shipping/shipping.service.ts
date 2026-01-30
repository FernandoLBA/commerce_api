import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { ShipmentEvent } from './entities/shipment-event.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { ShippingCarrier } from './enums/shipping-carrier.enum';
import { ShippingStatus } from './enums/shipping-status.enum';
import { ValidationException } from '../common';

// Peru shipping rates by department
const SHIPPING_RATES: Record<string, { base: number; perKg: number; estimatedDays: number }> = {
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
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(ShipmentEvent)
    private eventRepository: Repository<ShipmentEvent>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  /**
   * Calculate shipping cost based on department and weight
   */
  calculateShippingCost(department: string, weightKg = 1): { cost: number; estimatedDays: number } {
    const rate = SHIPPING_RATES[department] || { base: 30, perKg: 4, estimatedDays: 5 };
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
    const majorCities = ['Arequipa', 'Cusco', 'Piura', 'La Libertad', 'Lambayeque', 'Junín'];

    if (limaMetro.includes(department)) {
      return [
        ShippingCarrier.OLVA,
        ShippingCarrier.SHALOM,
        ShippingCarrier.SERVIENTREGA,
        ShippingCarrier.PICKUP,
      ];
    }

    if (majorCities.includes(department)) {
      return [ShippingCarrier.OLVA, ShippingCarrier.SHALOM, ShippingCarrier.CRUZ_DEL_SUR];
    }

    return [ShippingCarrier.OLVA, ShippingCarrier.CRUZ_DEL_SUR];
  }

  /**
   * Create a shipment for an order
   */
  async create(createShipmentDto: CreateShipmentDto): Promise<Shipment> {
    const order = await this.orderRepository.findOne({
      where: { id: createShipmentDto.orderId },
    });

    if (!order) {
      throw new ValidationException(`Order with ID "${createShipmentDto.orderId}" not found`);
    }

    // Check if shipment already exists for this order
    const existingShipment = await this.shipmentRepository.findOne({
      where: { orderId: createShipmentDto.orderId },
    });

    if (existingShipment) {
      throw new ValidationException('Shipment already exists for this order');
    }

    // Calculate shipping cost
    const department = order.shippingAddress?.department || 'Lima';
    const { cost, estimatedDays } = this.calculateShippingCost(
      department,
      createShipmentDto.weightKg,
    );

    // Calculate estimated delivery date
    const estimatedDeliveryDate = createShipmentDto.estimatedDeliveryDate
      ? new Date(createShipmentDto.estimatedDeliveryDate)
      : this.addBusinessDays(new Date(), estimatedDays);

    const shipment = this.shipmentRepository.create({
      ...createShipmentDto,
      cost,
      estimatedDeliveryDate,
      status: ShippingStatus.PENDING,
    });

    const savedShipment = await this.shipmentRepository.save(shipment);

    // Create initial event
    await this.createEvent(savedShipment.id, ShippingStatus.PENDING, 'Shipment created');

    return savedShipment;
  }

  async findAll(): Promise<Shipment[]> {
    return this.shipmentRepository.find({
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!shipment) {
      throw new ValidationException(`Shipment with ID "${id}" not found`);
    }

    return shipment;
  }

  async findByOrder(orderId: string): Promise<Shipment | null> {
    return this.shipmentRepository.findOne({
      where: { orderId },
      relations: ['order'],
    });
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { trackingNumber },
      relations: ['order'],
    });

    if (!shipment) {
      throw new ValidationException(`Shipment with tracking "${trackingNumber}" not found`);
    }

    return shipment;
  }

  /**
   * Update shipment status and create event
   */
  async update(id: string, updateShipmentDto: UpdateShipmentDto): Promise<Shipment> {
    const shipment = await this.findOne(id);

    const { location, eventDescription, ...updateData } = updateShipmentDto;

    // Handle status change
    if (updateData.status && updateData.status !== shipment.status) {
      this.validateStatusTransition(shipment.status, updateData.status);

      // Set timestamps
      if (updateData.status === ShippingStatus.PICKED_UP) {
        shipment.pickedUpAt = new Date();
      } else if (updateData.status === ShippingStatus.DELIVERED) {
        shipment.deliveredAt = new Date();
      }

      // Create event
      await this.createEvent(
        id,
        updateData.status,
        eventDescription || this.getStatusDescription(updateData.status),
        location,
      );
    }

    Object.assign(shipment, updateData);
    return this.shipmentRepository.save(shipment);
  }

  /**
   * Get shipment tracking history
   */
  async getTrackingHistory(shipmentId: string): Promise<ShipmentEvent[]> {
    return this.eventRepository.find({
      where: { shipmentId },
      order: { occurredAt: 'DESC' },
    });
  }

  /**
   * Track shipment by tracking number (public endpoint)
   */
  async track(trackingNumber: string): Promise<{
    shipment: Partial<Shipment>;
    events: ShipmentEvent[];
  }> {
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
  ): Promise<ShipmentEvent> {
    const event = this.eventRepository.create({
      shipmentId,
      status,
      description,
      location,
      occurredAt: new Date(),
    });

    return this.eventRepository.save(event);
  }

  private validateStatusTransition(current: ShippingStatus, next: ShippingStatus): void {
    const validTransitions: Record<ShippingStatus, ShippingStatus[]> = {
      [ShippingStatus.PENDING]: [ShippingStatus.PICKED_UP],
      [ShippingStatus.PICKED_UP]: [ShippingStatus.IN_TRANSIT],
      [ShippingStatus.IN_TRANSIT]: [ShippingStatus.OUT_FOR_DELIVERY, ShippingStatus.FAILED],
      [ShippingStatus.OUT_FOR_DELIVERY]: [
        ShippingStatus.DELIVERED,
        ShippingStatus.FAILED,
      ],
      [ShippingStatus.FAILED]: [ShippingStatus.IN_TRANSIT, ShippingStatus.RETURNED],
      [ShippingStatus.DELIVERED]: [],
      [ShippingStatus.RETURNED]: [],
    };

    if (!validTransitions[current].includes(next)) {
      throw new ValidationException(
        `Cannot transition shipment from "${current}" to "${next}"`,
      );
    }
  }

  private getStatusDescription(status: ShippingStatus): string {
    const descriptions: Record<ShippingStatus, string> = {
      [ShippingStatus.PENDING]: 'Shipment created, waiting for pickup',
      [ShippingStatus.PICKED_UP]: 'Package picked up by carrier',
      [ShippingStatus.IN_TRANSIT]: 'Package in transit',
      [ShippingStatus.OUT_FOR_DELIVERY]: 'Out for delivery',
      [ShippingStatus.DELIVERED]: 'Package delivered',
      [ShippingStatus.FAILED]: 'Delivery attempt failed',
      [ShippingStatus.RETURNED]: 'Package returned to sender',
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
