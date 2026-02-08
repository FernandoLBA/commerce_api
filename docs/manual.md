# Manual de Desarrollo - Commerce API

Este manual proporciona instrucciones prácticas para trabajar en el proyecto siguiendo los lineamientos establecidos.

## Tabla de Contenidos

1. [Configuración Inicial](#1-configuración-inicial)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Flujo de Trabajo](#3-flujo-de-trabajo)
4. [Creación de Módulos](#4-creación-de-módulos)
5. [Manejo de Errores](#5-manejo-de-errores)
6. [Validación de Datos](#6-validación-de-datos)
7. [Respuestas de la API](#7-respuestas-de-la-api)
8. [Base de Datos con Prisma](#8-base-de-datos-con-prisma)
9. [Autenticación](#9-autenticación)
10. [Roles y Autorización](#10-roles-y-autorización)
11. [Seguridad](#11-seguridad)
12. [Módulo de Usuarios](#12-módulo-de-usuarios)
13. [Módulo de Productos](#13-módulo-de-productos)
14. [Módulo de Categorías](#14-módulo-de-categorías)
15. [Variantes de Productos](#15-variantes-de-productos)
16. [Imágenes de Productos](#16-imágenes-de-productos)
17. [Carrito de Compras](#17-carrito-de-compras)
18. [Órdenes](#18-órdenes)
19. [Cupones](#19-cupones)
20. [Pagos](#20-pagos)
21. [Envíos](#21-envíos)
22. [Inventario](#22-inventario)
23. [Reviews](#23-reviews)
24. [Wishlist](#24-wishlist)
25. [Notificaciones](#25-notificaciones)
26. [Cloudinary (Imágenes)](#26-cloudinary-imágenes)
27. [Módulo de Pruebas de Seguridad](#27-módulo-de-pruebas-de-seguridad)
28. [Testing](#28-testing)
29. [Comandos Útiles](#29-comandos-útiles)
30. [Lineamientos de Tipado TypeScript](#lineamientos-de-tipado-typescript)

---

## 1. Configuración Inicial

### Requisitos Previos

- Node.js v18+
- pnpm
- PostgreSQL 14+
- Docker (opcional)

### Instalación

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

# Poblar base de datos con datos de prueba
pnpm prisma db seed

# Iniciar en modo desarrollo
pnpm start:dev
```

### Datos de Prueba (Seed)

El seed crea:
- **4 usuarios** (1 admin + 3 usuarios)
- **8 categorías** jerárquicas
- **5 productos** con variantes
- **4 cupones** de descuento
- **Órdenes, pagos y envíos** de ejemplo

**Usuarios de prueba:**
| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@tienda.pe | password123 | Admin |
| juan.perez@gmail.com | password123 | User |
| maria.garcia@gmail.com | password123 | User |
| carlos.rodriguez@gmail.com | password123 | User |

**Cupones de prueba:** `BIENVENIDO10`, `VERANO2025`, `ENVIOGRATIS`, `TECH20`

### Variables de Entorno

```env
# Base de datos (requerido)
DATABASE_URL="postgresql://postgres:password@localhost:5432/commerce_db?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=commerce_db

# JWT (requerido)
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=1d

# Aplicación
PORT=3000

# Pagos - Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pagos - MercadoPago (opcional)
MERCADOPAGO_ACCESS_TOKEN=TEST-...

# Cloudinary - Imágenes (opcional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email SMTP (opcional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM="E-commerce <noreply@example.com>"

# Frontend URL (para enlaces de activación)
FRONTEND_URL=http://localhost:3000
MAIL_FROM="E-commerce <noreply@example.com>"
```

---

## 2. Estructura del Proyecto

```
src/
├── auth/                          # Módulo de autenticación
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── login.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── common/                        # Código compartido
│   ├── constants/
│   ├── decorators/
│   ├── exceptions/
│   ├── filters/
│   ├── interceptors/
│   └── interfaces/
├── generated/                     # Cliente Prisma generado
│   └── prisma/
├── prisma/                        # Prisma ORM
│   ├── schema.prisma
│   └── migrations/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

---

## 3. Flujo de Trabajo

### Branches

```bash
main        # Producción - NUNCA hacer push directo
develop     # Desarrollo - Branch principal de trabajo
feature/*   # Nuevas funcionalidades
bugfix/*    # Corrección de bugs
hotfix/*    # Correcciones urgentes en producción
```

### Convención de Commits

```bash
feat:     # Nueva funcionalidad
fix:      # Corrección de bug
docs:     # Documentación
style:    # Formateo (no afecta lógica)
refactor: # Refactorización
test:     # Tests
chore:    # Tareas de mantenimiento
```

---

## 4. Creación de Módulos

### Paso 1: Generar el Módulo

```bash
nest g module products
nest g controller products
nest g service products
```

### Paso 2: Crear DTOs con Validación

```typescript
// src/products/dto/create-product.dto.ts
import { IsString, IsNumber, IsPositive, IsOptional, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;
}
```

### Paso 3: Crear el Servicio con Prisma

```typescript
// src/products/products.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: createProductDto,
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }
}
```

---

## 5. Manejo de Errores

### Excepciones Disponibles

```typescript
import {
  ApiException,
  UserAlreadyExistsException,
  UserNotFoundException,
  InvalidCredentialsException,
  UnauthorizedException,
  ValidationException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ActivationTokenInvalidException,
  ActivationTokenExpiredException,
  AccountAlreadyActiveException,
} from '../common';
```

### Códigos de Error

| Código   | HTTP Status | Uso                           |
|----------|-------------|-------------------------------|
| AUTH_001 | 409         | Usuario ya registrado         |
| AUTH_002 | 404         | Usuario no encontrado         |
| AUTH_003 | 401         | Credenciales inválidas        |
| AUTH_004 | 401         | Token inválido                |
| AUTH_007 | 400         | Token de activación inválido  |
| AUTH_008 | 400         | Token de activación expirado  |
| AUTH_009 | 409         | Cuenta ya activada            |
| VAL_001  | 400         | Error de validación           |
| GEN_002  | 404         | Recurso no encontrado         |
| GEN_003  | 400         | Solicitud incorrecta          |
| GEN_004  | 403         | Acceso prohibido              |

---

## 6. Validación de Datos

### Decoradores Comunes

```typescript
import {
  IsString, IsNumber, IsEmail, IsOptional, IsUUID, IsEnum,
  IsArray, IsBoolean, IsDate, MinLength, MaxLength, Min, Max,
  IsPositive, ArrayMinSize, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
```

---

## 7. Respuestas de la API

### Formato de Respuesta Exitosa

```json
{
  "statusCode": 200,
  "data": { ... },
  "timestamp": "2026-01-30T10:30:00.000Z",
  "path": "/api/endpoint"
}
```

### Formato de Error

```json
{
  "statusCode": 400,
  "error": {
    "code": "VAL_001",
    "message": "Validation failed",
    "details": [...]
  },
  "timestamp": "2026-01-30T10:30:00.000Z",
  "path": "/api/endpoint"
}
```

---

## 8. Base de Datos con Prisma

### Comandos de Prisma

```bash
pnpm prisma migrate dev --name nombre_migracion  # Crear migración
pnpm prisma migrate deploy                       # Aplicar migraciones
pnpm prisma generate                             # Generar cliente
pnpm prisma studio                               # Abrir Prisma Studio
```

---

## 9. Autenticación

### Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Registrar usuario (envía email de activación) |
| POST | `/auth/login` | ❌ | Iniciar sesión |
| POST | `/auth/activate` | ❌ | Activar cuenta con token |
| POST | `/auth/resend-activation` | ❌ | Reenviar email de activación |
| POST | `/auth/forgot-password` | ❌ | Solicitar restablecimiento de contraseña |
| POST | `/auth/password-reset` | ❌ | Restablecer contraseña con token |
| POST | `/auth/validate` | ❌ | Validar token JWT |

### Flujo de Registro y Activación

1. El usuario se registra con `/auth/register`
2. Se crea la cuenta con `isActive: false`
3. Se envía un email con un enlace de activación (válido por 24 horas)
4. El usuario hace clic en el enlace que llama a `/auth/activate`
5. La cuenta se activa (`isActive: true`, `emailVerified: true`)
6. El usuario puede iniciar sesión con `/auth/login`

### Flujo de Restablecimiento de Contraseña

1. El usuario solicita restablecer con `/auth/forgot-password`
2. Se envía un email con un enlace de restablecimiento (válido por 1 hora)
3. El usuario hace clic en el enlace y envía la nueva contraseña a `/auth/password-reset`
4. La contraseña se actualiza y el usuario puede iniciar sesión

### Registrar Usuario

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",      # Requerido, email válido
  "password": "password123",           # Requerido, mínimo 8 caracteres
  "firstName": "Juan",                 # Opcional, máximo 100 caracteres
  "lastName": "Pérez"                  # Opcional, máximo 100 caracteres
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "message": "Registration successful. Please check your email to activate your account."
  }
}
```

> **Nota:** Después del registro, se envía un email de activación automáticamente. La cuenta no estará activa hasta que el usuario haga clic en el enlace de activación.

### Activar Cuenta

```bash
POST /auth/activate
Content-Type: application/json

{
  "token": "abc123..."  # Token recibido en el email de activación
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Account activated successfully. You can now log in.",
    "user": {
      "id": "uuid",
      "email": "usuario@ejemplo.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "USER"
    }
  }
}
```

**Errores posibles:**
| Código | HTTP | Descripción |
|--------|------|-------------|
| AUTH_007 | 400 | Token de activación inválido |
| AUTH_008 | 400 | Token de activación expirado |
| AUTH_009 | 409 | La cuenta ya está activada |

### Reenviar Email de Activación

```bash
POST /auth/resend-activation
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Activation email sent. Please check your inbox."
  }
}
```

> **Rate limit:** 3 intentos por minuto para evitar spam.

### Solicitar Restablecimiento de Contraseña

```bash
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Password reset email sent. Please check your inbox."
  }
}
```

> **Nota:** El enlace de restablecimiento es válido por 1 hora.

### Restablecer Contraseña

```bash
POST /auth/password-reset
Content-Type: application/json

{
  "token": "abc123...",        # Token recibido en el email
  "password": "newPassword123" # Nueva contraseña, mínimo 8 caracteres
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Password has been reset successfully. You can now log in with your new password."
  }
}
```

**Errores posibles:**
| Código | HTTP | Descripción |
|--------|------|-------------|
| AUTH_007 | 400 | Token de restablecimiento inválido |
| AUTH_008 | 400 | Token de restablecimiento expirado |

### Iniciar Sesión

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",      # Requerido
  "password": "password123"            # Requerido
}
```

> **Nota:** El usuario debe tener la cuenta activada para poder iniciar sesión.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "usuario@ejemplo.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "USER"
    }
  }
}
```

---

## 10. Roles y Autorización

### Roles Disponibles

```typescript
enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
```

| Rol | Descripción |
|-----|-------------|
| `USER` | Usuario estándar (cliente). Puede comprar, revisar productos, gestionar su carrito y perfil. |
| `ADMIN` | Administrador. Acceso total: gestión de productos, categorías, órdenes, usuarios y configuración. |

### Uso de Guards

```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
create(@Body() dto: CreateProductDto) {
  return this.productsService.create(dto);
}
```

---

## 11. Seguridad

### 11.1 Rate Limiting

```env
THROTTLE_TTL=60000        # Ventana de tiempo (ms)
THROTTLE_LIMIT=100        # Requests por ventana
THROTTLE_AUTH_TTL=60000   # Para auth
THROTTLE_AUTH_LIMIT=5     # 5 intentos por minuto
```

### 11.2 CORS

```env
CORS_ORIGINS=http://localhost:3000,https://myapp.com
```

### 11.3 Checklist de Producción

- [ ] Cambiar `JWT_SECRET` (mínimo 32 caracteres)
- [ ] `NODE_ENV=production`
- [ ] Configurar CORS con dominios específicos
- [ ] Habilitar HTTPS

---

## 12. Módulo de Usuarios

### Endpoints del Perfil

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/users/profile` | ✅ | Obtener perfil |
| PATCH | `/users/profile` | ✅ | Actualizar perfil |

### Obtener Perfil

```bash
GET /users/profile
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "+51999888777",
    "role": "USER"
  }
}
```

### Actualizar Perfil

```bash
PATCH /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Juan Carlos",          # Opcional, máximo 100 caracteres
  "lastName": "Pérez García",          # Opcional, máximo 100 caracteres
  "phone": "+51999888777"              # Opcional, máximo 20 caracteres
}
```

### Endpoints de Direcciones

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/users/addresses` | ✅ | Listar direcciones |
| GET | `/users/addresses/:id` | ✅ | Obtener dirección |
| POST | `/users/addresses` | ✅ | Crear dirección |
| PATCH | `/users/addresses/:id` | ✅ | Actualizar dirección |
| DELETE | `/users/addresses/:id` | ✅ | Eliminar dirección |
| PATCH | `/users/addresses/:id/default` | ✅ | Establecer como predeterminada |

### Listar Direcciones

```bash
GET /users/addresses
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "label": "Casa",
      "recipientName": "Juan Pérez",
      "phone": "+51999888777",
      "street": "Av. Larco",
      "number": "123",
      "apartment": "201",
      "district": "Miraflores",
      "city": "Lima",
      "department": "Lima",
      "postalCode": "15074",
      "reference": "Frente al parque",
      "isDefault": true,
      "createdAt": "2025-01-30T12:00:00.000Z",
      "updatedAt": "2025-01-30T12:00:00.000Z"
    }
  ]
}
```

### Obtener Dirección

```bash
GET /users/addresses/:id
Authorization: Bearer <token>
```

**Parámetros de ruta:**
| Parámetro | Descripción |
|-----------|-------------|
| `id` | UUID de la dirección (obtenido de `GET /users/addresses`) |

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "label": "Casa",
    "recipientName": "Juan Pérez",
    "phone": "+51999888777",
    "street": "Av. Larco",
    "number": "123",
    "apartment": "201",
    "district": "Miraflores",
    "city": "Lima",
    "department": "Lima",
    "postalCode": "15074",
    "reference": "Frente al parque",
    "isDefault": true
  }
}
```

**Errores:**
- `404 ADDRESS_NOT_FOUND` - La dirección no existe o no pertenece al usuario

### Crear Dirección

```bash
POST /users/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Casa",                     # Requerido, máximo 100 caracteres
  "street": "Av. Larco",               # Requerido, máximo 200 caracteres
  "number": "123",                     # Opcional, máximo 50 caracteres
  "apartment": "201",                  # Opcional, máximo 100 caracteres
  "district": "Miraflores",            # Requerido, máximo 100 caracteres
  "city": "Lima",                      # Requerido, máximo 100 caracteres
  "department": "Lima",                # Requerido, máximo 100 caracteres
  "postalCode": "15074",               # Opcional, máximo 10 caracteres
  "recipientName": "Juan Pérez",       # Requerido, máximo 100 caracteres
  "recipientPhone": "+51999888777",    # Requerido, máximo 20 caracteres
  "reference": "Frente al parque",     # Opcional, máximo 500 caracteres
  "isDefault": true                    # Opcional, default: false
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "label": "Casa",
    "recipientName": "Juan Pérez",
    "phone": "+51999888777",
    "street": "Av. Larco",
    "number": "123",
    "apartment": "201",
    "district": "Miraflores",
    "city": "Lima",
    "department": "Lima",
    "postalCode": "15074",
    "reference": "Frente al parque",
    "isDefault": true
  }
}
```

> **Nota:** La primera dirección creada se establece automáticamente como predeterminada.

### Actualizar Dirección

```bash
PATCH /users/addresses/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Parámetros de ruta:**
| Parámetro | Descripción |
|-----------|-------------|
| `id` | UUID de la dirección a actualizar (obtenido de `GET /users/addresses`) |

**Body:**
```json
{
  "label": "Oficina",                  # Opcional
  "street": "Av. Javier Prado 500",    # Opcional
  "district": "San Isidro",            # Opcional
  "isDefault": true                    # Opcional
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "label": "Oficina",
    "recipientName": "Juan Pérez",
    "phone": "+51999888777",
    "street": "Av. Javier Prado 500",
    "number": "123",
    "apartment": "201",
    "district": "San Isidro",
    "city": "Lima",
    "department": "Lima",
    "postalCode": "15074",
    "reference": "Frente al parque",
    "isDefault": true
  }
}
```

### Eliminar Dirección

```bash
DELETE /users/addresses/:id
Authorization: Bearer <token>
```

**Parámetros de ruta:**
| Parámetro | Descripción |
|-----------|-------------|
| `id` | UUID de la dirección a eliminar (obtenido de `GET /users/addresses`) |

**Response (204):** Sin contenido

> **Nota:** Si la dirección eliminada era la predeterminada, otra dirección se establecerá automáticamente como predeterminada.

### Establecer Dirección Predeterminada

```bash
PATCH /users/addresses/:id/default
Authorization: Bearer <token>
```

**Parámetros de ruta:**
| Parámetro | Descripción |
|-----------|-------------|
| `id` | UUID de la dirección a establecer como predeterminada |

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "label": "Casa",
    "isDefault": true,
    "..."
  }
}
```

### Endpoints de Administración (Solo ADMIN)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/users/admin/all` | ✅ | ADMIN | Listar todos los usuarios |
| PATCH | `/users/:userId/role` | ✅ | ADMIN | Cambiar rol de usuario |

### Listar Todos los Usuarios

```bash
GET /users/admin/all
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "email": "usuario@ejemplo.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "phone": "+51999888777",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-01-30T12:00:00.000Z"
    }
  ]
}
```

### Cambiar Rol de Usuario

```bash
PATCH /users/:userId/role
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Parámetros de ruta:**
| Parámetro | Descripción |
|-----------|-------------|
| `userId` | UUID del usuario a modificar (obtenido de `GET /users/admin/all`) |

**Body:**
```json
{
  "role": "ADMIN"                      # Requerido: "USER" | "ADMIN"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2025-01-30T12:00:00.000Z"
  }
}
```

---

## 13. Módulo de Productos

### Endpoints

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/products` | ❌ | - | Listar productos |
| GET | `/products/:id` | ❌ | - | Obtener producto por ID |
| GET | `/products/slug/:slug` | ❌ | - | Buscar por slug |
| POST | `/products` | ✅ | ADMIN | Crear producto |
| PATCH | `/products/:id` | ✅ | ADMIN | Actualizar producto |
| DELETE | `/products/:id` | ✅ | ADMIN | Eliminar producto |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `id` | UUID del producto (obtenido de `GET /products`) |
| `slug` | Slug único del producto (ej: `polo-basico`) |

### Listar Productos

```bash
GET /products?page=1&limit=10&categoryId=uuid&minPrice=10&maxPrice=100&isActive=true
```

### Crear Producto

```bash
POST /products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Polo Básico",               # Requerido, máximo 200 caracteres
  "slug": "polo-basico",               # Opcional, formato: a-z0-9-
  "description": "Polo 100% algodón",  # Requerido, máximo 2000 caracteres
  "shortDescription": "Polo cómodo",   # Opcional, máximo 500 caracteres
  "price": 49.99,                      # Requerido, número positivo
  "compareAtPrice": 59.99,             # Opcional, número positivo
  "stock": 100,                        # Opcional, mínimo 0, default: 0
  "isActive": true,                    # Opcional, default: true
  "hasVariants": false,                # Opcional, default: false
  "categoryId": "uuid-categoria"       # Opcional, UUID válido
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "name": "Polo Básico",
    "slug": "polo-basico",
    "description": "Polo 100% algodón",
    "shortDescription": "Polo cómodo",
    "price": 49.99,
    "compareAtPrice": 59.99,
    "stock": 100,
    "isActive": true,
    "hasVariants": false,
    "categoryId": "uuid-categoria",
    "createdAt": "2026-01-30T10:30:00.000Z"
  }
}
```

### Actualizar Producto

```bash
PATCH /products/:id
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Parámetros de ruta:**
| Parámetro | Descripción |
|-----------|-------------|
| `id` | UUID del producto a actualizar (obtenido de `GET /products`) |

**Body:**
```json
{
  "name": "Polo Básico Premium",       # Todos los campos son opcionales
  "price": 54.99,
  "stock": 150,
  "isActive": true
}
```

---

## 14. Módulo de Categorías

### Endpoints

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/categories` | ❌ | - | Listar categorías |
| GET | `/categories/:id` | ❌ | - | Obtener categoría por ID |
| POST | `/categories` | ✅ | ADMIN | Crear categoría |
| PATCH | `/categories/:id` | ✅ | ADMIN | Actualizar categoría |
| DELETE | `/categories/:id` | ✅ | ADMIN | Eliminar categoría |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `id` | UUID de la categoría (obtenido de `GET /categories`) |

### Crear Categoría

```bash
POST /categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Electrónica",               # Requerido, máximo 100 caracteres
  "description": "Productos...",       # Opcional, máximo 500 caracteres
  "isActive": true                     # Opcional, default: true
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "name": "Electrónica",
    "slug": "electronica",
    "description": "Productos electrónicos",
    "isActive": true,
    "createdAt": "2026-01-30T10:30:00.000Z"
  }
}
```

---

## 15. Variantes de Productos

### Endpoints

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/variants/product/:productId` | ❌ | - | Listar variantes de un producto |
| GET | `/variants/:id` | ❌ | - | Obtener variante por ID |
| GET | `/variants/sku/:sku` | ❌ | - | Buscar por SKU |
| POST | `/variants` | ✅ | ADMIN | Crear variante |
| PATCH | `/variants/:id` | ✅ | ADMIN | Actualizar variante |
| DELETE | `/variants/:id` | ✅ | ADMIN | Eliminar variante |
| GET | `/variants/:id/availability` | ❌ | - | Verificar disponibilidad |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `productId` | UUID del producto padre (obtenido de `GET /products`) |
| `id` | UUID de la variante (obtenido de `GET /variants/product/:productId`) |
| `sku` | Código SKU único de la variante (ej: `POLO-BAS-M-ROJO`) |

### Crear Variante

```bash
POST /variants
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "productId": "prod-uuid",            # Requerido, UUID válido
  "sku": "POLO-BAS-M-ROJO",            # Requerido, único
  "price": 49.99,                      # Requerido, número positivo
  "compareAtPrice": 59.99,             # Opcional
  "stock": 100,                        # Requerido, número >= 0
  "attributeValueIds": [               # Array de UUIDs de valores, mínimo 1
    "talla-m-uuid",
    "color-rojo-uuid"
  ]
}
```

### Tests de Variantes

El servicio de variantes tiene tests unitarios en `src/products/variants.service.spec.ts`:

```bash
# Ejecutar solo tests de variantes
pnpm test variants.service
```

**Casos de prueba cubiertos:**
| Método | Caso de Prueba |
|--------|----------------|
| `create` | Crear variante exitosamente |
| `create` | Error si producto no existe (`ProductNotFoundException`) |
| `create` | Error si SKU ya existe (`ProductSkuExistsException`) |
| `create` | No actualizar `hasVariants` si ya es `true` |
| `findAllByProduct` | Listar todas las variantes de un producto |
| `findOne` | Obtener variante por ID |
| `findOne` | Error si variante no existe (`ProductVariantNotFoundException`) |
| `findBySku` | Buscar variante por SKU |
| `findBySku` | Error si SKU no existe |
| `update` | Actualizar variante exitosamente |
| `update` | Error al actualizar a SKU existente |
| `update` | Actualizar atributos de variante |
| `remove` | Eliminar variante |
| `updateStock` | Incrementar stock |
| `updateStock` | Decrementar stock |
| `updateStock` | No permitir stock negativo |
| `checkAvailability` | Verificar disponibilidad con stock suficiente |
| `checkAvailability` | Retornar `false` si variante inactiva |
| `checkAvailability` | Retornar `false` si stock insuficiente |

---

## 16. Imágenes de Productos

### Endpoints

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/products/:productId/images` | ❌ | - | Listar imágenes del producto |
| POST | `/products/:productId/images` | ✅ | ADMIN | Agregar imagen |
| DELETE | `/products/:productId/images/:id` | ✅ | ADMIN | Eliminar imagen |
| PATCH | `/products/:productId/images/:id/primary` | ✅ | ADMIN | Establecer como principal |
| PATCH | `/products/:productId/images/reorder` | ✅ | ADMIN | Reordenar imágenes |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `productId` | UUID del producto (obtenido de `GET /products`) |
| `id` | UUID de la imagen (obtenido de `GET /products/:productId/images`) |

### Agregar Imagen

```bash
POST /products/:productId/images
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "url": "https://cloudinary.com/.../polo.jpg",
  "thumbnailUrl": "https://cloudinary.com/.../polo_thumb.jpg",
  "publicId": "products/polo-rojo",
  "altText": "Polo rojo - Vista frontal",
  "isPrimary": true
}
```

### Subir Archivo (Multipart)

```bash
POST /products/:productId/images/upload
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

file: <archivo.jpg>                    # Máximo 5MB
alt: "Descripción de la imagen"
displayOrder: 0
```

---

## 17. Carrito de Compras

### Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/cart` | ✅ | Obtener carrito del usuario |
| POST | `/cart/items` | ✅ | Agregar item al carrito |
| PATCH | `/cart/items/:itemId` | ✅ | Actualizar cantidad de item |
| DELETE | `/cart/items/:itemId` | ✅ | Eliminar item del carrito |
| DELETE | `/cart` | ✅ | Vaciar carrito completo |
| GET | `/cart/validate` | ✅ | Validar carrito para checkout |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `itemId` | UUID del item en el carrito (obtenido de `GET /cart` en `items[].id`) |

### Obtener Carrito

```bash
GET /cart
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "cart-uuid",
    "items": [
      {
        "id": "item-uuid",
        "productId": "prod-uuid",
        "product": { "name": "Polo Básico", "slug": "polo-basico" },
        "variantId": null,
        "quantity": 2,
        "unitPrice": "49.99",
        "subtotal": 99.98
      }
    ],
    "total": 99.98,
    "itemCount": 2
  }
}
```

### Agregar al Carrito

```bash
POST /cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "prod-uuid",            # Requerido, UUID válido
  "variantId": "variant-uuid",         # Opcional, UUID si producto tiene variantes
  "quantity": 2                        # Requerido, entre 1 y 99
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "item-uuid",
    "cartId": "cart-uuid",
    "productId": "prod-uuid",
    "variantId": "variant-uuid",
    "quantity": 2,
    "unitPrice": "49.99"
  }
}
```

### Actualizar Cantidad

```bash
PATCH /cart/items/:itemId
Authorization: Bearer <token>
Content-Type: application/json
```

**Parámetros de ruta:**
| Parámetro | Descripción |
|-----------|-------------|
| `itemId` | UUID del item en el carrito (obtenido de `GET /cart` en `items[].id`) |

**Body:**
```json
{
  "quantity": 5                        # Requerido, entre 1 y 99
}
```

### Validar Carrito

```bash
GET /cart/validate
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "valid": true,
    "errors": []
  }
}
```

Si hay problemas:
```json
{
  "data": {
    "valid": false,
    "errors": [
      "Product 'Polo' is no longer available",
      "Insufficient stock for 'Camiseta' (Available: 5)"
    ]
  }
}
```

---

## 18. Órdenes

### Endpoints

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/orders` | ✅ | - | Listar mis órdenes |
| GET | `/orders/:id` | ✅ | - | Obtener orden por ID |
| GET | `/orders/number/:orderNumber` | ✅ | - | Buscar por número de orden |
| POST | `/orders` | ✅ | - | Crear orden desde carrito |
| POST | `/orders/:id/cancel` | ✅ | - | Cancelar mi orden |
| PATCH | `/orders/:id` | ✅ | ADMIN | Actualizar estado de orden |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `id` | UUID de la orden (obtenido de `GET /orders` o al crearla) |
| `orderNumber` | Número legible de la orden (ej: `ORD202601300001`) |

### Estados de Orden

```typescript
enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}
```

### Métodos de Pago

```typescript
enum PaymentMethod {
  STRIPE = 'STRIPE',
  MERCADOPAGO = 'MERCADOPAGO',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}
```

### Crear Orden

```bash
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddressId": "address-uuid", # Requerido, UUID de dirección del usuario
  "paymentMethod": "STRIPE",           # Requerido: STRIPE, MERCADOPAGO, CASH_ON_DELIVERY
  "discountCode": "SUMMER10",          # Opcional, código de cupón
  "notes": "Entregar por la mañana"    # Opcional, máximo 500 caracteres
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD202601300001",
    "status": "PENDING",
    "shippingAddress": {
      "recipientName": "Juan Pérez",
      "street": "Av. Larco 123",
      "district": "Miraflores",
      "city": "Lima",
      "department": "Lima"
    },
    "subtotal": "99.98",
    "shippingCost": "10.00",
    "discount": "9.99",
    "total": "99.99",
    "items": [...],
    "payments": [
      {
        "id": "payment-uuid",
        "method": "STRIPE",
        "status": "PENDING",
        "amount": "99.99"
      }
    ]
  }
}
```

### Actualizar Orden (Admin)

```bash
PATCH /orders/:id
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Parámetros de ruta:**
| Parámetro | Descripción |
|-----------|-------------|
| `id` | UUID de la orden a actualizar (obtenido de `GET /orders`) |

**Body:**
```json
{
  "status": "SHIPPED",
  "trackingNumber": "PE123456789",
  "trackingUrl": "https://tracking.example.com/PE123456789"
}
```

---

## 19. Cupones

### Endpoints

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/coupons` | ✅ | ADMIN | Listar todos los cupones |
| GET | `/coupons/:id` | ✅ | ADMIN | Obtener cupón por ID |
| GET | `/coupons/code/:code` | ✅ | - | Buscar cupón por código |
| POST | `/coupons` | ✅ | ADMIN | Crear cupón |
| PATCH | `/coupons/:id` | ✅ | ADMIN | Actualizar cupón |
| DELETE | `/coupons/:id` | ✅ | ADMIN | Eliminar cupón |
| POST | `/coupons/validate` | ✅ | - | Validar cupón para carrito |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `id` | UUID del cupón (obtenido de `GET /coupons`) |
| `code` | Código del cupón (ej: `VERANO2026`, `BIENVENIDO10`) |

### Tipos de Descuento

```typescript
enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',           // Porcentaje del total
  FIXED_AMOUNT = 'FIXED_AMOUNT',       // Monto fijo
  FREE_SHIPPING = 'FREE_SHIPPING',     // Envío gratis
}
```

### Crear Cupón

```bash
POST /coupons
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "code": "VERANO2026",                # Requerido, único, máximo 50 caracteres
  "description": "Descuento de verano",# Opcional, máximo 500 caracteres
  "discountType": "PERCENTAGE",        # Requerido: PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
  "discountValue": 15,                 # Requerido, mínimo 0
  "minPurchaseAmount": 50.00,          # Opcional, monto mínimo de compra
  "maxDiscountAmount": 100.00,         # Opcional, descuento máximo aplicable
  "usageLimit": 100,                   # Opcional, usos totales permitidos
  "usageLimitPerUser": 1,              # Opcional, usos por usuario
  "startDate": "2026-01-01T00:00:00Z", # Requerido, fecha inicio
  "endDate": "2026-03-31T23:59:59Z",   # Requerido, fecha fin
  "isActive": true,                    # Opcional, default: true
  "applicableCategories": ["cat-uuid"],# Opcional, categorías donde aplica
  "applicableProducts": ["prod-uuid"], # Opcional, productos donde aplica
  "excludedProducts": []               # Opcional, productos excluidos
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "coupon-uuid",
    "code": "VERANO2026",
    "discountType": "PERCENTAGE",
    "discountValue": 15,
    "minPurchaseAmount": 50.00,
    "maxDiscountAmount": 100.00,
    "usageLimit": 100,
    "usageCount": 0,
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2026-03-31T23:59:59Z",
    "isActive": true
  }
}
```

### Validar Cupón

```bash
POST /coupons/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "VERANO2026",
  "cartTotal": 150.00
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "valid": true,
    "discount": 22.50,
    "message": "Cupón aplicado: 15% de descuento"
  }
}
```

---

## 20. Pagos

### Variables de Entorno

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MERCADOPAGO_ACCESS_TOKEN=TEST-...
APP_URL=http://localhost:3000
```

### Endpoints Stripe

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/payments/stripe/create-intent/:orderId` | ✅ | Crear PaymentIntent para orden |
| POST | `/payments/stripe/webhook` | ❌ | Webhook de eventos Stripe |
| POST | `/payments/stripe/refund/:paymentId` | ✅ ADMIN | Reembolsar pago |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `orderId` | UUID de la orden (obtenido al crear orden con `POST /orders`) |
| `paymentId` | UUID del pago (obtenido de `order.payments[].id`) |

### Crear PaymentIntent (Stripe)

```bash
POST /payments/stripe/create-intent/:orderId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

### Endpoints MercadoPago

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/payments/mercadopago/create-preference/:orderId` | ✅ | Crear preferencia de pago |
| POST | `/payments/mercadopago/webhook` | ❌ | Webhook IPN de MercadoPago |
| POST | `/payments/mercadopago/refund/:paymentId` | ✅ ADMIN | Reembolsar pago |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `orderId` | UUID de la orden (obtenido al crear orden con `POST /orders`) |
| `paymentId` | UUID del pago (obtenido de `order.payments[].id`) |

### Crear Preferencia (MercadoPago)

```bash
POST /payments/mercadopago/create-preference/:orderId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "preferenceId": "xxx-xxx-xxx",
    "initPoint": "https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=xxx",
    "sandboxInitPoint": "https://sandbox.mercadopago.com.pe/checkout/..."
  }
}
```

### Reembolsar Pago

```bash
POST /payments/stripe/refund/:paymentId
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Parámetros de ruta:**
| Parámetro | Descripción |
|-----------|-------------|
| `paymentId` | UUID del pago a reembolsar (obtenido de `order.payments[].id`) |

**Body:**
```json
{
  "amount": 50.00                      # Opcional, si no se envía es reembolso total
}
```

---

## 21. Envíos

### Carriers Disponibles

```typescript
enum ShippingCarrier {
  OLVA = 'OLVA',
  SHALOM = 'SHALOM',
  CRUZ_DEL_SUR = 'CRUZ_DEL_SUR',
  SERVIENTREGA = 'SERVIENTREGA',
  PICKUP = 'PICKUP',
}
```

### Estados de Envío

```typescript
enum ShippingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}
```

### Endpoints

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/shipping/calculate` | ❌ | - | Calcular costo de envío |
| GET | `/shipping/carriers` | ❌ | - | Listar transportistas disponibles |
| GET | `/shipping/track/:trackingNumber` | ❌ | - | Rastrear envío por número |
| POST | `/shipping` | ✅ | ADMIN | Crear envío para orden |
| PATCH | `/shipping/:id` | ✅ | ADMIN | Actualizar estado de envío |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `trackingNumber` | Número de rastreo del envío (ej: `OLV123456789`) |
| `id` | UUID del envío (obtenido al crear envío o de la orden) |

### Calcular Costo de Envío

```bash
GET /shipping/calculate?department=Lima&weightKg=2.5&carrier=OLVA
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "department": "Lima",
    "weightKg": 2.5,
    "baseCost": 10.00,
    "weightCost": 5.00,
    "totalCost": 15.00,
    "estimatedDays": { "min": 1, "max": 1 },
    "currency": "PEN"
  }
}
```

### Tarifas por Departamento

| Departamento | Base (S/.) | Por kg (S/.) | Días |
|--------------|------------|--------------|------|
| Lima | 10.00 | 2.00 | 1 |
| Callao | 10.00 | 2.00 | 1 |
| Arequipa | 18.00 | 3.00 | 2-3 |
| La Libertad | 18.00 | 3.00 | 2-3 |
| Cusco | 22.00 | 3.50 | 3-4 |
| Loreto | 45.00 | 6.00 | 5-7 |
| Otros | 25.00 | 4.00 | 3-5 |

### Crear Envío (Admin)

```bash
POST /shipping
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "orderId": "order-uuid",             # Requerido, UUID de orden
  "carrier": "OLVA",                   # Requerido: OLVA, SHALOM, CRUZ_DEL_SUR, SERVIENTREGA, PICKUP
  "trackingNumber": "OLV123456789",    # Opcional
  "weightKg": 1.5,                     # Opcional, mínimo 0
  "dimensions": {                      # Opcional
    "lengthCm": 30,
    "widthCm": 20,
    "heightCm": 15
  },
  "estimatedDeliveryDate": "2026-02-05"# Opcional, formato ISO
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "shipment-uuid",
    "orderId": "order-uuid",
    "carrier": "OLVA",
    "status": "PENDING",
    "trackingNumber": "OLV123456789",
    "shippingCost": 15.00,
    "estimatedDeliveryDate": "2026-02-05T00:00:00Z"
  }
}
```

### Actualizar Estado de Envío

```bash
PATCH /shipping/:id
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Parámetros de ruta:**
| Parámetro | Descripción |
|-----------|-------------|
| `id` | UUID del envío a actualizar (obtenido al crear envío) |

