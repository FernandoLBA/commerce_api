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
11. [Módulo de Usuarios](#11-módulo-de-usuarios)
12. [Módulo de Productos Extendido](#12-módulo-de-productos-extendido)
13. [Variantes de Productos](#13-variantes-de-productos)
14. [Imágenes de Productos](#14-imágenes-de-productos)
15. [Carrito de Compras](#15-carrito-de-compras)
16. [Órdenes](#16-órdenes)
17. [Pagos](#17-pagos)
18. [Cloudinary (Imágenes)](#18-cloudinary-imágenes)
19. [Envíos](#19-envíos)
20. [Notificaciones](#20-notificaciones)
21. [Inventario](#21-inventario)
22. [Testing](#22-testing)
23. [Comandos Útiles](#23-comandos-útiles)

---

## 1. Configuración Inicial

### Requisitos Previos

- Node.js v18+
- pnpm
- PostgreSQL
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

# Ejecutar migraciones
pnpm prisma:migrate

# Generar cliente Prisma
pnpm prisma:generate

# Iniciar en modo desarrollo
pnpm start:dev
```

### Variables de Entorno

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=commerce_api

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRATION=1h

# Aplicación
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Pagos - Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pagos - MercadoPago
MERCADOPAGO_ACCESS_TOKEN=TEST-...

# Cloudinary (Imágenes)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM="E-commerce <noreply@example.com>"
```

---

## 2. Estructura del Proyecto

```
src/
├── auth/                          # Módulo de autenticación
│   ├── dto/                       # Data Transfer Objects
│   │   ├── create-user.dto.ts
│   │   └── login.dto.ts
│   ├── entities/                  # Entidades TypeORM
│   │   └── user.entity.ts
│   ├── guards/                    # Guards de autenticación
│   │   └── jwt-auth.guard.ts
│   ├── interfaces/                # Interfaces TypeScript
│   │   └── jwt-payload.interface.ts
│   ├── strategies/                # Estrategias Passport
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── common/                        # Código compartido
│   ├── constants/                 # Constantes globales
│   │   ├── error-codes.constants.ts
│   │   └── jwt.constants.ts
│   ├── exceptions/                # Excepciones personalizadas
│   │   └── api.exception.ts
│   ├── filters/                   # Filtros globales
│   │   └── http-exception.filter.ts
│   ├── interceptors/              # Interceptores
│   │   └── response.interceptor.ts
│   ├── interfaces/                # Interfaces compartidas
│   │   └── api-response.interface.ts
│   └── index.ts                   # Barrel export
├── generated/                     # Código generado (Prisma)
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

### Crear una Nueva Feature

```bash
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Crear branch de feature
git checkout -b feature/nombre-descriptivo

# 3. Desarrollar y hacer commits
git add .
git commit -m "feat: descripción del cambio"

# 4. Push y crear PR
git push origin feature/nombre-descriptivo
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

**Ejemplos:**
```bash
git commit -m "feat: add user registration endpoint"
git commit -m "fix: resolve password validation issue"
git commit -m "docs: update API documentation"
```

---

## 4. Creación de Módulos

### Paso 1: Generar el Módulo

```bash
# Usar NestJS CLI
nest g module products
nest g controller products
nest g service products
```

### Paso 2: Crear DTOs con Validación

```typescript
// src/products/dto/create-product.dto.ts
import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(200, { message: 'Name must not exceed 200 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @IsNumber()
  @IsPositive({ message: 'Price must be a positive number' })
  price: number;

  @IsNumber()
  @Min(0, { message: 'Stock cannot be negative' })
  stock: number;
}
```

### Paso 3: Crear el Servicio

```typescript
// src/products/products.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { NotFoundException } from '../common';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    return product;
  }
}
```

### Paso 4: Crear el Controlador

```typescript
// src/products/products.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
```

---

## 5. Manejo de Errores

### Excepciones Disponibles

Importar desde `src/common`:

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
} from '../common';
```

### Códigos de Error

| Código   | Constante                  | HTTP Status | Uso                           |
|----------|----------------------------|-------------|-------------------------------|
| AUTH_001 | AUTH_USER_ALREADY_EXISTS   | 409         | Usuario ya registrado         |
| AUTH_002 | AUTH_USER_NOT_FOUND        | 404         | Usuario no encontrado         |
| AUTH_003 | AUTH_INVALID_CREDENTIALS   | 401         | Credenciales inválidas        |
| AUTH_004 | AUTH_INVALID_TOKEN         | 401         | Token inválido                |
| AUTH_005 | AUTH_TOKEN_EXPIRED         | 401         | Token expirado                |
| AUTH_006 | AUTH_UNAUTHORIZED          | 401         | Acceso no autorizado          |
| VAL_001  | VALIDATION_ERROR           | 400         | Error de validación           |
| GEN_001  | INTERNAL_SERVER_ERROR      | 500         | Error interno del servidor    |
| GEN_002  | NOT_FOUND                  | 404         | Recurso no encontrado         |
| GEN_003  | BAD_REQUEST                | 400         | Solicitud incorrecta          |
| GEN_004  | FORBIDDEN                  | 403         | Acceso prohibido              |

### Uso Correcto

```typescript
// ✅ Usar excepciones específicas
if (!user) {
  throw new UserNotFoundException();
}

if (existingUser) {
  throw new UserAlreadyExistsException();
}

if (!isPasswordValid) {
  throw new InvalidCredentialsException();
}

// ✅ Excepción genérica con mensaje personalizado
throw new NotFoundException(`Product with ID ${id} not found`);

// ✅ Excepción con detalles adicionales
throw new BadRequestException('Invalid data provided', {
  field: 'email',
  reason: 'Already in use',
});
```

### Agregar Nuevos Códigos de Error

```typescript
// src/common/constants/error-codes.constants.ts

export const ErrorCodes = {
  // ... códigos existentes
  
  // Agregar nuevos códigos (seguir convención)
  PRODUCT_NOT_FOUND: 'PROD_001',
  PRODUCT_OUT_OF_STOCK: 'PROD_002',
  ORDER_ALREADY_PROCESSED: 'ORD_001',
} as const;

// Agregar mensajes correspondientes
export const ErrorMessages: Record<ErrorCode, string> = {
  // ... mensajes existentes
  
  [ErrorCodes.PRODUCT_NOT_FOUND]: 'Product not found',
  [ErrorCodes.PRODUCT_OUT_OF_STOCK]: 'Product is out of stock',
  [ErrorCodes.ORDER_ALREADY_PROCESSED]: 'Order has already been processed',
};
```

---

## 6. Validación de Datos

### Decoradores Comunes

```typescript
import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  IsBoolean,
  IsDate,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsPositive,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
```

### Ejemplos de Validación

```typescript
export class CreateOrderDto {
  @IsUUID('4', { message: 'Invalid user ID format' })
  userId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Order must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;

  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  paymentMethod: PaymentMethod;
}

export class OrderItemDto {
  @IsUUID('4', { message: 'Invalid product ID format' })
  productId: string;

  @IsNumber()
  @IsPositive({ message: 'Quantity must be positive' })
  quantity: number;
}
```

### Validación Personalizada

```typescript
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must contain uppercase, lowercase, number, and special character';
  }
}

export function IsStrongPassword() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      validator: IsStrongPasswordConstraint,
    });
  };
}

// Uso:
export class CreateUserDto {
  @IsStrongPassword()
  password: string;
}
```

---

## 7. Respuestas de la API

### Formato de Respuesta Exitosa

```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "timestamp": "2026-01-29T10:30:00.000Z",
  "path": "/api/auth/login"
}
```

### Formato de Respuesta de Error

```json
{
  "statusCode": 401,
  "error": {
    "code": "AUTH_003",
    "message": "Invalid credentials"
  },
  "timestamp": "2026-01-29T10:30:00.000Z",
  "path": "/api/auth/login"
}
```

### Formato de Error de Validación

```json
{
  "statusCode": 400,
  "error": {
    "code": "VAL_001",
    "message": "Validation failed",
    "details": [
      "Please provide a valid email address",
      "Password must be at least 8 characters long"
    ]
  },
  "timestamp": "2026-01-29T10:30:00.000Z",
  "path": "/api/auth/register"
}
```

### HTTP Status Codes Usados

| Código | Descripción              | Uso                                    |
|--------|--------------------------|----------------------------------------|
| 200    | OK                       | Operación exitosa                      |
| 201    | Created                  | Recurso creado exitosamente            |
| 400    | Bad Request              | Error de validación o datos inválidos  |
| 401    | Unauthorized             | No autenticado o credenciales inválidas|
| 403    | Forbidden                | Autenticado pero sin permisos          |
| 404    | Not Found                | Recurso no encontrado                  |
| 409    | Conflict                 | Conflicto (ej: usuario ya existe)      |
| 500    | Internal Server Error    | Error interno del servidor             |

---

## 8. Base de Datos con Prisma

### Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Comandos de Prisma

```bash
# Crear migración
pnpm prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
pnpm prisma migrate deploy

# Generar cliente
pnpm prisma generate

# Abrir Prisma Studio
pnpm prisma studio

# Resetear base de datos (¡CUIDADO!)
pnpm prisma migrate reset
```

### Uso en Servicios

```typescript
import { PrismaClient } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
```

---

## 9. Autenticación

### Proteger Rutas

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('protected')
@UseGuards(JwtAuthGuard)  // Proteger todo el controlador
export class ProtectedController {
  
  @Get()
  getProtectedResource() {
    return { message: 'This is protected' };
  }
}

// O proteger rutas específicas
@Controller('mixed')
export class MixedController {
  
  @Get('public')
  getPublic() {
    return { message: 'This is public' };
  }
  
  @Get('private')
  @UseGuards(JwtAuthGuard)
  getPrivate() {
    return { message: 'This is private' };
  }
}
```

### Obtener Usuario Actual

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Uso en controlador
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: User) {
  return user;
}
```

---

## 10. Roles y Autorización

### Roles Disponibles

```typescript
// src/common/enums/role.enum.ts
export enum Role {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}
```

### Uso del Decorador @Roles

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('products')
export class ProductsController {
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)  // Solo administradores
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  // Sin guards - endpoint público
  findAll() {
    return this.productsService.findAll();
  }
}
```

### Combinación de Roles

```typescript
@Roles(Role.ADMIN, Role.CUSTOMER)  // Permite ambos roles
```

---

## 11. Módulo de Usuarios

### Endpoints del Perfil

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/users/profile` | ✅ | Obtener perfil del usuario |
| PATCH | `/users/profile` | ✅ | Actualizar perfil |

### Endpoints de Direcciones

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/users/addresses` | ✅ | Listar direcciones |
| GET | `/users/addresses/:id` | ✅ | Obtener dirección |
| POST | `/users/addresses` | ✅ | Crear dirección |
| PATCH | `/users/addresses/:id` | ✅ | Actualizar dirección |
| DELETE | `/users/addresses/:id` | ✅ | Eliminar dirección |
| PATCH | `/users/addresses/:id/default` | ✅ | Establecer como predeterminada |

### Ejemplo: Crear Dirección

```bash
POST /users/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Casa",
  "street": "Av. Larco",
  "number": "123",
  "apartment": "201",
  "district": "Miraflores",
  "city": "Lima",
  "department": "Lima",
  "postalCode": "15074",
  "recipientName": "Juan Pérez",
  "recipientPhone": "+51999888777",
  "reference": "Frente al parque Kennedy",
  "isDefault": true
}
```

---

## 12. Módulo de Productos Extendido

### Product Attributes (Atributos)

Definen características como "Talla", "Color", etc.

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/attributes` | ❌ | - | Listar atributos |
| GET | `/attributes/:id` | ❌ | - | Obtener atributo |
| POST | `/attributes` | ✅ | ADMIN | Crear atributo |
| PATCH | `/attributes/:id` | ✅ | ADMIN | Actualizar atributo |
| DELETE | `/attributes/:id` | ✅ | ADMIN | Eliminar atributo |

### Attribute Values (Valores de Atributos)

Valores específicos como "S", "M", "L" o "#FF5733".

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/attributes/values/:id` | ❌ | - | Obtener valor |
| POST | `/attributes/values` | ✅ | ADMIN | Crear valor |
| PATCH | `/attributes/values/:id` | ✅ | ADMIN | Actualizar valor |
| DELETE | `/attributes/values/:id` | ✅ | ADMIN | Eliminar valor |

### Ejemplo: Crear Atributo de Talla

```bash
# 1. Crear el atributo
POST /attributes
Authorization: Bearer <admin_token>
{
  "name": "Talla",
  "type": "select"
}

# Respuesta: { "id": "attr-uuid", "name": "Talla", "type": "select" }

# 2. Crear valores
POST /attributes/values
Authorization: Bearer <admin_token>
{
  "attributeId": "attr-uuid",
  "value": "S"
}

POST /attributes/values
{
  "attributeId": "attr-uuid",
  "value": "M"
}
```

### Ejemplo: Crear Atributo de Color

```bash
POST /attributes
Authorization: Bearer <admin_token>
{
  "name": "Color",
  "type": "color"
}

POST /attributes/values
{
  "attributeId": "color-uuid",
  "value": "Rojo",
  "displayValue": "#FF5733"  // Código hexadecimal
}
```

---

## 13. Variantes de Productos

Las variantes representan combinaciones específicas de atributos con su propio SKU, precio y stock.

### Endpoints

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/variants/product/:productId` | ❌ | - | Listar variantes de producto |
| GET | `/variants/:id` | ❌ | - | Obtener variante |
| GET | `/variants/sku/:sku` | ❌ | - | Buscar por SKU |
| POST | `/variants` | ✅ | ADMIN | Crear variante |
| PATCH | `/variants/:id` | ✅ | ADMIN | Actualizar variante |
| DELETE | `/variants/:id` | ✅ | ADMIN | Eliminar variante |
| PATCH | `/variants/:id/stock` | ✅ | ADMIN | Actualizar stock |
| GET | `/variants/:id/availability` | ❌ | - | Verificar disponibilidad |

### Ejemplo: Crear Variantes

```bash
# Suponiendo:
# - Producto "Polo Básico" con id: "prod-uuid"
# - Talla M tiene id: "talla-m-uuid"
# - Color Rojo tiene id: "color-rojo-uuid"

POST /variants
Authorization: Bearer <admin_token>
{
  "productId": "prod-uuid",
  "sku": "POLO-BAS-M-ROJO",
  "price": 49.99,
  "compareAtPrice": 59.99,
  "stock": 100,
  "attributeValueIds": ["talla-m-uuid", "color-rojo-uuid"]
}
```

### Verificar Disponibilidad

```bash
GET /variants/variant-uuid/availability
Body: { "quantity": 5 }

# Respuesta: true/false
```

---

## 14. Imágenes de Productos

### Endpoints

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/products/:productId/images` | ❌ | - | Listar imágenes |
| GET | `/products/:productId/images/:id` | ❌ | - | Obtener imagen |
| POST | `/products/:productId/images` | ✅ | ADMIN | Agregar imagen |
| PATCH | `/products/:productId/images/:id` | ✅ | ADMIN | Actualizar imagen |
| DELETE | `/products/:productId/images/:id` | ✅ | ADMIN | Eliminar imagen |
| PATCH | `/products/:productId/images/:id/primary` | ✅ | ADMIN | Establecer como principal |
| PATCH | `/products/:productId/images/reorder` | ✅ | ADMIN | Reordenar imágenes |

### Ejemplo: Agregar Imagen

```bash
POST /products/prod-uuid/images
Authorization: Bearer <admin_token>
{
  "url": "https://res.cloudinary.com/demo/image/upload/v1/products/polo-rojo.jpg",
  "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/w_150,h_150/v1/products/polo-rojo.jpg",
  "publicId": "products/polo-rojo",
  "altText": "Polo rojo - Vista frontal",
  "isPrimary": true
}
```

### Reordenar Imágenes

```bash
PATCH /products/prod-uuid/images/reorder
Authorization: Bearer <admin_token>
{
  "imageIds": ["img-3-uuid", "img-1-uuid", "img-2-uuid"]
}
```

---

## 15. Carrito de Compras

El módulo de carrito permite a los usuarios gestionar sus productos antes de realizar un pedido.

### Entidades

#### Cart

```typescript
@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### CartItem

```typescript
@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cartId: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  variantId: string | null;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  // Computed property
  get subtotal(): number {
    return this.quantity * Number(this.unitPrice);
  }
}
```

### Endpoints

#### Obtener Carrito

```bash
GET /cart
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cart-uuid",
    "userId": "user-uuid",
    "items": [
      {
        "id": "item-uuid",
        "productId": "prod-uuid",
        "product": { "name": "Producto", "slug": "producto" },
        "variantId": null,
        "quantity": 2,
        "unitPrice": "99.99",
        "subtotal": 199.98
      }
    ],
    "total": 199.98,
    "itemCount": 2
  }
}
```

#### Agregar al Carrito

```bash
POST /cart/items
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "productId": "prod-uuid",
  "variantId": "variant-uuid",  // Opcional, requerido si el producto tiene variantes
  "quantity": 2
}
```

#### Actualizar Cantidad

```bash
PATCH /cart/items/:itemId
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "quantity": 5
}
```

#### Eliminar Item del Carrito

```bash
DELETE /cart/items/:itemId
Authorization: Bearer <user_token>
```

#### Vaciar Carrito

```bash
DELETE /cart
Authorization: Bearer <user_token>
```

#### Validar Carrito para Checkout

```bash
GET /cart/validate
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": []
  }
}
```

Si hay errores (producto inactivo, stock insuficiente):
```json
{
  "success": true,
  "data": {
    "valid": false,
    "errors": [
      "Product 'Test Product' is no longer available",
      "Insufficient stock for 'Another Product' (Available: 5)"
    ]
  }
}
```

---

## 16. Órdenes

El módulo de órdenes gestiona el ciclo de vida completo de los pedidos.

### Enums

#### OrderStatus

```typescript
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}
```

#### PaymentStatus

```typescript
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}
```

#### PaymentMethod

```typescript
export enum PaymentMethod {
  STRIPE = 'stripe',
  MERCADOPAGO = 'mercadopago',
}
```

### Entidad Order

```typescript
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;  // ORD202501000001

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column('jsonb')
  shippingAddress: {
    recipientName: string;
    recipientPhone: string;
    street: string;
    number: string;
    apartment?: string;
    district: string;
    city: string;
    department: string;
    postalCode: string;
    reference?: string;
  };

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  shippingCost: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ nullable: true })
  trackingNumber?: string;

  @Column({ nullable: true })
  trackingUrl?: string;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];
}
```

### Transiciones de Estado

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    ↓          ↓           ↓
CANCELLED  CANCELLED   CANCELLED
                                        ↓
                                    REFUNDED
```

