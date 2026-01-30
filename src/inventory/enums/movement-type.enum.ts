export enum MovementType {
  // Incoming stock
  PURCHASE = 'purchase',           // Compra de inventario
  RETURN = 'return',               // Devolución de cliente
  ADJUSTMENT_IN = 'adjustment_in', // Ajuste positivo manual
  TRANSFER_IN = 'transfer_in',     // Transferencia entre almacenes

  // Outgoing stock
  SALE = 'sale',                   // Venta completada
  RESERVATION = 'reservation',     // Reserva por orden pendiente
  ADJUSTMENT_OUT = 'adjustment_out', // Ajuste negativo manual
  DAMAGED = 'damaged',             // Productos dañados
  EXPIRED = 'expired',             // Productos vencidos
  TRANSFER_OUT = 'transfer_out',   // Transferencia entre almacenes

  // Release (devuelve stock reservado)
  RELEASE = 'release',             // Liberación de reserva cancelada
}
