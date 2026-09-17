export enum ShippingStatus {
  PENDING = 'pending', // Awaiting shipment
  PICKED_UP = 'picked_up', // Picked up by courier
  IN_TRANSIT = 'in_transit', // In transit
  OUT_FOR_DELIVERY = 'out_for_delivery', // Out for delivery
  DELIVERED = 'delivered', // Delivered
  FAILED = 'failed', // Failed attempt
  RETURNED = 'returned', // Returned
}
