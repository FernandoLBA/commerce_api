# Commerce API 🛒

API RESTful completa para e-commerce construida con NestJS, TypeORM y Prisma.

## 🚀 Características

- **Autenticación JWT** - Registro, login y protección de rutas
- **Gestión de Productos** - CRUD completo con variantes, atributos e imágenes
- **Categorías** - Sistema jerárquico de categorías
- **Carrito de Compras** - Manejo de sesión y usuario autenticado
- **Órdenes** - Flujo completo de pedidos con estados
- **Pagos** - Integración con Stripe y MercadoPago
- **Envíos** - Tracking y múltiples transportistas
- **Inventario** - Control de stock con alertas
- **Reseñas** - Sistema de calificaciones y comentarios
- **Cupones** - Descuentos por porcentaje, monto fijo y envío gratis
- **Wishlist** - Lista de deseos para usuarios
- **Notificaciones** - Emails transaccionales

## 📋 Requisitos

- Node.js v18+
- pnpm
- PostgreSQL 14+
- Docker (opcional)

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone https://github.com/FernandoLBA/commerce_api.git
cd commerce_api

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Generar cliente Prisma
pnpm prisma generate

# Ejecutar migraciones
pnpm prisma migrate deploy

# Poblar base de datos (opcional)
pnpm prisma db seed

# Iniciar en modo desarrollo
pnpm start:dev
```

## ⚙️ Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://postgres:password@localhost:5432/commerce_db?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=commerce_db

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d

# Aplicación
PORT=3000

# Pagos (opcional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MERCADOPAGO_ACCESS_TOKEN=TEST-...

# Cloudinary (opcional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🏃 Ejecutar

```bash
# Desarrollo (watch mode)
pnpm start:dev

# Producción
pnpm build
pnpm start:prod

# Tests
pnpm test
pnpm test:e2e
pnpm test:cov
```

## 📚 Endpoints Principales

| Módulo | Endpoint | Descripción |
|--------|----------|-------------|
| Auth | `POST /api/auth/register` | Registrar usuario |
| Auth | `POST /api/auth/login` | Iniciar sesión |
| Products | `GET /api/products` | Listar productos |
| Products | `POST /api/products` | Crear producto (admin) |
| Categories | `GET /api/categories` | Listar categorías |
| Cart | `GET /api/cart` | Ver carrito |
| Cart | `POST /api/cart/items` | Agregar al carrito |
| Orders | `POST /api/orders` | Crear orden |
| Orders | `GET /api/orders` | Mis órdenes |
| Payments | `POST /api/payments/stripe/create-intent/:orderId` | Pago con Stripe |
| Payments | `POST /api/payments/mercadopago/create-preference/:orderId` | Pago con MercadoPago |
| Reviews | `POST /api/reviews` | Crear reseña |
| Coupons | `POST /api/coupons/validate` | Validar cupón |
| Wishlist | `GET /api/wishlist` | Ver wishlist |
| Inventory | `GET /api/inventory/low-stock` | Productos con bajo stock |
| Shipping | `GET /api/shipping/calculate` | Calcular envío |

## 👤 Usuarios de Prueba

Después de ejecutar el seed:

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@tienda.pe | password123 | Admin |
| juan.perez@gmail.com | password123 | User |
| maria.garcia@gmail.com | password123 | User |
| carlos.rodriguez@gmail.com | password123 | User |

## 🎟️ Cupones de Prueba

- `BIENVENIDO10` - 10% de descuento
- `VERANO2025` - 15% de descuento  
- `ENVIOGRATIS` - Envío gratis
- `TECH20` - 20% en tecnología

## 🗂️ Estructura del Proyecto

```
src/
├── auth/           # Autenticación y JWT
├── cart/           # Carrito de compras
├── categories/     # Categorías de productos
├── common/         # Utilidades compartidas
├── coupons/        # Sistema de cupones
├── generated/      # Cliente Prisma generado
├── inventory/      # Control de inventario
├── notifications/  # Emails y notificaciones
├── orders/         # Órdenes y pagos
├── payments/       # Stripe y MercadoPago
├── products/       # Productos, variantes, imágenes
├── reviews/        # Reseñas y calificaciones
├── shipping/       # Envíos y tracking
├── users/          # Gestión de usuarios
├── wishlist/       # Lista de deseos
├── app.module.ts
└── main.ts
```

## 📖 Documentación

Consulta el [Manual de Desarrollo](docs/manual.md) para información detallada sobre:
- Arquitectura del proyecto
- Flujo de trabajo con Git
- Creación de módulos
- Manejo de errores
- Autenticación y autorización
- Testing

## 🛡️ Licencia

MIT License