**Body:**
```json
{
  "status": "SHIPPED",
  "trackingNumber": "OLV123456789",
  "location": "Centro de distribución Lima"
}
```

---

## 22. Inventario

### Tipos de Movimiento

```typescript
enum MovementType {
  PURCHASE = 'PURCHASE',           // Compra de inventario
  RETURN = 'RETURN',               // Devolución de cliente
  ADJUSTMENT_IN = 'ADJUSTMENT_IN', // Ajuste positivo
  TRANSFER_IN = 'TRANSFER_IN',     // Transferencia entrada
  SALE = 'SALE',                   // Venta completada
  RESERVATION = 'RESERVATION',     // Reserva por orden
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT', // Ajuste negativo
  DAMAGED = 'DAMAGED',             // Productos dañados
  EXPIRED = 'EXPIRED',             // Productos vencidos
  TRANSFER_OUT = 'TRANSFER_OUT',   // Transferencia salida
  RELEASE = 'RELEASE',             // Liberación de reserva
}
```

### Endpoints

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| POST | `/inventory/adjust` | ✅ | ADMIN | Ajustar stock de producto/variante |
| POST | `/inventory/alerts` | ✅ | ADMIN | Configurar alertas de stock bajo |
| GET | `/inventory/low-stock` | ✅ | ADMIN | Obtener items con stock bajo |
| GET | `/inventory/stock/product/:productId` | ✅ | - | Consultar stock de producto |
| GET | `/inventory/stock/variant/:variantId` | ✅ | - | Consultar stock de variante |
| GET | `/inventory/movements/product/:productId` | ✅ | ADMIN | Historial de movimientos |
| POST | `/inventory/check-availability` | ❌ | - | Verificar disponibilidad masiva |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `productId` | UUID del producto (obtenido de `GET /products`) |
| `variantId` | UUID de la variante (obtenido de `GET /variants/product/:productId`) |

