import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { StockAlert } from './entities/stock-alert.entity';
import { MovementType } from './enums/movement-type.enum';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SetAlertThresholdDto } from './dto/set-alert-threshold.dto';
import { ValidationException, NotFoundException } from '../common';
import { NotificationsService } from '../notifications/notifications.service';

export interface StockReservation {
  productId?: string;
  variantId?: string;
  quantity: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku?: string;
  currentStock: number;
  threshold: number;
  type: 'product' | 'variant';
  isCritical: boolean;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(InventoryMovement)
    private movementRepository: Repository<InventoryMovement>,
    @InjectRepository(StockAlert)
    private alertRepository: Repository<StockAlert>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Adjust stock for a product or variant
   */
  async adjustStock(dto: AdjustStockDto, performedBy?: string): Promise<InventoryMovement> {
    if (!dto.productId && !dto.variantId) {
      throw new ValidationException('Either productId or variantId is required');
    }

    const isOutgoing = this.isOutgoingMovement(dto.type);
    const quantityChange = isOutgoing ? -dto.quantity : dto.quantity;

    let previousStock: number;
    let newStock: number;

    if (dto.variantId) {
      const variant = await this.variantRepository.findOne({
        where: { id: dto.variantId },
      });

      if (!variant) {
        throw new NotFoundException(`Variant with ID ${dto.variantId} not found`);
      }

      previousStock = variant.stock;
      newStock = previousStock + quantityChange;

      if (newStock < 0) {
        throw new ValidationException(
          `Insufficient stock. Current: ${previousStock}, requested: ${dto.quantity}`,
        );
      }

      variant.stock = newStock;
      await this.variantRepository.save(variant);

      // Check alerts
      await this.checkAndTriggerAlert(undefined, dto.variantId, newStock);
    } else if (dto.productId) {
      const product = await this.productRepository.findOne({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${dto.productId} not found`);
      }

      previousStock = product.stock;
      newStock = previousStock + quantityChange;

      if (newStock < 0) {
        throw new ValidationException(
          `Insufficient stock. Current: ${previousStock}, requested: ${dto.quantity}`,
        );
      }

      product.stock = newStock;
      await this.productRepository.save(product);

      // Check alerts
      await this.checkAndTriggerAlert(dto.productId, undefined, newStock);
    }

    // Record movement
    const movement = this.movementRepository.create({
      productId: dto.productId,
      variantId: dto.variantId,
      type: dto.type,
      quantity: quantityChange,
      previousStock: previousStock!,
      newStock: newStock!,
      referenceNumber: dto.referenceNumber,
      notes: dto.notes,
      unitCost: dto.unitCost,
      performedBy,
    });

    return this.movementRepository.save(movement);
  }

  /**
   * Reserve stock for an order (reduces available stock)
   */
  async reserveStock(
    reservations: StockReservation[],
    orderId: string,
    performedBy?: string,
  ): Promise<InventoryMovement[]> {
    const movements: InventoryMovement[] = [];

    for (const reservation of reservations) {
      const movement = await this.adjustStock(
        {
          productId: reservation.productId,
          variantId: reservation.variantId,
          type: MovementType.RESERVATION,
          quantity: reservation.quantity,
          notes: `Reserved for order`,
        },
        performedBy,
      );

      movement.orderId = orderId;
      await this.movementRepository.save(movement);
      movements.push(movement);
    }

    return movements;
  }

  /**
   * Release reserved stock (when order is cancelled)
   */
  async releaseStock(orderId: string, performedBy?: string): Promise<InventoryMovement[]> {
    const reservations = await this.movementRepository.find({
      where: {
        orderId,
        type: MovementType.RESERVATION,
      },
    });

    const movements: InventoryMovement[] = [];

    for (const reservation of reservations) {
      const movement = await this.adjustStock(
        {
          productId: reservation.productId ?? undefined,
          variantId: reservation.variantId ?? undefined,
          type: MovementType.RELEASE,
          quantity: Math.abs(reservation.quantity),
          notes: `Released from cancelled order`,
        },
        performedBy,
      );

      movement.orderId = orderId;
      await this.movementRepository.save(movement);
      movements.push(movement);
    }

    return movements;
  }

  /**
   * Confirm sale (convert reservation to sale when payment completes)
   */
  async confirmSale(orderId: string): Promise<void> {
    const reservations = await this.movementRepository.find({
      where: {
        orderId,
        type: MovementType.RESERVATION,
      },
    });

    for (const reservation of reservations) {
      // Create a sale movement (stock already reduced by reservation)
      const saleMovement = this.movementRepository.create({
        productId: reservation.productId,
        variantId: reservation.variantId,
        type: MovementType.SALE,
        quantity: 0, // No additional stock change
        previousStock: reservation.newStock,
        newStock: reservation.newStock,
        orderId,
        notes: `Sale confirmed`,
      });

      await this.movementRepository.save(saleMovement);
    }
  }

  /**
   * Get movement history
   */
  async getMovementHistory(
    productId?: string,
    variantId?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: InventoryMovement[]; total: number }> {
    const where: any = {};

    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;

    const [data, total] = await this.movementRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['product', 'variant'],
    });

    return { data, total };
  }

  /**
   * Get current stock level
   */
  async getStockLevel(productId?: string, variantId?: string): Promise<number> {
    if (variantId) {
      const variant = await this.variantRepository.findOne({
        where: { id: variantId },
      });
      return variant?.stock ?? 0;
    }

    if (productId) {
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });
      return product?.stock ?? 0;
    }

    throw new ValidationException('Either productId or variantId is required');
  }

  /**
   * Set alert threshold
   */
  async setAlertThreshold(dto: SetAlertThresholdDto): Promise<StockAlert> {
    if (!dto.productId && !dto.variantId) {
      throw new ValidationException('Either productId or variantId is required');
    }

    let alert = await this.alertRepository.findOne({
      where: dto.productId
        ? { productId: dto.productId }
        : { variantId: dto.variantId },
    });

    if (alert) {
      alert.lowStockThreshold = dto.lowStockThreshold;
      if (dto.criticalStockThreshold !== undefined) {
        alert.criticalStockThreshold = dto.criticalStockThreshold;
      }
      if (dto.alertEnabled !== undefined) {
        alert.alertEnabled = dto.alertEnabled;
      }
    } else {
      alert = this.alertRepository.create({
        productId: dto.productId,
        variantId: dto.variantId,
        lowStockThreshold: dto.lowStockThreshold,
        criticalStockThreshold: dto.criticalStockThreshold ?? 0,
        alertEnabled: dto.alertEnabled ?? true,
      });
    }

    return this.alertRepository.save(alert);
  }

  /**
   * Get all low stock items
   */
  async getLowStockItems(): Promise<LowStockItem[]> {
    const lowStockItems: LowStockItem[] = [];

    // Get product alerts
    const productAlerts = await this.alertRepository.find({
      where: { productId: MoreThan(''), alertEnabled: true },
      relations: ['product'],
    });

    for (const alert of productAlerts) {
      if (alert.product && alert.product.stock <= alert.lowStockThreshold) {
        lowStockItems.push({
          id: alert.product.id,
          name: alert.product.name,
          currentStock: alert.product.stock,
          threshold: alert.lowStockThreshold,
          type: 'product',
          isCritical: alert.product.stock <= alert.criticalStockThreshold,
        });
      }
    }

    // Get variant alerts
    const variantAlerts = await this.alertRepository.find({
      where: { variantId: MoreThan(''), alertEnabled: true },
      relations: ['variant', 'variant.product'],
    });

    for (const alert of variantAlerts) {
      if (alert.variant && alert.variant.stock <= alert.lowStockThreshold) {
        lowStockItems.push({
          id: alert.variant.id,
          name: `${alert.variant.product?.name || 'Unknown'} - ${alert.variant.sku}`,
          sku: alert.variant.sku,
          currentStock: alert.variant.stock,
          threshold: alert.lowStockThreshold,
          type: 'variant',
          isCritical: alert.variant.stock <= alert.criticalStockThreshold,
        });
      }
    }

    // Sort by criticality
    return lowStockItems.sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return a.currentStock - b.currentStock;
    });
  }

  /**
   * Bulk check stock availability
   */
  async checkStockAvailability(
    items: { productId?: string; variantId?: string; quantity: number }[],
  ): Promise<{ available: boolean; unavailableItems: string[] }> {
    const unavailableItems: string[] = [];

    for (const item of items) {
      const currentStock = await this.getStockLevel(item.productId, item.variantId);
      
      if (currentStock < item.quantity) {
        unavailableItems.push(item.variantId || item.productId || 'unknown');
      }
    }

    return {
      available: unavailableItems.length === 0,
      unavailableItems,
    };
  }

  /**
   * Check and trigger low stock alert
   */
  private async checkAndTriggerAlert(
    productId?: string,
    variantId?: string,
    currentStock?: number,
  ): Promise<void> {
    const alert = await this.alertRepository.findOne({
      where: productId ? { productId } : { variantId },
      relations: productId ? ['product'] : ['variant', 'variant.product'],
    });

    if (!alert || !alert.alertEnabled) return;

    if (currentStock !== undefined && currentStock <= alert.lowStockThreshold) {
      const now = new Date();
      const hoursSinceLastAlert = alert.lastAlertSentAt
        ? (now.getTime() - alert.lastAlertSentAt.getTime()) / (1000 * 60 * 60)
        : 24; // Send if never sent

      // Only send alert every 24 hours
      if (hoursSinceLastAlert >= 24) {
        const isCritical = currentStock <= alert.criticalStockThreshold;
        
        // Send notification
        try {
          await this.notificationsService.sendLowStockAlert({
            productName: alert.product?.name || alert.variant?.product?.name || 'Unknown',
            sku: alert.variant?.sku,
            currentStock,
            threshold: alert.lowStockThreshold,
            isCritical,
          });
        } catch (error) {
          console.error('Failed to send low stock alert:', error);
        }

        alert.lastAlertSentAt = now;
        alert.alertCount++;
        await this.alertRepository.save(alert);
      }
    }
  }

  private isOutgoingMovement(type: MovementType): boolean {
    return [
      MovementType.SALE,
      MovementType.RESERVATION,
      MovementType.ADJUSTMENT_OUT,
      MovementType.DAMAGED,
      MovementType.EXPIRED,
      MovementType.TRANSFER_OUT,
    ].includes(type);
  }
}
