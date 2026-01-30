# 📚 Manual de Base de Datos - Commerce API

## Índice

1. [Visión General](#1-visión-general)
2. [Arquitectura de la Base de Datos](#2-arquitectura-de-la-base-de-datos)
3. [Enumeraciones (Enums)](#3-enumeraciones-enums)
4. [Módulos y Tablas](#4-módulos-y-tablas)
5. [Diagrama de Relaciones (ERD)](#5-diagrama-de-relaciones-erd)
6. [Convenciones de Nomenclatura](#6-convenciones-de-nomenclatura)
7. [Índices y Optimización](#7-índices-y-optimización)
8. [Migraciones](#8-migraciones)
9. [Mantenimiento](#9-mantenimiento)
10. [Respaldos y Recuperación](#10-respaldos-y-recuperación)
11. [Consultas Útiles](#11-consultas-útiles)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Visión General

### Tecnologías

| Componente | Tecnología |
|------------|------------|
| Base de Datos | PostgreSQL |
| ORM (Schema) | Prisma |
| ORM (Runtime) | TypeORM |
| Migraciones | Prisma Migrate |

### Características Principales

- **UUID como Primary Keys**: Todas las tablas usan UUID v4 para identificadores únicos
- **Soft Delete**: No implementado (se usa `is_active` para desactivación lógica)
- **Timestamps Automáticos**: `created_at` y `updated_at` en todas las tablas principales
- **Tipos de Datos Precisos**: Uso de `DECIMAL(10,2)` para valores monetarios
- **Relaciones en Cascada**: Configuradas según el contexto de negocio

---

## 2. Arquitectura de la Base de Datos

### Módulos del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COMMERCE API DATABASE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   AUTH &     │  │   PRODUCTS   │  │    ORDERS    │              │
│  │   USERS      │  │              │  │              │              │
│  │              │  │  - products  │  │  - orders    │              │
│  │  - users     │  │  - variants  │  │  - items     │              │
│  │  - addresses │  │  - images    │  │  - payments  │              │
│  │              │  │  - attrs     │  │              │              │
│  └──────────────┘  │  - categories│  └──────────────┘              │
│                    └──────────────┘                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │    CART      │  │   SHIPPING   │  │  INVENTORY   │              │
│  │              │  │              │  │              │              │
│  │  - carts     │  │  - shipments │  │  - movements │              │
│  │  - items     │  │  - events    │  │  - alerts    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   REVIEWS    │  │   COUPONS    │  │   WISHLIST   │              │
│  │              │  │              │  │              │              │
│  │  - reviews   │  │  - coupons   │  │  - items     │              │
│  │              │  │  - usages    │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Enumeraciones (Enums)

### Role
Roles de usuario en el sistema.

| Valor | Descripción |
|-------|-------------|
| `USER` | Usuario estándar (cliente) |
| `ADMIN` | Administrador con acceso total |

### OrderStatus
Estados del ciclo de vida de una orden.

| Valor | Descripción | Siguiente Estado Válido |
|-------|-------------|-------------------------|
| `PENDING` | Orden creada, pendiente de pago | CONFIRMED, CANCELLED |
| `CONFIRMED` | Pago confirmado | PROCESSING, CANCELLED |
| `PROCESSING` | En preparación | SHIPPED, CANCELLED |
| `SHIPPED` | Enviada | DELIVERED |
| `DELIVERED` | Entregada al cliente | REFUNDED |
| `CANCELLED` | Cancelada | - |
| `REFUNDED` | Reembolsada | - |

### PaymentStatus
Estados del proceso de pago.

| Valor | Descripción |
|-------|-------------|
| `PENDING` | Esperando pago |
| `PROCESSING` | Procesando con pasarela |
| `COMPLETED` | Pago exitoso |
| `FAILED` | Pago fallido |
| `REFUNDED` | Reembolsado |
| `CANCELLED` | Cancelado |

### PaymentMethod
Métodos de pago disponibles.

| Valor | Descripción |
|-------|-------------|
| `STRIPE` | Tarjeta de crédito/débito vía Stripe |
| `MERCADOPAGO` | MercadoPago (Perú) |
| `CASH_ON_DELIVERY` | Pago contra entrega |

### ShippingCarrier
Transportistas disponibles en Perú.

| Valor | Descripción |
|-------|-------------|
| `OLVA` | Olva Courier |
| `SHALOM` | Shalom Empresarial |
| `CRUZ_DEL_SUR` | Cruz del Sur Cargo |
| `SERVIENTREGA` | Servientrega |
| `PICKUP` | Recojo en tienda |

### ShippingStatus
Estados del envío.

| Valor | Descripción |
|-------|-------------|
| `PENDING` | Pendiente de procesamiento |
| `PROCESSING` | En preparación |
| `SHIPPED` | Entregado al transportista |
| `IN_TRANSIT` | En tránsito |
| `OUT_FOR_DELIVERY` | En reparto |
| `DELIVERED` | Entregado |
| `FAILED` | Entrega fallida |
| `RETURNED` | Devuelto |
| `CANCELLED` | Cancelado |

### MovementType
Tipos de movimiento de inventario.

| Valor | Tipo | Descripción |
|-------|------|-------------|
| `PURCHASE` | Entrada | Compra de mercadería |
| `RETURN` | Entrada | Devolución de cliente |
| `ADJUSTMENT_IN` | Entrada | Ajuste positivo |
| `TRANSFER_IN` | Entrada | Transferencia entrante |
| `SALE` | Salida | Venta |
| `RESERVATION` | Salida | Reserva de stock |
| `ADJUSTMENT_OUT` | Salida | Ajuste negativo |
| `DAMAGED` | Salida | Producto dañado |
| `EXPIRED` | Salida | Producto vencido |
| `TRANSFER_OUT` | Salida | Transferencia saliente |
| `RELEASE` | Entrada | Liberación de reserva |

### DiscountType
Tipos de descuento para cupones.

| Valor | Descripción | Ejemplo |
|-------|-------------|---------|
| `PERCENTAGE` | Porcentaje de descuento | 20% off |
| `FIXED_AMOUNT` | Monto fijo | S/. 50 off |
| `FREE_SHIPPING` | Envío gratis | - |

---

## 4. Módulos y Tablas

### 4.1 Auth & Users

#### `users`
Tabla principal de usuarios del sistema.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `email` | VARCHAR | NO | - | Email único |
| `password` | VARCHAR | NO | - | Hash bcrypt |
| `first_name` | VARCHAR | YES | NULL | Nombre |
| `last_name` | VARCHAR | YES | NULL | Apellido |
| `phone` | VARCHAR | YES | NULL | Teléfono |
| `role` | ENUM | NO | 'USER' | Rol del usuario |
| `is_active` | BOOLEAN | NO | true | Estado activo |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

**Índices:**
- `users_email_key` (UNIQUE) en `email`

**Relaciones:**
- `addresses` → 1:N con `addresses`
- `orders` → 1:N con `orders`
- `carts` → 1:N con `carts`
- `reviews` → 1:N con `reviews`
- `couponUsages` → 1:N con `coupon_usages`
- `wishlistItems` → 1:N con `wishlist_items`

---

#### `addresses`
Direcciones de envío de los usuarios.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | NO | - | FK a users |
| `recipient_name` | VARCHAR(100) | NO | - | Nombre destinatario |
| `phone` | VARCHAR(20) | NO | - | Teléfono contacto |
| `street` | VARCHAR(200) | NO | - | Calle |
| `number` | VARCHAR(50) | YES | NULL | Número |
| `apartment` | VARCHAR(100) | YES | NULL | Departamento/Oficina |
| `district` | VARCHAR(100) | NO | - | Distrito |
| `city` | VARCHAR(100) | NO | - | Ciudad |
| `department` | VARCHAR(100) | NO | - | Departamento/Región |
| `postal_code` | VARCHAR(10) | YES | NULL | Código postal |
| `reference` | TEXT | YES | NULL | Referencia |
| `is_default` | BOOLEAN | NO | false | Es dirección por defecto |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

**Relaciones:**
- `user` → N:1 con `users` (ON DELETE CASCADE)

---

### 4.2 Products

#### `categories`
Categorías de productos con soporte para jerarquías.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `name` | VARCHAR | NO | - | Nombre categoría |
| `slug` | VARCHAR | NO | - | URL-friendly name |
| `description` | TEXT | YES | NULL | Descripción |
| `image` | VARCHAR | YES | NULL | URL imagen |
| `parent_id` | UUID | YES | NULL | FK a categories (self) |
| `is_active` | BOOLEAN | NO | true | Estado activo |
| `display_order` | INT | NO | 0 | Orden de visualización |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

**Índices:**
- `categories_slug_key` (UNIQUE) en `slug`

**Relaciones:**
- `parent` → N:1 con `categories` (self-referencing, ON DELETE SET NULL)
- `children` → 1:N con `categories` (self-referencing)
- `products` → 1:N con `products`

---

#### `products`
Productos del catálogo.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `name` | VARCHAR | NO | - | Nombre producto |
| `slug` | VARCHAR | NO | - | URL-friendly name |
| `description` | TEXT | YES | NULL | Descripción larga |
| `short_description` | VARCHAR | YES | NULL | Descripción corta |
| `price` | DECIMAL(10,2) | NO | - | Precio base |
| `compare_at_price` | DECIMAL(10,2) | YES | NULL | Precio anterior (tachado) |
| `stock` | INT | NO | 0 | Stock disponible |
| `is_active` | BOOLEAN | NO | true | Producto activo |
| `has_variants` | BOOLEAN | NO | false | Tiene variantes |
| `category_id` | UUID | YES | NULL | FK a categories |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

**Índices:**
- `products_slug_key` (UNIQUE) en `slug`

**Relaciones:**
- `category` → N:1 con `categories` (ON DELETE SET NULL)
- `variants` → 1:N con `product_variants`
- `images` → 1:N con `product_images`
- `reviews` → 1:N con `reviews`
- `cartItems` → 1:N con `cart_items`
- `orderItems` → 1:N con `order_items`
- `inventoryMovements` → 1:N con `inventory_movements`
- `stockAlerts` → 1:1 con `stock_alerts`
- `wishlistItems` → 1:N con `wishlist_items`

---

#### `product_variants`
Variantes de productos (tallas, colores, etc.).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `product_id` | UUID | NO | - | FK a products |
| `sku` | VARCHAR | NO | - | Código único |
| `price` | DECIMAL(10,2) | NO | - | Precio variante |
| `compare_at_price` | DECIMAL(10,2) | YES | NULL | Precio anterior |
| `stock` | INT | NO | 0 | Stock disponible |
| `is_active` | BOOLEAN | NO | true | Variante activa |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

**Índices:**
- `product_variants_sku_key` (UNIQUE) en `sku`

**Relaciones:**
- `product` → N:1 con `products` (ON DELETE CASCADE)
- `attributeValues` → N:M con `product_attribute_values` (via `variant_attribute_values`)

---

#### `product_attributes`
Definición de atributos (ej: "Talla", "Color").

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `name` | VARCHAR | NO | - | Nombre del atributo |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

**Índices:**
- `product_attributes_name_key` (UNIQUE) en `name`

---

#### `product_attribute_values`
Valores posibles de atributos (ej: "S", "M", "L" para Talla).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `attribute_id` | UUID | NO | - | FK a product_attributes |
| `value` | VARCHAR | NO | - | Valor del atributo |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

**Índices:**
- `product_attribute_values_attribute_id_value_key` (UNIQUE) en `(attribute_id, value)`

---

#### `variant_attribute_values`
Tabla puente: asocia variantes con valores de atributos.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `variant_id` | UUID | NO | - | FK a product_variants (PK) |
| `attribute_value_id` | UUID | NO | - | FK a product_attribute_values (PK) |

**Índices:**
- PK compuesto en `(variant_id, attribute_value_id)`

---

#### `product_images`
Imágenes de productos.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `product_id` | UUID | NO | - | FK a products |
| `url` | VARCHAR | NO | - | URL de la imagen |
| `public_id` | VARCHAR | YES | NULL | ID en Cloudinary |
| `alt` | VARCHAR | YES | NULL | Texto alternativo |
| `width` | INT | YES | NULL | Ancho en pixels |
| `height` | INT | YES | NULL | Alto en pixels |
| `display_order` | INT | NO | 0 | Orden de visualización |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

---

### 4.3 Cart

#### `carts`
Carritos de compra.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | YES | NULL | FK a users (carrito autenticado) |
| `session_id` | VARCHAR | YES | NULL | ID sesión (carrito anónimo) |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

**Nota:** Un carrito puede ser de usuario autenticado (`user_id`) o anónimo (`session_id`).

---

#### `cart_items`
Ítems del carrito.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `cart_id` | UUID | NO | - | FK a carts |
| `product_id` | UUID | NO | - | FK a products |
| `variant_id` | UUID | YES | NULL | FK a product_variants |
| `quantity` | INT | NO | 1 | Cantidad |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

**Índices:**
- `cart_items_cart_id_product_id_variant_id_key` (UNIQUE) en `(cart_id, product_id, variant_id)`

---

### 4.4 Orders

#### `orders`
Órdenes de compra.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `order_number` | VARCHAR | NO | - | Número único de orden |
| `user_id` | UUID | NO | - | FK a users |
| `status` | ENUM | NO | 'PENDING' | Estado de la orden |
| `shipping_address` | JSONB | NO | - | Snapshot de dirección |
| `subtotal` | DECIMAL(10,2) | NO | - | Subtotal sin envío |
| `shipping_cost` | DECIMAL(10,2) | NO | 0 | Costo de envío |
| `discount` | DECIMAL(10,2) | NO | 0 | Descuento aplicado |
| `total` | DECIMAL(10,2) | NO | - | Total final |
| `discount_code` | VARCHAR | YES | NULL | Código de cupón usado |
| `notes` | TEXT | YES | NULL | Notas del cliente |
| `admin_notes` | TEXT | YES | NULL | Notas internas |
| `tracking_number` | VARCHAR | YES | NULL | Número de tracking |
| `tracking_url` | VARCHAR | YES | NULL | URL de rastreo |
| `confirmed_at` | TIMESTAMP | YES | NULL | Fecha confirmación |
| `shipped_at` | TIMESTAMP | YES | NULL | Fecha envío |
| `delivered_at` | TIMESTAMP | YES | NULL | Fecha entrega |
| `cancelled_at` | TIMESTAMP | YES | NULL | Fecha cancelación |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

**Índices:**
- `orders_order_number_key` (UNIQUE) en `order_number`
- `orders_user_id_idx` en `user_id`
- `orders_order_number_idx` en `order_number`

**Estructura JSONB de `shipping_address`:**
```json
{
  "recipientName": "Juan Pérez",
  "recipientPhone": "+51999888777",
  "street": "Av. Javier Prado",
  "number": "1234",
  "apartment": "Dpto 501",
  "district": "San Isidro",
  "city": "Lima",
  "department": "Lima",
  "postalCode": "15036",
  "reference": "Frente al parque"
}
```

---

#### `order_items`
Ítems de una orden (snapshot al momento de compra).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `order_id` | UUID | NO | - | FK a orders |
| `product_id` | UUID | NO | - | FK a products |
| `variant_id` | UUID | YES | NULL | FK a product_variants |
| `product_name` | VARCHAR | NO | - | Nombre al momento de compra |
| `variant_attributes` | JSONB | YES | NULL | Atributos de la variante |
| `quantity` | INT | NO | - | Cantidad |
| `unit_price` | DECIMAL(10,2) | NO | - | Precio unitario |
| `subtotal` | DECIMAL(10,2) | NO | - | Subtotal del ítem |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |

**Estructura JSONB de `variant_attributes`:**
```json
[
  { "name": "Talla", "value": "M" },
  { "name": "Color", "value": "Azul" }
]
```

---

#### `payments`
Pagos asociados a órdenes.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `order_id` | UUID | NO | - | FK a orders |
| `method` | ENUM | NO | - | Método de pago |
| `status` | ENUM | NO | 'PENDING' | Estado del pago |
| `amount` | DECIMAL(10,2) | NO | - | Monto |
| `currency` | VARCHAR | NO | 'PEN' | Moneda (ISO 4217) |
| `external_id` | VARCHAR | YES | NULL | ID en pasarela externa |
| `external_status` | VARCHAR | YES | NULL | Estado en pasarela |
| `external_data` | JSONB | YES | NULL | Respuesta completa |
| `error_code` | VARCHAR | YES | NULL | Código de error |
| `error_message` | TEXT | YES | NULL | Mensaje de error |
| `refund_id` | VARCHAR | YES | NULL | ID de reembolso |
| `refunded_amount` | DECIMAL(10,2) | YES | NULL | Monto reembolsado |
| `refund_reason` | TEXT | YES | NULL | Razón del reembolso |
| `refunded_at` | TIMESTAMP | YES | NULL | Fecha reembolso |
| `completed_at` | TIMESTAMP | YES | NULL | Fecha completado |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

---

### 4.5 Shipping

#### `shipments`
Envíos de órdenes.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `order_id` | UUID | NO | - | FK a orders |
| `carrier` | ENUM | NO | - | Transportista |
| `status` | ENUM | NO | 'PENDING' | Estado del envío |
| `tracking_number` | VARCHAR | YES | NULL | Número de guía |
| `tracking_url` | VARCHAR | YES | NULL | URL de rastreo |
| `recipient_name` | VARCHAR | NO | - | Nombre destinatario |
| `recipient_phone` | VARCHAR | NO | - | Teléfono destinatario |
| `address_line_1` | VARCHAR | NO | - | Dirección línea 1 |
| `address_line_2` | VARCHAR | YES | NULL | Dirección línea 2 |
| `city` | VARCHAR | NO | - | Ciudad |
| `department` | VARCHAR | NO | - | Departamento |
| `postal_code` | VARCHAR | YES | NULL | Código postal |
| `shipping_cost` | DECIMAL(10,2) | NO | - | Costo de envío |
| `weight_kg` | DECIMAL(8,2) | YES | NULL | Peso en kg |
| `estimated_delivery_date` | DATE | YES | NULL | Fecha estimada entrega |
| `shipped_at` | TIMESTAMP | YES | NULL | Fecha de envío |
| `delivered_at` | TIMESTAMP | YES | NULL | Fecha de entrega |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

---

#### `shipment_events`
Historial de eventos de un envío.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `shipment_id` | UUID | NO | - | FK a shipments |
| `status` | ENUM | NO | - | Estado del evento |
| `location` | VARCHAR | YES | NULL | Ubicación |
| `description` | TEXT | YES | NULL | Descripción del evento |
| `occurred_at` | TIMESTAMP | NO | - | Fecha/hora del evento |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |

---

### 4.6 Inventory

#### `inventory_movements`
Registro de movimientos de inventario.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `product_id` | UUID | YES | NULL | FK a products |
| `variant_id` | UUID | YES | NULL | FK a product_variants |
| `type` | ENUM | NO | - | Tipo de movimiento |
| `quantity` | INT | NO | - | Cantidad (+ entrada, - salida) |
| `previous_stock` | INT | NO | - | Stock antes del movimiento |
| `new_stock` | INT | NO | - | Stock después del movimiento |
| `order_id` | UUID | YES | NULL | Orden relacionada |
| `reference_number` | VARCHAR | YES | NULL | Número de referencia |
| `notes` | TEXT | YES | NULL | Notas adicionales |
| `performed_by` | UUID | YES | NULL | Usuario que realizó |
| `unit_cost` | DECIMAL(10,2) | YES | NULL | Costo unitario |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |

**Índices:**
- `inventory_movements_product_id_created_at_idx` en `(product_id, created_at)`
- `inventory_movements_variant_id_created_at_idx` en `(variant_id, created_at)`

---

#### `stock_alerts`
Configuración de alertas de stock bajo.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `product_id` | UUID | YES | NULL | FK a products (UNIQUE) |
| `variant_id` | UUID | YES | NULL | FK a product_variants (UNIQUE) |
| `low_stock_threshold` | INT | NO | 10 | Umbral de stock bajo |
| `critical_stock_threshold` | INT | NO | 0 | Umbral crítico |
| `alert_enabled` | BOOLEAN | NO | true | Alertas activas |
| `last_alert_sent_at` | TIMESTAMP | YES | NULL | Última alerta enviada |
| `alert_count` | INT | NO | 0 | Contador de alertas |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

---

### 4.7 Reviews

#### `reviews`
Reseñas de productos.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | NO | - | FK a users |
| `product_id` | UUID | NO | - | FK a products |
| `rating` | INT | NO | - | Calificación (1-5) |
| `title` | VARCHAR | YES | NULL | Título de la reseña |
| `comment` | TEXT | YES | NULL | Comentario |
| `is_verified_purchase` | BOOLEAN | NO | false | Compra verificada |
| `is_approved` | BOOLEAN | NO | true | Aprobada por admin |
| `helpful_count` | INT | NO | 0 | Votos de "útil" |
| `images` | TEXT[] | YES | NULL | URLs de imágenes |
| `admin_response` | TEXT | YES | NULL | Respuesta del admin |
| `admin_response_at` | TIMESTAMP | YES | NULL | Fecha respuesta |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

**Índices:**
- `reviews_user_id_product_id_key` (UNIQUE) en `(user_id, product_id)`
- `reviews_product_id_created_at_idx` en `(product_id, created_at)`

---

### 4.8 Coupons

#### `coupons`
Cupones de descuento.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `code` | VARCHAR(50) | NO | - | Código del cupón |
| `description` | TEXT | YES | NULL | Descripción |
| `discount_type` | ENUM | NO | - | Tipo de descuento |
| `discount_value` | DECIMAL(10,2) | NO | - | Valor (% o monto) |
| `min_purchase_amount` | DECIMAL(10,2) | YES | NULL | Compra mínima |
| `max_discount_amount` | DECIMAL(10,2) | YES | NULL | Descuento máximo |
| `usage_limit` | INT | YES | NULL | Límite total de usos |
| `usage_count` | INT | NO | 0 | Usos actuales |
| `usage_limit_per_user` | INT | YES | NULL | Límite por usuario |
| `start_date` | TIMESTAMP | NO | - | Fecha inicio vigencia |
| `end_date` | TIMESTAMP | NO | - | Fecha fin vigencia |
| `is_active` | BOOLEAN | NO | true | Cupón activo |
| `applicable_categories` | TEXT[] | YES | NULL | Categorías donde aplica |
| `applicable_products` | TEXT[] | YES | NULL | Productos donde aplica |
| `excluded_products` | TEXT[] | YES | NULL | Productos excluidos |
| `is_first_purchase_only` | BOOLEAN | NO | false | Solo primera compra |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |
| `updated_at` | TIMESTAMP | NO | now() | Última actualización |

**Índices:**
- `coupons_code_key` (UNIQUE) en `code`

---

#### `coupon_usages`
Registro de uso de cupones.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `coupon_id` | UUID | NO | - | FK a coupons |
| `user_id` | UUID | NO | - | FK a users |
| `order_id` | UUID | YES | NULL | FK a orders |
| `discount_applied` | DECIMAL(10,2) | NO | - | Descuento aplicado |
| `used_at` | TIMESTAMP | NO | now() | Fecha de uso |

**Índices:**
- `coupon_usages_coupon_id_user_id_idx` en `(coupon_id, user_id)`

---

### 4.9 Wishlist

#### `wishlist_items`
Lista de deseos de usuarios.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | NO | - | FK a users |
| `product_id` | UUID | NO | - | FK a products |
| `variant_id` | UUID | YES | NULL | FK a product_variants |
| `notes` | TEXT | YES | NULL | Notas personales |
| `price_when_added` | DECIMAL(10,2) | YES | NULL | Precio al agregar |
| `notify_on_price_drop` | BOOLEAN | NO | false | Notificar baja precio |
| `notify_on_back_in_stock` | BOOLEAN | NO | false | Notificar disponibilidad |
| `created_at` | TIMESTAMP | NO | now() | Fecha creación |

**Índices:**
- `wishlist_items_user_id_product_id_variant_id_key` (UNIQUE) en `(user_id, product_id, variant_id)`
- `wishlist_items_user_id_created_at_idx` en `(user_id, created_at)`

---

## 5. Diagrama de Relaciones (ERD)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USERS MODULE                                     │
└──────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐         ┌─────────────┐
    │   users     │ 1 ─── N │  addresses  │
    │             │         │             │
    │  id (PK)    │         │  id (PK)    │
    │  email      │         │  user_id (FK)│
    │  password   │         │  ...        │
    │  role       │         └─────────────┘
    │  ...        │
    └──────┬──────┘
           │
           │ 1
           │
    ┌──────┴──────┐──────┐──────┐──────┐──────┐
    │      N      │  N   │  N   │  N   │  N   │
    ▼             ▼      ▼      ▼      ▼      ▼
┌───────┐   ┌───────┐ ┌────┐ ┌─────┐ ┌──────┐ ┌────────┐
│orders │   │reviews│ │cart│ │wish │ │coupon│ │payments│
└───────┘   └───────┘ └────┘ │list │ │usage │ └────────┘
                             └─────┘ └──────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                            PRODUCTS MODULE                                    │
└──────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │ categories  │ ◄───┐
                    │             │     │ (self-referencing)
                    │  id (PK)    │ ────┘
                    │  parent_id  │
                    │  ...        │
                    └──────┬──────┘
                           │ 1
                           │
                           ▼ N
                    ┌─────────────┐
                    │  products   │
                    │             │
                    │  id (PK)    │
                    │  category_id│
                    │  ...        │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │ 1                │ 1                │ 1
        ▼ N                ▼ N                ▼ N
 ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
 │product_images│   │product_      │   │  reviews     │
 │              │   │variants      │   │              │
 └──────────────┘   └──────┬───────┘   └──────────────┘
                           │ N
                           │
                           ▼ M
                    ┌──────────────────────┐
                    │variant_attribute_    │
                    │values (junction)     │
                    └──────────┬───────────┘
                               │ N
                               │
                               ▼ 1
                    ┌──────────────────────┐
                    │product_attribute_    │
                    │values                │
                    └──────────┬───────────┘
                               │ N
                               │
                               ▼ 1
                    ┌──────────────────────┐
                    │product_attributes    │
                    └──────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                             ORDERS MODULE                                     │
└──────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   orders    │
    │             │
    │  id (PK)    │
    │  user_id    │
    │  ...        │
    └──────┬──────┘
           │
    ┌──────┼──────┬──────┐
    │ 1    │ 1    │ 1    │ 1
    ▼ N    ▼ N    ▼ N    ▼ N
┌───────┐ ┌───────┐ ┌──────────┐ ┌───────────┐
│order_ │ │payments│ │shipments │ │coupon_    │
│items  │ │        │ │          │ │usages     │
└───────┘ └────────┘ └────┬─────┘ └───────────┘
                          │ 1
                          ▼ N
                    ┌──────────────┐
                    │shipment_     │
                    │events        │
                    └──────────────┘
```

---

## 6. Convenciones de Nomenclatura

### Tablas
- Nombres en **plural** y **snake_case**: `products`, `order_items`
- Tablas junction: `{tabla1}_{tabla2}` ordenadas alfabéticamente: `variant_attribute_values`

### Columnas
- Nombres en **snake_case**: `created_at`, `user_id`
- Foreign keys: `{tabla_singular}_id`: `product_id`, `user_id`
- Booleanos: prefijo `is_` o `has_`: `is_active`, `has_variants`
- Timestamps: sufijo `_at`: `created_at`, `shipped_at`

### Índices
- Formato: `{tabla}_{columnas}_idx` o `{tabla}_{columnas}_key` (para unique)
- Ejemplo: `orders_user_id_idx`, `users_email_key`

### Enums
- Nombres en **PascalCase**: `OrderStatus`, `PaymentMethod`
- Valores en **SCREAMING_SNAKE_CASE**: `PENDING`, `CASH_ON_DELIVERY`

---

## 7. Índices y Optimización

### Índices Principales

| Tabla | Índice | Tipo | Columnas | Propósito |
|-------|--------|------|----------|-----------|
| `users` | `users_email_key` | UNIQUE | email | Login rápido |
| `products` | `products_slug_key` | UNIQUE | slug | URL lookup |
| `orders` | `orders_user_id_idx` | INDEX | user_id | Órdenes por usuario |
| `orders` | `orders_order_number_idx` | INDEX | order_number | Búsqueda por número |
| `reviews` | `reviews_product_id_created_at_idx` | INDEX | product_id, created_at | Reviews de producto |
| `inventory_movements` | `..._product_id_created_at_idx` | INDEX | product_id, created_at | Historial de inventario |

### Recomendaciones de Índices Adicionales

```sql
-- Para búsquedas por estado de orden
CREATE INDEX idx_orders_status ON orders(status) WHERE status NOT IN ('DELIVERED', 'CANCELLED');

-- Para productos activos por categoría
CREATE INDEX idx_products_category_active ON products(category_id, created_at) WHERE is_active = true;

-- Para pagos pendientes
CREATE INDEX idx_payments_pending ON payments(created_at) WHERE status = 'PENDING';
```

---

## 8. Migraciones

### Comandos Prisma Migrate

```bash
# Crear nueva migración
npx prisma migrate dev --name descripcion_del_cambio

# Aplicar migraciones en producción
npx prisma migrate deploy

# Ver estado de migraciones
npx prisma migrate status

# Resetear base de datos (SOLO DESARROLLO)
npx prisma migrate reset

# Generar cliente Prisma
npx prisma generate
```

### Estructura de Migraciones

```
prisma/
├── schema.prisma
└── migrations/
    ├── migration_lock.toml
    ├── 20260130011006_init/
    │   └── migration.sql
    └── 20260130042301_complete_ecommerce_schema/
        └── migration.sql
```

### Buenas Prácticas

1. **Nombres descriptivos**: `add_user_phone_field`, `create_reviews_table`
2. **Una migración por cambio lógico**: No mezclar cambios no relacionados
3. **Probar en desarrollo primero**: Nunca migrar directamente en producción
4. **Backup antes de migrar**: Especialmente en producción
5. **Revisar SQL generado**: `prisma migrate dev --create-only`

---

## 9. Mantenimiento

### Tareas Periódicas

#### Diarias
```sql
-- Verificar carritos abandonados (más de 7 días)
SELECT COUNT(*) FROM carts 
WHERE updated_at < NOW() - INTERVAL '7 days';

-- Verificar pagos pendientes antiguos
SELECT COUNT(*) FROM payments 
WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '1 day';
```

#### Semanales
```sql
-- Limpiar carritos abandonados
DELETE FROM carts WHERE updated_at < NOW() - INTERVAL '30 days';

-- Actualizar estadísticas
ANALYZE products;
ANALYZE orders;
ANALYZE users;
```

#### Mensuales
```sql
-- Verificar tamaño de tablas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verificar índices no usados
SELECT 
  schemaname || '.' || relname AS table,
  indexrelname AS index,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
  idx_scan as index_scans
FROM pg_stat_user_indexes ui
JOIN pg_index i ON ui.indexrelid = i.indexrelid
WHERE NOT indisunique AND idx_scan < 50
ORDER BY pg_relation_size(i.indexrelid) DESC;
```

### VACUUM y Mantenimiento

```sql
-- VACUUM manual (generalmente automático)
VACUUM ANALYZE products;
VACUUM ANALYZE orders;

-- Reindexar tabla específica
REINDEX TABLE products;

-- Ver bloat de tablas
SELECT 
  tablename,
  n_live_tup,
  n_dead_tup,
  round(n_dead_tup * 100.0 / nullif(n_live_tup + n_dead_tup, 0), 2) AS dead_percentage
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

---

## 10. Respaldos y Recuperación

### Backup Manual

```bash
# Backup completo
pg_dump -Fc -v -h localhost -U postgres commerce_db > backup_$(date +%Y%m%d_%H%M%S).dump

# Backup solo esquema
pg_dump -s -h localhost -U postgres commerce_db > schema_backup.sql

# Backup solo datos
pg_dump -a -h localhost -U postgres commerce_db > data_backup.sql

# Backup tabla específica
pg_dump -t orders -h localhost -U postgres commerce_db > orders_backup.sql
```

### Restauración

```bash
# Restaurar backup completo
pg_restore -v -h localhost -U postgres -d commerce_db backup.dump

# Restaurar SQL
psql -h localhost -U postgres -d commerce_db < backup.sql

# Crear base nueva y restaurar
createdb -h localhost -U postgres commerce_db_restored
pg_restore -v -h localhost -U postgres -d commerce_db_restored backup.dump
```

### Estrategia de Backups Recomendada

| Tipo | Frecuencia | Retención | Almacenamiento |
|------|------------|-----------|----------------|
| Full | Diario | 7 días | S3/Cloud Storage |
| Full | Semanal | 4 semanas | S3/Cloud Storage |
| Full | Mensual | 12 meses | S3 Glacier |
| WAL/PITR | Continuo | 7 días | S3 |

---

## 11. Consultas Útiles

### Dashboard de Ventas

```sql
-- Ventas del día
SELECT 
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value
FROM orders 
WHERE created_at >= CURRENT_DATE
AND status NOT IN ('CANCELLED', 'REFUNDED');

-- Top 10 productos más vendidos
SELECT 
  p.name,
  SUM(oi.quantity) as units_sold,
  SUM(oi.subtotal) as revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
AND o.status NOT IN ('CANCELLED', 'REFUNDED')
GROUP BY p.id, p.name
ORDER BY units_sold DESC
LIMIT 10;

-- Ingresos por categoría
SELECT 
  c.name as category,
  COUNT(DISTINCT o.id) as orders,
  SUM(oi.subtotal) as revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
GROUP BY c.id, c.name
ORDER BY revenue DESC;
```

### Gestión de Inventario

```sql
-- Productos con stock bajo
SELECT 
  p.name,
  p.stock,
  sa.low_stock_threshold,
  CASE 
    WHEN p.stock <= sa.critical_stock_threshold THEN 'CRÍTICO'
    WHEN p.stock <= sa.low_stock_threshold THEN 'BAJO'
    ELSE 'OK'
  END as status
FROM products p
LEFT JOIN stock_alerts sa ON p.id = sa.product_id
WHERE p.stock <= COALESCE(sa.low_stock_threshold, 10)
AND p.is_active = true
ORDER BY p.stock ASC;

-- Historial de movimientos de un producto
SELECT 
  im.type,
  im.quantity,
  im.previous_stock,
  im.new_stock,
  im.notes,
  im.created_at
FROM inventory_movements im
WHERE im.product_id = 'uuid-del-producto'
ORDER BY im.created_at DESC
LIMIT 50;
```

### Análisis de Clientes

```sql
-- Clientes más valiosos (LTV)
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  COUNT(o.id) as total_orders,
  SUM(o.total) as lifetime_value,
  AVG(o.total) as avg_order_value,
  MAX(o.created_at) as last_order
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
GROUP BY u.id, u.email, u.first_name, u.last_name
ORDER BY lifetime_value DESC
LIMIT 20;

-- Tasa de conversión de carrito
SELECT 
  COUNT(DISTINCT c.id) as total_carts,
  COUNT(DISTINCT o.id) as converted_orders,
  ROUND(COUNT(DISTINCT o.id) * 100.0 / NULLIF(COUNT(DISTINCT c.id), 0), 2) as conversion_rate
FROM carts c
LEFT JOIN orders o ON c.user_id = o.user_id 
  AND o.created_at >= c.created_at
WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days';
```

### Reportes de Cupones

```sql
-- Rendimiento de cupones
SELECT 
  c.code,
  c.discount_type,
  c.discount_value,
  c.usage_count,
  c.usage_limit,
  SUM(cu.discount_applied) as total_discounted,
  COUNT(DISTINCT cu.user_id) as unique_users
FROM coupons c
LEFT JOIN coupon_usages cu ON c.id = cu.coupon_id
GROUP BY c.id
ORDER BY total_discounted DESC;
```

---

## 12. Troubleshooting

### Problemas Comunes

#### Error: "deadlock detected"
```sql
-- Ver locks activos
SELECT 
  pg_stat_activity.pid,
  pg_stat_activity.query,
  pg_locks.mode,
  pg_locks.granted
FROM pg_locks
JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
WHERE pg_stat_activity.query != '<IDLE>';

-- Terminar proceso específico
SELECT pg_terminate_backend(pid);
```

#### Error: "too many connections"
```sql
-- Ver conexiones actuales
SELECT count(*) FROM pg_stat_activity;

-- Ver conexiones por usuario
SELECT usename, count(*) 
FROM pg_stat_activity 
GROUP BY usename;

-- Terminar conexiones idle
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND query_start < now() - interval '10 minutes';
```

#### Consultas Lentas
```sql
-- Habilitar logging de queries lentas
ALTER SYSTEM SET log_min_duration_statement = 1000; -- ms
SELECT pg_reload_conf();

-- Ver queries activas más lentas
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
AND state != 'idle'
ORDER BY duration DESC;

-- EXPLAIN ANALYZE para optimizar
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM products WHERE category_id = 'uuid' AND is_active = true;
```

#### Espacio en Disco
```sql
-- Tamaño total de la base de datos
SELECT pg_size_pretty(pg_database_size('commerce_db'));

-- Tablas más grandes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size('public.'||tablename)) as table_size,
  pg_size_pretty(pg_indexes_size('public.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC
LIMIT 10;
```

### Logs Importantes

```bash
# Ver logs de PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log

# Filtrar errores
grep -i error /var/log/postgresql/postgresql-15-main.log

# Ver queries lentas
grep -i "duration:" /var/log/postgresql/postgresql-15-main.log | tail -20
```

---

## Apéndice: Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/commerce_db"

# Prisma
DIRECT_URL="postgresql://user:password@localhost:5432/commerce_db"

# Pool de conexiones (si usa pgbouncer)
DATABASE_POOL_URL="postgresql://user:password@localhost:6432/commerce_db"
```

---

## Changelog

| Versión | Fecha | Descripción |
|---------|-------|-------------|
| 1.0.0 | 2026-01-30 | Documentación inicial completa |

---

*Documento generado para Commerce API v0.0.1*
*Última actualización: Enero 30, 2026*