### Ajustar Stock

```bash
POST /inventory/adjust
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "productId": "prod-uuid",            # Opcional, UUID (usar productId O variantId)
  "variantId": "variant-uuid",         # Opcional, UUID (usar productId O variantId)
  "type": "PURCHASE",                  # Requerido: ver enum MovementType
  "quantity": 50,                      # Requerido, mínimo 1
  "referenceNumber": "FAC-001",        # Opcional, número de factura/guía
  "notes": "Compra a proveedor X",     # Opcional
  "unitCost": 10.50                    # Opcional, costo unitario
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "movement-uuid",
    "productId": "prod-uuid",
    "type": "PURCHASE",
    "quantity": 50,
    "previousStock": 100,
    "newStock": 150,
    "referenceNumber": "FAC-001",
    "notes": "Compra a proveedor X",
    "unitCost": 10.50,
    "createdAt": "2026-01-30T10:30:00Z"
  }
}
```

### Configurar Alertas de Stock

```bash
POST /inventory/alerts
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "productId": "prod-uuid",
  "lowStockThreshold": 10,             # Alerta cuando stock <= 10
  "criticalStockThreshold": 2,         # Crítico cuando stock <= 2
  "alertEnabled": true
}
```

### Obtener Items con Bajo Stock

```bash
GET /inventory/low-stock
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "name": "Producto A",
      "sku": "SKU-001",
      "currentStock": 3,
      "threshold": 10,
      "type": "product",
      "isCritical": true
    }
  ]
}
```