### Endpoints

#### Crear Orden

```bash
POST /orders
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "shippingAddressId": "address-uuid",
  "paymentMethod": "stripe",
  "discountCode": "SUMMER10",  // Opcional
  "notes": "Entregar por la mañana"  // Opcional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD20250100001",
    "status": "pending",
    "shippingAddress": { ... },
    "subtotal": "199.98",
    "shippingCost": "10.00",
    "discount": "0.00",
    "total": "209.98",
    "items": [ ... ],
    "payments": [
      {
        "id": "payment-uuid",
        "method": "stripe",
        "status": "pending",
        "amount": "209.98",
        "currency": "PEN"
      }
    ]
  }
}
```

#### Listar Órdenes del Usuario

```bash
GET /orders
Authorization: Bearer <user_token>
```

#### Obtener Orden por ID

```bash
GET /orders/:id
Authorization: Bearer <user_token>
```

#### Obtener Orden por Número

```bash
GET /orders/number/:orderNumber
Authorization: Bearer <user_token>
```

#### Cancelar Orden

Solo se puede cancelar si el estado es `pending` o `confirmed`.

```bash
POST /orders/:id/cancel
Authorization: Bearer <user_token>
```

**Nota:** Cancelar una orden restaura automáticamente el stock de los productos/variantes.

