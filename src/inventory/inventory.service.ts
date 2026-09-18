import { Injectable } from '@nestjs/common';
import { MovementType, Prisma } from '@prisma/client';
import { NotFoundException, ValidationException } from '../common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SetAlertThresholdDto } from './dto/set-alert-threshold.dto';

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
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Adjust stock for a product or variant
   */
  async adjustStock(dto: AdjustStockDto, performedBy?: string) {
    if (!dto.productId && !dto.variantId) {
      throw new ValidationException(
        'Either productId or variantId is required',
      );
    }

    const isOutgoing = this.isOutgoingMovement(dto.type);
    const quantityChange = isOutgoing ? -dto.quantity : dto.quantity;

    let previousStock: number;
    let newStock: number;

    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
      });

      if (!variant) {
        throw new NotFoundException(
          `Variant with ID ${dto.variantId} not found`,
        );
      }

      previousStock = variant.stock;

      if (isOutgoing) {
        const result = await this.prisma.productVariant.updateMany({
          where: { id: dto.variantId, stock: { gte: dto.quantity } },
          data: { stock: { decrement: dto.quantity } },
        });

        if (result.count === 0) {
          throw new ValidationException(
            `Insufficient stock. Current: ${previousStock}, requested: ${dto.quantity}`,
          );
        }
      } else {
        await this.prisma.productVariant.update({
          where: { id: dto.variantId },
          data: { stock: { increment: dto.quantity } },
        });
      }

      const updatedVariant = await this.prisma.productVariant.findUniqueOrThrow(
        {
          where: { id: dto.variantId },
          select: { stock: true },
        },
      );

      newStock = updatedVariant.stock;

      // Check alerts
      await this.checkAndTriggerAlert(undefined, dto.variantId, newStock);
    } else if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${dto.productId} not found`,
        );
      }

      previousStock = product.stock;

      if (isOutgoing) {
        const result = await this.prisma.product.updateMany({
          where: { id: dto.productId, stock: { gte: dto.quantity } },
          data: { stock: { decrement: dto.quantity } },
        });

        if (result.count === 0) {
          throw new ValidationException(
            `Insufficient stock. Current: ${previousStock}, requested: ${dto.quantity}`,
          );
        }
      } else {
        await this.prisma.product.update({
          where: { id: dto.productId },
          data: { stock: { increment: dto.quantity } },
        });
      }

      const updatedProduct = await this.prisma.product.findUniqueOrThrow({
        where: { id: dto.productId },
        select: { stock: true },
      });

      newStock = updatedProduct.stock;

      // Check alerts
      await this.checkAndTriggerAlert(dto.productId, undefined, newStock);
    }

    // Record movement
    return this.prisma.inventoryMovement.create({
      data: {
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
      },
    });
  }

  /**
   * Reserve stock for an order (reduces available stock)
   */
  async reserveStock(
    reservations: StockReservation[],
    orderId: string,
    performedBy?: string,
  ) {
    const movements: any[] = [];

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

      const updatedMovement = await this.prisma.inventoryMovement.update({
        where: { id: movement.id },
        data: { orderId },
      });

      movements.push(updatedMovement);
    }

    return movements;
  }

  /**
   * Release reserved stock (when order is cancelled)
   */
  async releaseStock(orderId: string, performedBy?: string) {
    const reservations = await this.prisma.inventoryMovement.findMany({
      where: {
        orderId,
        type: MovementType.RESERVATION,
      },
    });

    const movements: any[] = [];

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

      const updatedMovement = await this.prisma.inventoryMovement.update({
        where: { id: movement.id },
        data: { orderId },
      });

      movements.push(updatedMovement);
    }

    return movements;
  }

  /**
   * Confirm sale (convert reservation to sale when payment completes)
   */
  async confirmSale(orderId: string): Promise<void> {
    const reservations = await this.prisma.inventoryMovement.findMany({
      where: {
        orderId,
        type: MovementType.RESERVATION,
      },
    });

    for (const reservation of reservations) {
      // Create a sale movement (stock already reduced by reservation)
      await this.prisma.inventoryMovement.create({
        data: {
          productId: reservation.productId,
          variantId: reservation.variantId,
          type: MovementType.SALE,
          quantity: 0, // No additional stock change
          previousStock: reservation.newStock,
          newStock: reservation.newStock,
          orderId,
          notes: `Sale confirmed`,
        },
      });
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
  ) {
    const where: Prisma.InventoryMovementWhereInput = {};

    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;

    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { product: true, variant: true },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get current stock level
   */
  async getStockLevel(productId?: string, variantId?: string): Promise<number> {
    if (variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
      });
      return variant?.stock ?? 0;
    }

    if (productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      return product?.stock ?? 0;
    }

    throw new ValidationException('Either productId or variantId is required');
  }

  /**
   * Set alert threshold
   */
  async setAlertThreshold(dto: SetAlertThresholdDto) {
    if (!dto.productId && !dto.variantId) {
      throw new ValidationException(
        'Either productId or variantId is required',
      );
    }

    const existingAlert = await this.prisma.stockAlert.findFirst({
      where: dto.productId
        ? { productId: dto.productId }
        : { variantId: dto.variantId },
    });

    if (existingAlert) {
      return this.prisma.stockAlert.update({
        where: { id: existingAlert.id },
        data: {
          lowStockThreshold: dto.lowStockThreshold,
          criticalStockThreshold:
            dto.criticalStockThreshold ?? existingAlert.criticalStockThreshold,
          alertEnabled: dto.alertEnabled ?? existingAlert.alertEnabled,
        },
      });
    } else {
      return this.prisma.stockAlert.create({
        data: {
          productId: dto.productId,
          variantId: dto.variantId,
          lowStockThreshold: dto.lowStockThreshold,
          criticalStockThreshold: dto.criticalStockThreshold ?? 0,
          alertEnabled: dto.alertEnabled ?? true,
        },
      });
    }
  }

  /**
   * Get all low stock items
   */
  async getLowStockItems(): Promise<LowStockItem[]> {
    const lowStockItems: LowStockItem[] = [];

    // Get product alerts
    const productAlerts = await this.prisma.stockAlert.findMany({
      where: { productId: { not: null }, alertEnabled: true },
      include: { product: true },
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
    const variantAlerts = await this.prisma.stockAlert.findMany({
      where: { variantId: { not: null }, alertEnabled: true },
      include: { variant: { include: { product: true } } },
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
      const currentStock = await this.getStockLevel(
        item.productId,
        item.variantId,
      );

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
    const alert = await this.prisma.stockAlert.findFirst({
      where: productId ? { productId } : { variantId },
      include: {
        product: true,
        variant: { include: { product: true } },
      },
    });

    if (!alert || !alert.alertEnabled) return;

    if (currentStock !== undefined && currentStock <= alert.lowStockThreshold) {
      const isCritical = currentStock <= alert.criticalStockThreshold;
      const now = new Date();
      const hoursSinceLastAlert = alert.lastAlertSentAt
        ? (now.getTime() - alert.lastAlertSentAt.getTime()) / (1000 * 60 * 60)
        : 24; // Send if never sent

      // Critical alerts always go through; low-stock repeats are throttled to once/24h
      if (isCritical || hoursSinceLastAlert >= 24) {
        // Send notification
        try {
          await this.notificationsService.sendLowStockAlert({
            productName:
              alert.product?.name || alert.variant?.product?.name || 'Unknown',
            sku: alert.variant?.sku,
            currentStock,
            threshold: alert.lowStockThreshold,
            isCritical,
          });
        } catch (error) {
          console.error('Failed to send low stock alert:', error);
        }

        await this.prisma.stockAlert.update({
          where: { id: alert.id },
          data: {
            lastAlertSentAt: now,
            alertCount: { increment: 1 },
          },
        });
      }
    }
  }

  private isOutgoingMovement(type: MovementType): boolean {
    const outgoingTypes: MovementType[] = [
      MovementType.SALE,
      MovementType.RESERVATION,
      MovementType.ADJUSTMENT_OUT,
      MovementType.DAMAGED,
      MovementType.EXPIRED,
      MovementType.TRANSFER_OUT,
    ];
    return outgoingTypes.includes(type);
  }
}