### Verificar Disponibilidad

```bash
POST /inventory/check-availability
Content-Type: application/json

[
  { "productId": "prod-uuid", "quantity": 2 },
  { "variantId": "var-uuid", "quantity": 1 }
]
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "available": true,
    "items": [
      { "productId": "prod-uuid", "available": true, "stock": 50 },
      { "variantId": "var-uuid", "available": true, "stock": 20 }
    ]
  }
}
```

---

## 23. Reviews

### Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/reviews/product/:productId` | ❌ | Obtener reviews de un producto |
| GET | `/reviews/:id` | ❌ | Obtener review por ID |
| POST | `/reviews` | ✅ | Crear review de producto comprado |
| PATCH | `/reviews/:id` | ✅ | Actualizar mi review |
| DELETE | `/reviews/:id` | ✅ | Eliminar mi review |
| GET | `/reviews/user/me` | ✅ | Listar mis reviews |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `productId` | UUID del producto (obtenido de `GET /products`) |
| `id` | UUID de la review (obtenido de `GET /reviews/product/:productId` o `GET /reviews/user/me`) |

### Crear Review

```bash
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "prod-uuid",            # Requerido, UUID del producto
  "rating": 5,                         # Requerido, entre 1 y 5
  "title": "Excelente producto",       # Opcional, máximo 200 caracteres
  "comment": "Muy buena calidad...",   # Opcional, máximo 2000 caracteres
  "images": [                          # Opcional, URLs de imágenes
    "https://example.com/img1.jpg",
    "https://example.com/img2.jpg"
  ]
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "review-uuid",
    "userId": "user-uuid",
    "productId": "prod-uuid",
    "rating": 5,
    "title": "Excelente producto",
    "comment": "Muy buena calidad...",
    "images": ["https://example.com/img1.jpg"],
    "isVerifiedPurchase": true,
    "createdAt": "2026-01-30T10:30:00Z"
  }
}
```