#### Actualizar Orden (Admin)

```bash
PATCH /orders/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "shipped",
  "trackingNumber": "PE123456789",
  "trackingUrl": "https://tracking.example.com/PE123456789"
}
```

### Costos de Envío

- **Lima y Callao:** S/. 10.00
- **Otros departamentos:** S/. 20.00

---

## 17. Pagos

El módulo de pagos integra Stripe y MercadoPago para procesar pagos en Perú.

### Variables de Entorno

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=TEST-...

# App
APP_URL=http://localhost:3000
```

### Stripe

#### Crear PaymentIntent

```bash
POST /payments/stripe/create-intent/:orderId
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

#### Webhook de Stripe

```bash
POST /payments/stripe/webhook
Stripe-Signature: t=...,v1=...
```

Eventos manejados:
- `payment_intent.succeeded` → Orden confirmada
- `payment_intent.payment_failed` → Pago fallido
- `charge.refunded` → Reembolso procesado

### MercadoPago

#### Crear Preferencia de Pago

```bash
POST /payments/mercadopago/create-preference/:orderId
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferenceId": "xxx-xxx-xxx",
    "initPoint": "https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=xxx",
    "sandboxInitPoint": "https://sandbox.mercadopago.com.pe/checkout/v1/redirect?pref_id=xxx"
  }
}
```

