# Commerce API 🛒

A complete RESTful API for e-commerce built with NestJS and Prisma.

## 🚀 Features

- **JWT Authentication** - Registration, login, and route protection
- **Product Management** - Full CRUD with variants, attributes, and images
- **Categories** - Hierarchical category system
- **Shopping Cart** - Session and authenticated user cart handling
- **Orders** - Complete order flow with statuses
- **Payments** - Stripe and MercadoPago integration
- **Shipping** - Tracking and multiple carriers
- **Inventory** - Stock control with alerts
- **Reviews** - Rating and comment system
- **Coupons** - Percentage, fixed amount, and free shipping discounts
- **Wishlist** - User wishlists
- **Notifications** - Transactional emails

## 🛡️ Security

This API implements multiple layers of security:

| Feature | Description |
|----------------|-------------|
| **Helmet** | HTTP header protection against XSS, clickjacking, etc. |
| **Rate Limiting** | Prevention of brute-force and DDoS attacks |
| **CORS** | Allowed origin control |
| **Validation Pipe** | Sanitization and validation of all inputs |
| **JWT** | Secure tokens with configurable expiration |
| **Password Hashing** | Bcrypt with configurable salt rounds |

### Rate Limiting per Endpoint

| Endpoint | Limit | Period |
|----------|--------|---------|
| Global | 100 requests | 1 minute |
| `/auth/login` | 5 requests | 1 minute |
| `/auth/register` | 5 requests | 1 minute |

## 📋 Requirements

- Node.js v18+
- pnpm
- PostgreSQL 14+
- Docker (optional)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/FernandoLBA/commerce_api.git
cd commerce_api

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Seed database (optional)
pnpm prisma db seed

# Start in development mode
pnpm start:dev
```

## 🐳 Docker

```bash
# Start services (PostgreSQL)
make up

# View logs
make logs

# Stop services
make down

# Restart services
make restart
```

## ⚙️ Environment Variables

See the `.env.example` file for the full list. Main variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/commerce_db?schema=public"

# JWT (CHANGE in production)
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=1d

# Environment
NODE_ENV=development
PORT=3000

# Security - CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:4200

# Security - Rate Limiting
THROTTLE_LIMIT=100
THROTTLE_AUTH_LIMIT=5
```

## 🏃 Running the app

```bash
# Development (watch mode)
pnpm start:dev

# Production
pnpm build
pnpm start:prod

# Tests
pnpm test
pnpm test:e2e
pnpm test:cov
```

## 📚 Main Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `POST /api/auth/register` | Register user |
| Auth | `POST /api/auth/login` | Log in |
| Users | `GET /api/users/profile` | View profile |
| Users | `PATCH /api/users/:userId/role` | Change role (admin) |
| Users | `GET /api/users/admin/all` | List users (admin) |
| Products | `GET /api/products` | List products |
| Products | `POST /api/products` | Create product (admin) |
| Categories | `GET /api/categories` | List categories |
| Cart | `GET /api/cart` | View cart |
| Cart | `POST /api/cart/items` | Add to cart |
| Orders | `POST /api/orders` | Create order |
| Orders | `GET /api/orders` | My orders |
| Payments | `POST /api/payments/stripe/create-intent/:orderId` | Pay with Stripe |
| Payments | `POST /api/payments/mercadopago/create-preference/:orderId` | Pay with MercadoPago |
| Reviews | `POST /api/reviews` | Create review |
| Coupons | `POST /api/coupons/validate` | Validate coupon |
| Wishlist | `GET /api/wishlist` | View wishlist |
| Inventory | `GET /api/inventory/low-stock` | Low-stock products |
| Shipping | `GET /api/shipping/calculate` | Calculate shipping |
| **Security** | `GET /api/security/report` | Security report (admin) |
| **Security** | `POST /api/security/test/sql-injection` | SQL Injection test |
| **Security** | `POST /api/security/test/xss` | XSS test |
| **Security** | `GET /api/security/test/rate-limit` | Rate Limiting test |

## 👤 Test Users

After running the seed:

| Email | Password | Role |
|-------|------------|-----|
| admin@tienda.pe | password123 | Admin |
| juan.perez@gmail.com | password123 | User |
| maria.garcia@gmail.com | password123 | User |
| carlos.rodriguez@gmail.com | password123 | User |

## 🎟️ Test Coupons

- `BIENVENIDO10` - 10% discount
- `VERANO2025` - 15% discount
- `ENVIOGRATIS` - Free shipping
- `TECH20` - 20% off electronics

## 🗂️ Project Structure

```
src/
├── auth/           # Authentication and JWT
├── cart/           # Shopping cart
├── categories/     # Product categories
├── common/         # Shared utilities
├── coupons/        # Coupon system
├── generated/      # Generated Prisma client
├── inventory/      # Inventory control
├── notifications/  # Emails and notifications
├── orders/         # Orders and payments
├── payments/       # Stripe and MercadoPago
├── prisma/         # PrismaModule and PrismaService
├── products/       # Products, variants, images
├── reviews/        # Reviews and ratings
├── security/       # 🔒 Security tests
├── shipping/       # Shipping and tracking
├── users/          # User management
├── wishlist/       # Wishlist
├── app.module.ts
└── main.ts
prisma/
├── schema.prisma   # Database schema
├── migrations/     # Migration history
└── seed.ts         # Seed data
```

## 🔧 Technologies

| Component | Technology |
|------------|------------|
| Framework | NestJS v11 |
| ORM | Prisma v7 |
| Database | PostgreSQL 15 |
| Authentication | Passport + JWT |
| Validation | class-validator |
| Documentation | Swagger (OpenAPI) |
| Testing | Jest |
| Containerization | Docker |

## 📖 Documentation

See the [Development Manual](docs/manual.md) for detailed information about:
- Project architecture
- Git workflow
- Creating modules
- Error handling
- Authentication and authorization
- **Security (Helmet, CORS, Rate Limiting)**
- **Security Testing Module**
- Testing

## 🛡️ License

MIT License
