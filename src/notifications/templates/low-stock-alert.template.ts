export interface LowStockAlertData {
  productName: string;
  sku?: string;
  currentStock: number;
  threshold: number;
  isCritical: boolean;
}

export function lowStockAlertEmailText(data: LowStockAlertData): string {
  const urgency = data.isCritical ? '🚨 CRITICAL' : '⚠️ Low Stock';
  const skuInfo = data.sku ? ` (SKU: ${data.sku})` : '';

  return `
${urgency}: Inventory Alert

Product: ${data.productName}${skuInfo}
Current stock: ${data.currentStock} units
Configured threshold: ${data.threshold} units

${data.isCritical ? 'ACTION REQUIRED: Stock has reached a critical level.' : 'Restocking is recommended soon.'}

---
This is an automated message from the inventory system.
  `.trim();
}

export function lowStockAlertEmailSubject(data: LowStockAlertData): string {
  const urgency = data.isCritical ? '🚨 CRITICAL' : '⚠️ Low Stock';
  return `${urgency}: ${data.productName} - Stock: ${data.currentStock}`;
}