#### Webhook de MercadoPago

```bash
POST /payments/mercadopago/webhook?data.id=xxx&type=payment
```

### Flujo de Pago Típico

1. Usuario crea orden → `POST /orders`
2. Frontend solicita intent de pago:
   - Stripe: `POST /payments/stripe/create-intent/:orderId`
   - MercadoPago: `POST /payments/mercadopago/create-preference/:orderId`
3. Usuario completa el pago en el frontend
4. Provider envía webhook al backend
5. Backend actualiza estado del pago y la orden
6. **Automáticamente** se envía email de confirmación o fallo al cliente

### Webhooks con Notificaciones Automáticas

Los webhooks ahora integran el `NotificationsService` para enviar emails automáticos:

#### Stripe Webhook

```typescript
// POST /payments/stripe/webhook
// Events handled:
// - payment_intent.succeeded → OrderStatus.CONFIRMED + sendPaymentConfirmation()
// - payment_intent.payment_failed → PaymentStatus.FAILED + sendPaymentFailed()
// - charge.refunded → PaymentStatus.REFUNDED + orden actualizada
```

**Configuración Stripe CLI (desarrollo):**
```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escuchar webhooks localmente
stripe listen --forward-to localhost:3000/payments/stripe/webhook

# Copiar el webhook secret generado a .env
# STRIPE_WEBHOOK_SECRET=whsec_...

# Probar evento manualmente
stripe trigger payment_intent.succeeded
```