### Actualizar Review

```bash
PATCH /reviews/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Parámetros de ruta:**
| Parámetro | Descripción |
|-----------|-------------|
| `id` | UUID de la review a actualizar (solo puedes actualizar tus propias reviews) |

**Body:**
```json
{
  "rating": 4,                         # Todos los campos son opcionales
  "title": "Buen producto",
  "comment": "Actualicé mi opinión..."
}
```

### Obtener Reviews de Producto

```bash
GET /reviews/product/:productId?page=1&limit=10&sortBy=rating&order=desc
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "reviews": [...],
    "summary": {
      "averageRating": 4.5,
      "totalReviews": 25,
      "distribution": {
        "5": 15,
        "4": 5,
        "3": 3,
        "2": 1,
        "1": 1
      }
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

## 24. Wishlist

### Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/wishlist` | ✅ | Obtener mi wishlist completa |
| POST | `/wishlist` | ✅ | Agregar producto a wishlist |
| PATCH | `/wishlist/:itemId` | ✅ | Actualizar item de wishlist |
| DELETE | `/wishlist/:itemId` | ✅ | Eliminar item de wishlist |
| DELETE | `/wishlist` | ✅ | Vaciar wishlist completa |
| POST | `/wishlist/:itemId/move-to-cart` | ✅ | Mover item al carrito |

**Descripción de parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `itemId` | UUID del item en wishlist (obtenido de `GET /wishlist` en `items[].id`) |

### Agregar a Wishlist

```bash
POST /wishlist
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "prod-uuid",            # Requerido, UUID del producto
  "variantId": "var-uuid",             # Opcional, UUID de variante
  "notes": "Para mi cumpleaños",       # Opcional, máximo 500 caracteres
  "notifyOnPriceDrop": true,           # Opcional, notificar si baja el precio
  "notifyOnBackInStock": true          # Opcional, notificar si vuelve a stock
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "wishlist-item-uuid",
    "productId": "prod-uuid",
    "product": {
      "name": "Polo Básico",
      "price": 49.99,
      "image": "https://..."
    },
    "variantId": "var-uuid",
    "notes": "Para mi cumpleaños",
    "notifyOnPriceDrop": true,
    "notifyOnBackInStock": true,
    "addedAt": "2026-01-30T10:30:00Z"
  }
}
```

### Obtener Wishlist

```bash
GET /wishlist
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": "item-uuid",
        "product": {
          "id": "prod-uuid",
          "name": "Polo Básico",
          "price": 49.99,
          "image": "https://...",
          "isActive": true,
          "inStock": true
        },
        "variant": null,
        "notes": "Para mi cumpleaños",
        "notifyOnPriceDrop": true,
        "addedAt": "2026-01-30T10:30:00Z"
      }
    ],
    "total": 1
  }
}
```

### Mover al Carrito

```bash
POST /wishlist/:itemId/move-to-cart
Authorization: Bearer <token>
Content-Type: application/json
```

**Parámetros de ruta:**
| Parámetro | Descripción |
|-----------|-------------|
| `itemId` | UUID del item en wishlist a mover al carrito |

**Body:**
```json
{
  "quantity": 1                        # Opcional, default: 1
}
```

---

## 25. Notificaciones

### Configuración de Email

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM="E-commerce <noreply@example.com>"
ADMIN_EMAIL=admin@example.com
```

### Notificaciones Automáticas

| Evento | Email Enviado |
|--------|---------------|
| Orden creada | Confirmación de orden |
| Pago exitoso | Confirmación de pago |
| Pago fallido | Notificación de fallo |
| Orden enviada | Tracking de envío |
| Orden entregada | Confirmación de entrega |
| Orden cancelada | Notificación de cancelación |
| Stock bajo | Alerta al admin |

### Gmail App Password

1. Ir a [Google Account Security](https://myaccount.google.com/security)
2. Activar verificación en 2 pasos
3. Ir a "App passwords"
4. Seleccionar "Mail" y "Other (Custom name)"
5. Copiar la contraseña generada (16 caracteres)
6. Usar en `MAIL_PASSWORD`

---

## 26. Cloudinary (Imágenes)

### Configuración

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Subir Imagen desde Archivo

```bash
POST /products/:productId/images/upload
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

file: <archivo.jpg>                    # Máximo 5MB, formatos: jpg, png, webp
alt: "Descripción de la imagen"
displayOrder: 0
```

### Subir Imagen desde URL

```bash
POST /products/:productId/images/upload-url
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "url": "https://example.com/image.jpg",
  "alt": "Descripción"
}
```

---

## 27. Módulo de Pruebas de Seguridad

### Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/security/report` | ADMIN | Reporte de seguridad |
| GET | `/security/payloads` | ADMIN | Payloads de prueba |
| POST | `/security/test/sql-injection` | ADMIN | Test SQL Injection |
| POST | `/security/test/xss` | ADMIN | Test XSS |
| POST | `/security/test/all` | ADMIN | Ejecutar todas las pruebas |
| GET | `/security/test/rate-limit` | ❌ | Prueba rate limiting |
| POST | `/security/test/password-strength` | ADMIN | Analizar contraseña |

