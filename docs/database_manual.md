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
| Base de Datos | PostgreSQL 15 |
| ORM | Prisma v7 |
| Migraciones | Prisma Migrate |
| Cliente | @prisma/client + @prisma/adapter-pg |

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
Estados de un pago.

| Valor | Descripción |
|-------|-------------|
| `PENDING` | Pendiente de procesamiento |
| `PROCESSING` | En proceso |
| `COMPLETED` | Completado exitosamente |
| `FAILED` | Fallido |
| `REFUNDED` | Reembolsado |
| `CANCELLED` | Cancelado |

### PaymentMethod
Métodos de pago disponibles.

| Valor | Descripción |
|-------|-------------|
| `STRIPE` | Tarjeta de crédito/débito vía Stripe |
| `MERCADOPAGO` | MercadoPago |
| `CASH_ON_DELIVERY` | Pago contra entrega |

### ShippingCarrier
Transportistas disponibles.

| Valor | Descripción |
|-------|-------------|
| `OLVA` | Olva Courier |
| `SHALOM` | Shalom Empresarial |
| `CRUZ_DEL_SUR` | Cruz del Sur |
| `SERVIENTREGA` | Servientrega |
| `PICKUP` | Recojo en tienda |

### ShippingStatus
Estados del envío.

| Valor | Descripción |
|-------|-------------|
| `PENDING` | Pendiente de envío |
| `PROCESSING` | En preparación |
| `SHIPPED` | Enviado |
| `IN_TRANSIT` | En tránsito |
| `OUT_FOR_DELIVERY` | En reparto |
| `DELIVERED` | Entregado |
| `FAILED` | Fallido |
| `RETURNED` | Devuelto |
| `CANCELLED` | Cancelado |

### MovementType
Tipos de movimiento de inventario.

| Valor | Dirección | Descripción |
|-------|-----------|-------------|
| `PURCHASE` | Entrada | Compra de mercadería |
| `RETURN` | Entrada | Devolución de cliente |
| `ADJUSTMENT_IN` | Entrada | Ajuste positivo |
| `TRANSFER_IN` | Entrada | Transferencia entrada |
| `SALE` | Salida | Venta |
| `RESERVATION` | Salida | Reserva de stock |
| `ADJUSTMENT_OUT` | Salida | Ajuste negativo |
| `DAMAGED` | Salida | Producto dañado |
| `EXPIRED` | Salida | Producto vencido |
| `TRANSFER_OUT` | Salida | Transferencia salida |
| `RELEASE` | Entrada | Liberación de reserva |

### DiscountType
Tipos de descuento para cupones.

| Valor | Descripción |
|-------|-------------|
| `PERCENTAGE` | Porcentaje del total |
| `FIXED_AMOUNT` | Monto fijo |
| `FREE_SHIPPING` | Envío gratis |

---

## 4. Módulos y Tablas

### 4.1 Auth & Users

#### Tabla: `users`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `email` | VARCHAR | Email (único) |
| `password` | VARCHAR | Hash de contraseña (bcrypt) |
| `first_name` | VARCHAR | Nombre |
| `last_name` | VARCHAR | Apellido |
| `phone` | VARCHAR | Teléfono |
| `role` | Role | Rol del usuario |
| `is_active` | BOOLEAN | Estado activo |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

#### Tabla: `addresses`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | FK a users |
| `recipient_name` | VARCHAR | Nombre del destinatario |
| `phone` | VARCHAR | Teléfono |
| `street` | VARCHAR | Calle |
| `number` | VARCHAR | Número |
| `apartment` | VARCHAR | Departamento/Oficina |
| `district` | VARCHAR | Distrito |
| `city` | VARCHAR | Ciudad |
| `department` | VARCHAR | Departamento/Estado |
| `postal_code` | VARCHAR | Código postal |
| `reference` | VARCHAR | Referencia |
| `is_default` | BOOLEAN | Dirección por defecto |

### 4.2 Products