#### MercadoPago Webhook (IPN)

```typescript
// POST /payments/mercadopago/webhook
// Status handled:
// - approved → OrderStatus.CONFIRMED + sendPaymentConfirmation()
// - rejected/cancelled → PaymentStatus.FAILED + sendPaymentFailed()
// - refunded → PaymentStatus.REFUNDED
```

**Configuración MercadoPago IPN:**
1. Ir a [Configuración de IPN](https://www.mercadopago.com.pe/developers/panel/notifications/ipn)
2. URL de producción: `https://tu-dominio.com/payments/mercadopago/webhook`
3. Eventos: Seleccionar "Payments"

**Probar con ngrok (desarrollo):**
```bash
# Instalar ngrok
brew install ngrok

# Exponer localhost
ngrok http 3000

# Usar la URL generada en MercadoPago IPN
# https://xxxxx.ngrok.io/payments/mercadopago/webhook
```

### Reembolsos

```bash
# Stripe refund
POST /payments/stripe/refund/:paymentId
Authorization: Bearer <admin_token>
Body: { "amount": 50.00 }  # Opcional, si no se envía es reembolso total

# MercadoPago refund
POST /payments/mercadopago/refund/:paymentId
Authorization: Bearer <admin_token>
Body: { "amount": 50.00 }
```

### Entidad Payment

```typescript
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'PEN' })
  currency: string;

  @Column({ nullable: true })
  externalId?: string;  // PaymentIntent ID o Payment ID

  @Column('jsonb', { nullable: true })
  externalData?: Record<string, any>;  // Datos completos del provider

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  refundedAmount?: number;

  @Column({ nullable: true })
  refundReason?: string;

  @Column({ nullable: true })
  refundedAt?: Date;
}
```

---

## 18. Cloudinary (Imágenes)

### Configuración

Cloudinary es el servicio para almacenar y transformar imágenes de productos.

```typescript
// Variables de entorno requeridas
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### CloudinaryService

```typescript
// src/common/services/cloudinary.service.ts
@Injectable()
export class CloudinaryService {
  // Subir imagen desde buffer (multipart upload)
  async uploadFromBuffer(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<CloudinaryUploadResult>

  // Subir imagen desde URL
  async uploadFromUrl(
    url: string,
    folder: string = 'products',
  ): Promise<CloudinaryUploadResult>

  // Eliminar imagen
  async delete(publicId: string): Promise<void>

  // Eliminar múltiples imágenes
  async deleteMany(publicIds: string[]): Promise<void>

  // Obtener URL transformada
  getTransformedUrl(publicId: string, options: TransformOptions): string

  // URLs responsivas para diferentes dispositivos
  getResponsiveUrls(publicId: string): ResponsiveUrls
}
```

### Endpoints de Imágenes

```typescript
// POST /products/:productId/images/upload
// Subir imagen desde archivo (multipart/form-data)
@Post(':productId/images/upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: imageFileFilter,
}))
async uploadFile(
  @Param('productId') productId: string,
  @UploadedFile() file: Express.Multer.File,
  @Body() createImageDto: CreateProductImageDto,
)