### Probar SQL Injection

```bash
POST /security/test/sql-injection
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "input": "' OR '1'='1"
}
```

### Analizar Fortaleza de Contraseña

```bash
POST /security/test/password-strength
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "password": "MiPassword123!"
}
```

**Response (200):**
```json
{
  "data": {
    "testName": "Password Strength Test",
    "passed": true,
    "message": "Fortaleza: Muy fuerte (100%)",
    "details": {
      "score": "6/6",
      "checks": {
        "minLength": true,
        "hasUppercase": true,
        "hasLowercase": true,
        "hasNumbers": true,
        "hasSpecialChars": true,
        "noCommonPatterns": true
      }
    }
  }
}
```

---

## 28. Testing

### Ejecutar Tests

```bash
pnpm test              # Unit tests
pnpm test:watch        # Watch mode
pnpm test:cov          # Coverage
pnpm test:e2e          # E2E tests
```

### Estructura de Tests

```
src/
├── products/
│   ├── products.service.spec.ts
│   └── variants.service.spec.ts
├── categories/
│   └── categories.service.spec.ts
test/
└── app.e2e-spec.ts
```

---

## 29. Comandos Útiles

### Desarrollo

```bash
pnpm start:dev         # Modo desarrollo
pnpm start:debug       # Modo debug
pnpm build             # Build
pnpm start:prod        # Producción
```

