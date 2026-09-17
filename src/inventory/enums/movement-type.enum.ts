export enum MovementType {
  // Incoming stock
  PURCHASE = 'purchase', // Inventory purchase
  RETURN = 'return', // Customer return
  ADJUSTMENT_IN = 'adjustment_in', // Manual positive adjustment
  TRANSFER_IN = 'transfer_in', // Transfer between warehouses

  // Outgoing stock
  SALE = 'sale', // Completed sale
  RESERVATION = 'reservation', // Reservation for pending order
  ADJUSTMENT_OUT = 'adjustment_out', // Manual negative adjustment
  DAMAGED = 'damaged', // Damaged products
  EXPIRED = 'expired', // Expired products
  TRANSFER_OUT = 'transfer_out', // Transfer between warehouses

  // Release (returns reserved stock)
  RELEASE = 'release', // Release of cancelled reservation
}