// POST /products/:productId/images/upload-url
// Subir imagen desde URL externa
@Post(':productId/images/upload-url')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async uploadFromUrl(
  @Param('productId') productId: string,
  @Body() body: { url: string } & CreateProductImageDto,
)
```

### Ejemplo de Uso

```bash
# Subir archivo
curl -X POST http://localhost:3000/products/abc123/images/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@product.jpg" \
  -F "alt=Producto principal" \
  -F "displayOrder=0"

# Subir desde URL
curl -X POST http://localhost:3000/products/abc123/images/upload-url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/image.jpg", "alt": "Producto"}'
```

### Respuesta

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "abc123",
    "url": "https://res.cloudinary.com/.../image.jpg",
    "publicId": "products/abc123_1234567890",
    "alt": "Producto principal",
    "width": 800,
    "height": 600,
    "displayOrder": 0
  }
}
```

---

## 19. Envíos

### Carriers Disponibles (Perú)

```typescript
enum ShippingCarrier {
  OLVA = 'olva',           // Olva Courier
  SHALOM = 'shalom',       // Shalom Empresarial
  CRUZ_DEL_SUR = 'cruz_del_sur',  // Cruz del Sur Cargo
  SERVIENTREGA = 'servientrega',  // Servientrega
  PICKUP = 'pickup',       // Recojo en tienda
}
```

### Estados de Envío

```typescript
enum ShippingStatus {
  PENDING = 'pending',           // Pendiente de envío
  PROCESSING = 'processing',     // En preparación
  SHIPPED = 'shipped',           // Despachado
  IN_TRANSIT = 'in_transit',     // En tránsito
  OUT_FOR_DELIVERY = 'out_for_delivery', // En reparto
  DELIVERED = 'delivered',       // Entregado
  FAILED = 'failed',             // Fallido
  RETURNED = 'returned',         // Devuelto
  CANCELLED = 'cancelled',       // Cancelado
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
| Piura | 20.00 | 3.00 | 2-3 |
| Loreto | 45.00 | 6.00 | 5-7 |
| Madre de Dios | 40.00 | 5.50 | 5-7 |
| Otros | 25.00 | 4.00 | 3-5 |

### Endpoints

```typescript
// GET /shipping/calculate - Calcular costo de envío
// Query: department, weightKg, carrier?
@Get('calculate')
async calculateCost(
  @Query('department') department: string,
  @Query('weightKg') weightKg: number,
  @Query('carrier') carrier?: ShippingCarrier,
)

// GET /shipping/carriers - Listar carriers disponibles
@Get('carriers')
async getCarriers(@Query('department') department?: string)

// GET /shipping/track/:trackingNumber - Rastrear envío
@Get('track/:trackingNumber')
async track(@Param('trackingNumber') trackingNumber: string)

// POST /shipping - Crear envío (Admin)
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async create(@Body() createShipmentDto: CreateShipmentDto)

// PATCH /shipping/:id - Actualizar estado (Admin)
@Patch(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async updateStatus(
  @Param('id') id: string,
  @Body() updateDto: UpdateShipmentDto,
)
```

### Calcular Costo - Ejemplo

```bash
curl "http://localhost:3000/shipping/calculate?department=Lima&weightKg=2.5"
```

```json
{
  "success": true,
  "data": {
    "department": "Lima",
    "weightKg": 2.5,
    "baseCost": 10.00,
    "weightCost": 5.00,
    "totalCost": 15.00,
    "estimatedDays": {
      "min": 1,
      "max": 1
    },
    "currency": "PEN"
  }
}
```

### Crear Envío - Ejemplo

```bash
curl -X POST http://localhost:3000/shipping \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-uuid",
    "carrier": "olva",
    "recipientName": "Juan Pérez",
    "recipientPhone": "999888777",
    "addressLine1": "Av. Javier Prado 1234",
    "city": "Lima",
    "department": "Lima",
    "postalCode": "15036",
    "weightKg": 1.5
  }'
