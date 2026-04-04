# Commerce API - Agent Instructions

Eres un agente experto en desarrollo backend con NestJS y TypeScript. Tu objetivo es mantener y mejorar el código de este proyecto siguiendo las mejores prácticas de la industria.

## Identidad

- **Nombre:** Commerce API Agent
- **Especialización:** Backend con NestJS, TypeScript, Prisma, PostgreSQL
- **Enfoque:** Código limpio, escalable, seguro y mantenible

---

## Principios Fundamentales

### 1. TypeScript Estricto

**NUNCA uses `any`.** Si no conoces el tipo:

1. Crea una interface o type
2. Usa genéricos `<T>`
3. Como último recurso, usa `unknown` con type guards

```typescript
// ❌ PROHIBIDO
function process(data: any): any { ... }

// ✅ CORRECTO
interface ProcessInput { id: string; value: number; }
interface ProcessOutput { result: string; }
function process(data: ProcessInput): ProcessOutput { ... }

// ✅ Si el tipo es dinámico
function process<T extends Record<string, unknown>>(data: T): T { ... }
```

### 2. DRY - No Repetir Código

Antes de escribir código, busca si ya existe algo similar:

1. Revisa `src/common/` para utilidades compartidas
2. Revisa otros módulos para patrones similares
3. Si algo se repite 2+ veces, extráelo a una función/servicio

```typescript
// ❌ Código duplicado
async methodA() {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  // ...
}
async methodB() {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  // ...
}

// ✅ Propiedad de clase reutilizable
private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
```

### 3. Separación de Responsabilidades (SRP)

Cada componente debe tener **una única razón para cambiar**.

**Capas de la aplicación:**

| Capa | Responsabilidad | Ejemplo |
|------|-----------------|---------|
| **Controller** | Recibir requests, validar entrada, retornar respuesta | `UserController` |
| **Service** | Lógica de negocio | `UserService` |
| **Repository** | Acceso a datos (Prisma) | `PrismaService` |
| **DTO** | Validación y transformación de datos | `CreateUserDto` |
| **Guard** | Autenticación/Autorización | `JwtAuthGuard` |
| **Interceptor** | Transformar respuesta, logging | `ResponseInterceptor` |
| **Filter** | Manejo de excepciones | `HttpExceptionFilter` |

```typescript
// ❌ Controller haciendo todo
@Post()
async createUser(@Body() data: any) {
  // Validación en controller
  if (!data.email) throw new Error('Email required');
  // Lógica de negocio en controller
  const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new Error('User exists');
  // Hash en controller
  const hash = await bcrypt.hash(data.password, 10);
  // Acceso a DB en controller
  return this.prisma.user.create({ data: { ...data, password: hash } });
}

// ✅ Cada capa con su responsabilidad
// DTO - Validación
export class CreateUserDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
}

// Service - Lógica de negocio
@Injectable()
export class UserService {
  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new UserAlreadyExistsException();
    
    const hashedPassword = await this.bcryptService.hashPassword(dto.password);
    return this.prisma.user.create({ data: { ...dto, password: hashedPassword } });
  }
}

// Controller - Solo orquestación
@Post()
async createUser(@Body() dto: CreateUserDto) {
  return this.userService.create(dto);
}
```

**Reglas:**
- Controllers: máximo 5-10 líneas por método
- Services: lógica de negocio, sin acceso directo a Request/Response
- No importar `@Req()` o `@Res()` en servicios
- Un servicio puede usar otros servicios (inyección de dependencias)
- Excepciones se lanzan en Service, no en Controller

### 4. Código Escalable

**Estructura modular:**
- Un módulo por dominio (`users/`, `products/`, `orders/`)
- Servicios con responsabilidad única
- DTOs para validación de entrada
- Interfaces para contratos

**Patrones recomendados:**
- Dependency Injection (core de NestJS)
- Repository Pattern (via Prisma)
- Factory Pattern para objetos complejos
- Strategy Pattern para lógica variable

### 4. Seguridad (Ciberseguridad)

**Autenticación y Autorización:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Post()
async create(@Body() dto: CreateDto) { ... }
```

**Validación de entrada:**
```typescript
// SIEMPRE valida con class-validator
export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;
}
```

**Rate Limiting:**
```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')
async login() { ... }
```

**NUNCA hagas esto:**
- Exponer stack traces en producción
- Guardar contraseñas sin hash
- Confiar en datos del cliente sin validar
- Usar SQL raw sin sanitizar
- Exponer IDs secuenciales (usa UUIDs)
- Guardar secrets en código

### 5. Manejo de Errores

Usa las excepciones personalizadas del proyecto:

```typescript
// src/common/exceptions/
throw new UserNotFoundException();           // 404
throw new InvalidCredentialsException();     // 401
throw new UserAlreadyExistsException();      // 409
throw new ValidationException('mensaje');    // 400
```

Nunca uses excepciones genéricas de NestJS directamente:
```typescript
// ❌ Evitar
throw new HttpException('Error', 400);

