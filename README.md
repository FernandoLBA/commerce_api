# Commerce API 🛒

API RESTful completa para e-commerce construida con NestJS y Prisma.

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

## 🛡️ Seguridad

Esta API implementa múltiples capas de seguridad:

| Característica | Descripción |
|----------------|-------------|
| **Helmet** | Protección de headers HTTP contra ataques XSS, clickjacking, etc. |
| **Rate Limiting** | Prevención de ataques de fuerza bruta y DDoS |
| **CORS** | Control de orígenes permitidos |
| **Validation Pipe** | Sanitización y validación de todas las entradas |
| **JWT** | Tokens seguros con expiración configurable |
| **Password Hashing** | Bcrypt con salt rounds configurables |

### Rate Limiting por Endpoint

| Endpoint | Límite | Período |
|----------|--------|---------|
| Global | 100 requests | 1 minuto |
| `/auth/login` | 5 requests | 1 minuto |
| `/auth/register` | 5 requests | 1 minuto |

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

## 🐳 Docker

```bash
# Levantar servicios (PostgreSQL)
make up

# Ver logs
make logs

# Detener servicios
make down

# Reiniciar servicios
make restart
```

## ⚙️ Variables de Entorno

Ver archivo `.env.example` para la lista completa. Variables principales:

```env
# Base de datos
DATABASE_URL="postgresql://postgres:password@localhost:5432/commerce_db?schema=public"

# JWT (CAMBIAR en producción)
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=1d

# Entorno
NODE_ENV=development
PORT=3000

# Seguridad - CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:4200

# Seguridad - Rate Limiting
THROTTLE_LIMIT=100
THROTTLE_AUTH_LIMIT=5
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
| Users | `GET /api/users/profile` | Ver perfil |
| Users | `PATCH /api/users/:userId/role` | Cambiar rol (admin) |
| Users | `GET /api/users/admin/all` | Listar usuarios (admin) |
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
| **Security** | `GET /api/security/report` | Reporte de seguridad (admin) |
| **Security** | `POST /api/security/test/sql-injection` | Test de SQL Injection |
| **Security** | `POST /api/security/test/xss` | Test de XSS |
| **Security** | `GET /api/security/test/rate-limit` | Test de Rate Limiting |

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
├── prisma/         # PrismaModule y PrismaService
├── products/       # Productos, variantes, imágenes
├── reviews/        # Reseñas y calificaciones
├── security/       # 🔒 Pruebas de seguridad
├── shipping/       # Envíos y tracking
├── users/          # Gestión de usuarios
├── wishlist/       # Lista de deseos
├── app.module.ts
└── main.ts
prisma/
├── schema.prisma   # Schema de base de datos
├── migrations/     # Historial de migraciones
└── seed.ts         # Datos de prueba
```

## 🔧 Tecnologías

| Componente | Tecnología |
|------------|------------|
| Framework | NestJS v11 |
| ORM | Prisma v7 |
| Base de Datos | PostgreSQL 15 |
| Autenticación | Passport + JWT |
| Validación | class-validator |
| Documentación | Swagger (OpenAPI) |
| Testing | Jest |
| Containerización | Docker |

## 📖 Documentación

Consulta el [Manual de Desarrollo](docs/manual.md) para información detallada sobre:
- Arquitectura del proyecto
- Flujo de trabajo con Git
- Creación de módulos
- Manejo de errores
- Autenticación y autorización
- **Seguridad (Helmet, CORS, Rate Limiting)**
- **Módulo de Pruebas de Seguridad**
- Testing

## 🛡️ Licencia

MIT License