```

### Entidades

```typescript
// src/shipping/entities/shipment.entity.ts
@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column({ type: 'enum', enum: ShippingCarrier })
  carrier: ShippingCarrier;

  @Column({ type: 'enum', enum: ShippingStatus, default: ShippingStatus.PENDING })
  status: ShippingStatus;

  @Column({ nullable: true })
  trackingNumber?: string;

  @Column()
  recipientName: string;

  @Column()
  recipientPhone: string;

  @Column()
  addressLine1: string;

  @Column({ nullable: true })
  addressLine2?: string;

  @Column()
  city: string;

  @Column()
  department: string;

  @Column({ nullable: true })
  postalCode?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  shippingCost: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  weightKg?: number;

  @Column({ nullable: true })
  estimatedDeliveryDate?: Date;

  @Column({ nullable: true })
  shippedAt?: Date;

  @Column({ nullable: true })
  deliveredAt?: Date;

  @OneToMany(() => ShipmentEvent, event => event.shipment)
  events: ShipmentEvent[];
}

// src/shipping/entities/shipment-event.entity.ts
@Entity('shipment_events')
export class ShipmentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Shipment, shipment => shipment.events)
  shipment: Shipment;

  @Column()
  shipmentId: string;

  @Column({ type: 'enum', enum: ShippingStatus })
  status: ShippingStatus;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  occurredAt: Date;
}
```

---

## 20. Notificaciones

### Configuración de Email

```typescript
// Variables de entorno
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password  // App password de Gmail
MAIL_FROM="E-commerce <noreply@example.com>"
```

### NotificationsService

```typescript
// src/notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  // Confirmación de orden
  async sendOrderConfirmation(order: Order, userEmail: string): Promise<void>

  // Orden enviada
  async sendOrderShipped(
    order: Order,
    userEmail: string,
    trackingNumber: string,
    carrier: ShippingCarrier,
  ): Promise<void>

  // Orden entregada
  async sendOrderDelivered(order: Order, userEmail: string): Promise<void>

  // Pago confirmado
  async sendPaymentConfirmation(order: Order, userEmail: string): Promise<void>

  // Pago fallido
  async sendPaymentFailed(
    order: Order,
    userEmail: string,
    reason?: string,
  ): Promise<void>

  // Orden cancelada
  async sendOrderCancelled(
    order: Order,
    userEmail: string,
    reason?: string,
  ): Promise<void>
}
```

### Ejemplo de Email - Orden Confirmada

```
Asunto: ¡Pedido #ORD-001 confirmado!

Hola,

¡Gracias por tu compra! Tu pedido ha sido confirmado.

📦 Detalles del Pedido
- Número de orden: ORD-001
- Fecha: 15 de enero de 2025
- Total: S/. 150.00

Productos:
• Producto A (x2) - S/. 50.00
• Producto B (x1) - S/. 50.00

Te notificaremos cuando tu pedido sea enviado.

Saludos,
El equipo de E-commerce
```

### Integración con Órdenes

```typescript
// Dentro de OrdersService
async createOrder(userId: string, data: CreateOrderDto) {
  const order = await this.ordersRepository.save(newOrder);
  
  // Enviar notificación
  await this.notificationsService.sendOrderConfirmation(order, user.email);
  
  return order;
}

// Cuando se despacha
async shipOrder(orderId: string, trackingNumber: string, carrier: ShippingCarrier) {
  const order = await this.findOne(orderId);
  order.status = OrderStatus.SHIPPED;
  await this.ordersRepository.save(order);
  
  // Notificar envío
  await this.notificationsService.sendOrderShipped(
    order, 
    user.email, 
    trackingNumber,
    carrier,
  );
}
```

### Gmail App Password

Para usar Gmail como SMTP, crear una contraseña de aplicación:

1. Ir a [Google Account Security](https://myaccount.google.com/security)
2. Activar verificación en 2 pasos
3. Ir a "App passwords"
4. Seleccionar "Mail" y "Other (Custom name)"
5. Copiar la contraseña generada de 16 caracteres
6. Usar esa contraseña en `MAIL_PASSWORD`

---

## 21. Inventario

### Tipos de Movimiento

```typescript
enum MovementType {
  // Entradas de stock
  PURCHASE = 'purchase',           // Compra de inventario
  RETURN = 'return',               // Devolución de cliente
  ADJUSTMENT_IN = 'adjustment_in', // Ajuste positivo manual
  TRANSFER_IN = 'transfer_in',     // Transferencia entre almacenes

  // Salidas de stock
  SALE = 'sale',                   // Venta completada
  RESERVATION = 'reservation',     // Reserva por orden pendiente
  ADJUSTMENT_OUT = 'adjustment_out', // Ajuste negativo manual
  DAMAGED = 'damaged',             // Productos dañados
  EXPIRED = 'expired',             // Productos vencidos
  TRANSFER_OUT = 'transfer_out',   // Transferencia entre almacenes

