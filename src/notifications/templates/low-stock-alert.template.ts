export interface LowStockAlertData {
  productName: string;
  sku?: string;
  currentStock: number;
  threshold: number;
  isCritical: boolean;
}

export function lowStockAlertEmailText(data: LowStockAlertData): string {
  const urgency = data.isCritical ? '🚨 CRÍTICO' : '⚠️ Bajo Stock';
  const skuInfo = data.sku ? ` (SKU: ${data.sku})` : '';

  return `
${urgency}: Alerta de Inventario

Producto: ${data.productName}${skuInfo}
Stock actual: ${data.currentStock} unidades
Umbral configurado: ${data.threshold} unidades

${data.isCritical ? 'ACCIÓN REQUERIDA: El stock ha llegado a nivel crítico.' : 'Se recomienda reabastecer pronto.'}

---
Este es un mensaje automático del sistema de inventario.
  `.trim();
}

export function lowStockAlertEmailSubject(data: LowStockAlertData): string {
  const urgency = data.isCritical ? '🚨 CRÍTICO' : '⚠️ Bajo Stock';
  return `${urgency}: ${data.productName} - Stock: ${data.currentStock}`;
}