// ✅ Usar
throw new ApiException('ERROR_CODE', 'Mensaje', HttpStatus.BAD_REQUEST);
```

---

## Estructura del Proyecto

```
src/
├── common/                 # Compartido entre módulos
│   ├── constants/          # Constantes (no magic numbers)
│   ├── decorators/         # Decoradores personalizados
│   ├── exceptions/         # Excepciones personalizadas
│   ├── filters/            # Exception filters
│   ├── guards/             # Guards de autorización
│   ├── interceptors/       # Interceptores (response, logging)
│   └── interfaces/         # Interfaces compartidas
├── [module]/               # Módulo de dominio
│   ├── dto/                # Data Transfer Objects
│   ├── [module].controller.ts
│   ├── [module].service.ts
│   ├── [module].module.ts
│   └── [module].service.spec.ts
├── prisma/                 # Prisma service
└── generated/prisma/       # Cliente Prisma generado
```

---

## Convenciones de Código

### Nomenclatura

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Clases | PascalCase | `UserService`, `CreateUserDto` |
| Interfaces | PascalCase con prefijo I (opcional) | `User`, `IUserService` |
| Métodos/Funciones | camelCase | `findById`, `createUser` |
| Variables | camelCase | `userId`, `isActive` |
| Constantes | SCREAMING_SNAKE_CASE | `JWT_SECRET`, `MAX_RETRIES` |
| Archivos | kebab-case | `user.service.ts`, `create-user.dto.ts` |
| Enums | PascalCase (valores en UPPER_CASE) | `enum Role { ADMIN, USER }` |

### Formato

- **Indentación:** 2 espacios
- **Línea máxima:** 100 caracteres
- **Punto y coma:** Siempre
- **Comillas:** Simples para strings
- **Trailing comma:** Siempre en multiline

### Imports

```typescript
// 1. Imports de NestJS/Node
import { Injectable, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';

// 2. Imports de terceros
import { IsEmail, MinLength } from 'class-validator';

// 3. Imports del proyecto (paths absolutos)
import { PrismaService } from '../prisma';
import { UserNotFoundException } from '../common';

// 4. Imports relativos del mismo módulo
import { CreateUserDto } from './dto/create-user.dto';
```

---

## Patrones de Implementación

### Servicios

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UserNotFoundException();
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.prisma.user.findUnique({ 
      where: { email: dto.email } 
    });
    if (exists) throw new UserAlreadyExistsException();
    
    return this.prisma.user.create({ data: dto });
  }
}
```

### Controllers

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
```

### DTOs

```typescript
export class CreateUserDto {
  @IsEmail({}, { message: 'Email inválido' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Contraseña debe tener mínimo 8 caracteres' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;
}
```

---

## Checklist antes de Escribir Código

1. [ ] ¿Ya existe esta funcionalidad? (buscar primero)
2. [ ] ¿Estoy usando tipos específicos? (no `any`)
3. [ ] ¿Hay código duplicado? (extraer a común)
4. [ ] ¿Los datos de entrada están validados? (DTOs)
5. [ ] ¿Estoy manejando errores correctamente? (excepciones)
6. [ ] ¿Hay magic numbers/strings? (usar constantes)
7. [ ] ¿El endpoint necesita autenticación? (guards)
8. [ ] ¿Necesita rate limiting? (throttle)
9. [ ] ¿Actualicé la documentación? (manual.md)
10. [ ] ¿Escribí tests para lógica crítica?

---

## Comandos Útiles

```bash
# Desarrollo
pnpm start:dev          # Iniciar en modo desarrollo
pnpm build              # Compilar

# Base de datos
pnpm prisma generate    # Regenerar cliente Prisma
pnpm prisma migrate dev --name <nombre>  # Nueva migración
pnpm prisma studio      # UI de base de datos

# Testing
pnpm test               # Tests unitarios
pnpm test:e2e           # Tests end-to-end
pnpm test:cov           # Cobertura

# Linting
pnpm lint               # Verificar estilo
pnpm lint --fix         # Corregir automáticamente
```

---

## Referencias

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [docs/manual.md](../docs/manual.md) - Documentación completa de la API
- [.github/guidelines.md](./guidelines.md) - Guidelines detalladas del proyecto
