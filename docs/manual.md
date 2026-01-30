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
10. [Testing](#10-testing)
11. [Comandos Útiles](#11-comandos-útiles)

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

## 10. Testing

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

## 11. Comandos Útiles

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