#### Tabla: `products`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `name` | VARCHAR | Nombre del producto |
| `slug` | VARCHAR | Slug URL (único) |
| `description` | TEXT | Descripción completa |
| `short_description` | VARCHAR | Descripción corta |
| `price` | DECIMAL(10,2) | Precio base |
| `compare_at_price` | DECIMAL(10,2) | Precio anterior (tachado) |
| `stock` | INT | Stock disponible |
| `is_active` | BOOLEAN | Producto activo |
| `has_variants` | BOOLEAN | Tiene variantes |
| `category_id` | UUID | FK a categories |

#### Tabla: `product_variants`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `product_id` | UUID | FK a products |
| `sku` | VARCHAR | SKU único |
| `price` | DECIMAL(10,2) | Precio de la variante |
| `compare_at_price` | DECIMAL(10,2) | Precio anterior |
| `stock` | INT | Stock de la variante |
| `is_active` | BOOLEAN | Variante activa |

#### Tabla: `product_attributes`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `name` | VARCHAR | Nombre del atributo (ej: "Color", "Talla") |

#### Tabla: `product_attribute_values`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `attribute_id` | UUID | FK a product_attributes |
| `value` | VARCHAR | Valor (ej: "Rojo", "XL") |

#### Tabla: `variant_attribute_values`

Tabla pivote para variantes y sus valores de atributos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `variant_id` | UUID | FK a product_variants |
| `attribute_value_id` | UUID | FK a product_attribute_values |

**Clave primaria compuesta**: (`variant_id`, `attribute_value_id`)

### 4.3 Categories

#### Tabla: `categories`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `name` | VARCHAR | Nombre |
| `slug` | VARCHAR | Slug URL (único) |
| `description` | TEXT | Descripción |
| `image` | VARCHAR | URL de imagen |
| `parent_id` | UUID | FK a categories (padre) |
| `is_active` | BOOLEAN | Categoría activa |
| `display_order` | INT | Orden de visualización |

---

## 5. Diagrama de Relaciones (ERD)

```
┌───────────┐       ┌───────────┐       ┌───────────┐
│   users   │──────<│ addresses │       │ categories│
└─────┬─────┘       └───────────┘       └─────┬─────┘
      │                                       │
      │ 1:N                              1:N  │
      │                                       │
      ▼                                       ▼
┌───────────┐       ┌───────────┐       ┌───────────┐
│   carts   │──────<│cart_items │──────>│ products  │
└───────────┘       └───────────┘       └─────┬─────┘
                                              │
                                         1:N  │
                                              ▼
                                        ┌───────────┐
                                        │ variants  │
                                        └───────────┘

┌───────────┐       ┌───────────┐       ┌───────────┐
│  orders   │──────<│order_items│       │ shipments │
└─────┬─────┘       └───────────┘       └─────┬─────┘
      │                                       │
      │ 1:N                              1:N  │
      │                                       │
      ▼                                       ▼
┌───────────┐                           ┌───────────┐
│ payments  │                           │  events   │
└───────────┘                           └───────────┘
```

---

## 6. Convenciones de Nomenclatura

### Tablas
- Nombres en **snake_case** y **plural**: `users`, `products`, `order_items`
- Tablas pivote: `variant_attribute_values`

### Columnas
- Nombres en **snake_case**: `created_at`, `user_id`, `is_active`
- Claves foráneas: `{tabla_singular}_id` → `user_id`, `product_id`
- Booleanos: prefijo `is_` → `is_active`, `is_default`
- Timestamps: `created_at`, `updated_at`, `deleted_at`

### Índices
- Primary: `{tabla}_pkey`
- Unique: `{tabla}_{campo}_key`
- Index: `{tabla}_{campo}_idx`

---

## 7. Índices y Optimización

### Índices Principales