### Base de Datos

```bash
pnpm prisma:migrate    # Migraciones
pnpm prisma:generate   # Generar cliente
pnpm prisma:studio     # Prisma Studio
```

### Docker

```bash
docker-compose up -d   # Iniciar servicios
docker-compose logs -f # Ver logs
docker-compose down    # Detener servicios
```

### Makefile

```bash
make dev               # Iniciar en desarrollo
make build             # Build
make test              # Ejecutar tests
make db-migrate        # Migraciones
make db-studio         # Prisma Studio
make docker-up         # Docker up
make docker-down       # Docker down
```

---

## Lineamientos de Tipado TypeScript

### ❌ Prohibido: Uso de `any`

El uso de `any` está **prohibido** en el proyecto. Evita la verificación de tipos y anula los beneficios de TypeScript.

```typescript
// ❌ MAL - Nunca usar any
function processData(data: any) {
  return data.name;
}

// ❌ MAL - any implícito
function processData(data) { // Error: Parameter 'data' implicitly has an 'any' type
  return data.name;
}
```

### ✅ Alternativas a `any`

#### 1. Usar tipos específicos

```typescript
// ✅ BIEN - Tipo específico
interface User {
  id: string;
  name: string;
  email: string;
}

function processUser(user: User) {
  return user.name;
}
```