  // Liberación
  RELEASE = 'release',             // Liberación de reserva cancelada
}
```

### Endpoints

```bash
# Ajustar stock (Admin)
POST /inventory/adjust
Authorization: Bearer <admin_token>
{
  "productId": "uuid",        # o variantId
  "type": "purchase",
  "quantity": 50,
  "referenceNumber": "FAC-001",
  "notes": "Compra a proveedor X",
  "unitCost": 10.50
}

# Configurar alertas de bajo stock
POST /inventory/alerts
Authorization: Bearer <admin_token>
{
  "productId": "uuid",
  "lowStockThreshold": 10,      # Alerta cuando stock <= 10
  "criticalStockThreshold": 2,  # Crítico cuando stock <= 2
  "alertEnabled": true
}

# Obtener items con bajo stock
GET /inventory/low-stock
Authorization: Bearer <admin_token>

# Obtener stock de producto
GET /inventory/stock/product/:productId

# Obtener stock de variante
GET /inventory/stock/variant/:variantId

# Historial de movimientos
GET /inventory/movements/product/:productId?page=1&limit=20
GET /inventory/movements/variant/:variantId?page=1&limit=20

# Verificar disponibilidad (antes de checkout)
POST /inventory/check-availability
[
  { "productId": "uuid", "quantity": 2 },
  { "variantId": "uuid", "quantity": 1 }
]
```

### Respuesta de Low Stock

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Producto A",
      "sku": "SKU-001",
      "currentStock": 3,
      "threshold": 10,
      "type": "product",
      "isCritical": true
    },
    {
      "id": "uuid",
      "name": "Producto B - Talla M",
      "sku": "SKU-002-M",
      "currentStock": 8,
      "threshold": 10,
      "type": "variant",
      "isCritical": false
    }
  ]
}
```

### Flujo de Reserva de Stock

```
1. Cliente crea orden → reserveStock() → stock -= cantidad
2. Si pago exitoso → confirmSale() → movimiento registrado como SALE
3. Si orden cancelada → releaseStock() → stock += cantidad (RELEASE)
```

### Alertas Automáticas

Cuando el stock cae bajo el umbral configurado:
- Email enviado a `ADMIN_EMAIL`
- Máximo 1 alerta cada 24 horas por producto
- Distingue entre "bajo stock" y "crítico"

**Variable de entorno:**
```env
ADMIN_EMAIL=admin@example.com
```

### Entidades

```typescript
// InventoryMovement - Historial de cambios
@Entity('inventory_movements')
export class InventoryMovement {
  id: string;
  productId?: string;
  variantId?: string;
  type: MovementType;
  quantity: number;          // Positivo entradas, negativo salidas
  previousStock: number;
  newStock: number;
  orderId?: string;
  referenceNumber?: string;  // Factura, guía, etc.
  notes?: string;
  performedBy?: string;      // User ID
  unitCost?: number;
  createdAt: Date;
}

// StockAlert - Configuración de alertas
@Entity('stock_alerts')
export class StockAlert {
  id: string;
  productId?: string;
  variantId?: string;
  lowStockThreshold: number;
  criticalStockThreshold: number;
  alertEnabled: boolean;
  lastAlertSentAt?: Date;
  alertCount: number;
}
```

---

## 22. Testing

### Estructura de Tests

```
src/
├── auth/
│   ├── auth.service.spec.ts      # Unit tests del servicio
│   └── auth.controller.spec.ts   # Unit tests del controlador
test/
├── auth.e2e-spec.ts              # E2E tests
└── jest-e2e.json
```

### Unit Test Example

```typescript
// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(() => 'mock-token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should throw UserAlreadyExistsException if user exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UserAlreadyExistsException);
    });

    it('should create a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        id: '1',
        email: 'test@test.com',
      });
      mockUserRepository.save.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
      });

      const result = await service.register({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('id');
      expect(result.email).toBe('test@test.com');
    });
  });
});
```

### Ejecutar Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# E2E tests
pnpm test:e2e
```

---

## 23. Comandos Útiles

### Desarrollo

```bash
# Iniciar en modo desarrollo
pnpm start:dev

# Iniciar en modo debug
pnpm start:debug

# Build
pnpm build

# Iniciar producción
pnpm start:prod
```

### Linting y Formateo

```bash
# Lint
pnpm lint

# Format
pnpm format
```

### Base de Datos

```bash
# Migraciones
pnpm prisma:migrate

# Generar cliente
pnpm prisma:generate

# Prisma Studio
pnpm prisma:studio
```

### Docker

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

---

## Checklist de Desarrollo

Antes de cada commit, verificar:

- [ ] El código compila sin errores (`pnpm build`)
- [ ] Los tests pasan (`pnpm test`)
- [ ] No hay tipos `any` en el código
- [ ] Los errores usan excepciones de `src/common/exceptions/`
- [ ] Los DTOs tienen validaciones con mensajes en inglés
- [ ] Las funciones tienen máximo 20-30 líneas
- [ ] Los nombres son descriptivos
- [ ] No hay código duplicado
- [ ] El commit sigue la convención (`feat:`, `fix:`, etc.)

---

## Referencias

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [class-validator](https://github.com/typestack/class-validator)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Guidelines del Proyecto](../.github/guidelines.md)