```sql
-- Usuarios
CREATE INDEX users_email_idx ON users(email);

-- Productos
CREATE INDEX products_slug_idx ON products(slug);
CREATE INDEX products_category_id_idx ON products(category_id);
CREATE INDEX products_is_active_idx ON products(is_active);

-- Órdenes
CREATE INDEX orders_user_id_idx ON orders(user_id);
CREATE INDEX orders_order_number_idx ON orders(order_number);
CREATE INDEX orders_status_idx ON orders(status);

-- Inventario
CREATE INDEX inventory_movements_product_id_created_at_idx 
  ON inventory_movements(product_id, created_at);
CREATE INDEX inventory_movements_variant_id_created_at_idx 
  ON inventory_movements(variant_id, created_at);
```

---

## 8. Migraciones

### Comandos de Prisma

```bash
# Crear nueva migración
pnpm prisma migrate dev --name nombre_descriptivo

# Aplicar migraciones en producción
pnpm prisma migrate deploy

# Ver estado de migraciones
pnpm prisma migrate status

# Resetear base de datos (¡cuidado!)
pnpm prisma migrate reset

# Generar cliente después de cambios
pnpm prisma generate
```

### Estructura de Migraciones

```
prisma/
├── migrations/
│   ├── 20260130011006_init/
│   │   └── migration.sql
│   ├── 20260130042301_complete_ecommerce_schema/
│   │   └── migration.sql
│   └── migration_lock.toml
└── schema.prisma
```

---

## 9. Mantenimiento

### Limpieza de Carritos Abandonados

```sql
-- Eliminar carritos sin actividad por más de 30 días
DELETE FROM cart_items 
WHERE cart_id IN (
  SELECT id FROM carts 
  WHERE updated_at < NOW() - INTERVAL '30 days'
);

DELETE FROM carts 
WHERE updated_at < NOW() - INTERVAL '30 days';
```

### Optimización de Tablas

```sql
-- Analizar estadísticas
ANALYZE products;
ANALYZE orders;

-- Vacuum para recuperar espacio
VACUUM ANALYZE;
```

---

## 10. Respaldos y Recuperación

### Backup Manual

```bash
# Backup completo
pg_dump -h localhost -U postgres -d commerce_db > backup_$(date +%Y%m%d).sql

# Backup solo datos
pg_dump -h localhost -U postgres -d commerce_db --data-only > data_backup.sql

# Backup comprimido
pg_dump -h localhost -U postgres -d commerce_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restaurar

```bash
# Restaurar desde backup
psql -h localhost -U postgres -d commerce_db < backup.sql

# Restaurar desde comprimido
gunzip -c backup.sql.gz | psql -h localhost -U postgres -d commerce_db
```

---

## 11. Consultas Útiles

### Productos más vendidos

```sql
SELECT 
  p.id,
  p.name,
  SUM(oi.quantity) as total_sold,
  SUM(oi.subtotal) as total_revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'DELIVERED'
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 10;
```

### Stock bajo

```sql
SELECT 
  p.name,
  p.stock,
  sa.low_stock_threshold
FROM products p
LEFT JOIN stock_alerts sa ON p.id = sa.product_id
WHERE p.stock <= COALESCE(sa.low_stock_threshold, 10)
  AND p.is_active = true;
```

### Ventas por mes

```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_orders,
  SUM(total) as total_revenue
FROM orders
WHERE status NOT IN ('CANCELLED', 'REFUNDED')
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

---

## 12. Troubleshooting

### Error: Conexión rechazada

```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Reiniciar contenedor
docker-compose restart db
```

### Error: Migraciones pendientes

```bash
# Ver estado
pnpm prisma migrate status

# Aplicar migraciones
pnpm prisma migrate deploy
```

### Error: Cliente Prisma desactualizado

```bash
# Regenerar cliente
pnpm prisma generate
```

### Limpiar y reiniciar (desarrollo)

```bash
# Reset completo (¡elimina todos los datos!)
pnpm prisma migrate reset

# O manualmente:
docker-compose down -v
docker-compose up -d
pnpm prisma migrate deploy
pnpm prisma db seed
```

---

## Información de Versiones

| Componente | Versión |
|------------|---------|
| PostgreSQL | 15-alpine |
| Prisma | 7.3.0 |
| NestJS | 11.x |
| Node.js | 18+ |
