export enum ShippingStatus {
  PENDING = 'pending', // Esperando envío
  PICKED_UP = 'picked_up', // Recogido por courier
  IN_TRANSIT = 'in_transit', // En tránsito
  OUT_FOR_DELIVERY = 'out_for_delivery', // En reparto
  DELIVERED = 'delivered', // Entregado
  FAILED = 'failed', // Intento fallido
  RETURNED = 'returned', // Devuelto
}