#### 2. Usar `unknown` cuando no conoces el tipo

```typescript
// ✅ BIEN - unknown requiere verificación de tipo
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    return (data as { name: string }).name;
  }
  throw new Error('Invalid data');
}
```

#### 3. Usar genéricos para flexibilidad

```typescript
// ✅ BIEN - Genérico mantiene el tipo
function getFirst<T>(items: T[]): T | undefined {
  return items[0];
}

const firstUser = getFirst<User>(users); // tipo: User | undefined
```

#### 4. Usar tipos de unión

```typescript
// ✅ BIEN - Tipos de unión específicos
type ApiResponse = SuccessResponse | ErrorResponse;

function handleResponse(response: ApiResponse) {
  if ('error' in response) {
    throw new Error(response.error);
  }
  return response.data;
}
```

#### 5. Usar `Record` para objetos dinámicos

```typescript
// ✅ BIEN - Record con tipos definidos
const config: Record<string, string | number> = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};
```

### Casos especiales permitidos

En casos muy específicos donde `any` es inevitable (ej: decoradores, librerías externas sin tipos), usar `// eslint-disable-next-line @typescript-eslint/no-explicit-any` con justificación:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required by NestJS decorator
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // ...
  }
}
```

### Configuración de ESLint

El proyecto tiene configurado `@typescript-eslint/no-explicit-any: "error"` para prevenir el uso de `any`.

---

## Checklist de Desarrollo

- [ ] El código compila sin errores (`pnpm build`)
- [ ] Los tests pasan (`pnpm test`)
- [ ] No hay tipos `any` (usar `unknown`, genéricos o tipos específicos)
- [ ] Los errores usan excepciones de `src/common/exceptions/`
- [ ] Los DTOs tienen validaciones con `class-validator`
- [ ] El commit sigue la convención (`feat:`, `fix:`, etc.)
- [ ] Las funciones tienen tipos de retorno explícitos
- [ ] Los parámetros tienen tipos definidos

---

## Referencias

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [class-validator](https://github.com/typestack/class-validator)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
