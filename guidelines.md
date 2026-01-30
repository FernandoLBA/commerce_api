# Guidelines de Desarrollo

Estas son las reglas y buenas prácticas que debe seguir todo el código del proyecto.

## 0. Código Limpio, Legible y Arquitectura Escalable

El proyecto debe mantener código limpio, legible, mantenible, testeable y escalable en todo momento.

### Principios Fundamentales:

**Código Limpio (Clean Code):**
- Funciones pequeñas y con una sola responsabilidad (principio SRP)
- Nombres significativos que revelen la intención
- Máximo 20-30 líneas por función
- Evitar comentarios innecesarios (el código debe ser autoexplicativo)
- Sin código muerto o comentado

**Legibilidad:**
- Indentación consistente (2 espacios)
- Líneas máximo 100 caracteres
- Espacios en blanco estratégicos para separar secciones
- Utilizar constantes nombradas en lugar de números/strings mágicos
- Nombres de variables, funciones y clases autodescriptivos

**Mantenibilidad:**
- Bajo acoplamiento entre módulos
- Alto cohesión dentro de módulos
- Interfaces claras y estables
- Documentación de cambios importantes
- Control de versiones con commits descriptivos

**Escalabilidad:**
- Modular y basado en características (feature-based structure)
- Preparado para crecer sin refactorización mayor
- Servicios reutilizables
- Caché implementado donde sea necesario
- Lazy loading de recursos pesados

**Testabilidad:**
- Dependencias inyectables (no hardcodeadas)
- Métodos con responsabilidad única
- Evitar side effects no controlados
- Interfaces para las dependencias
- Cobertura mínima 80% en lógica crítica

**Arquitectura:**
```
PRINCIPIOS:
├── DRY (Don't Repeat Yourself)
├── KISS (Keep It Simple, Stupid)
├── YAGNI (You Aren't Gonna Need It)
├── SOLID (Single, Open/Closed, Liskov, Interface Segregation, Dependency Inversion)
└── Design Patterns (Factory, Strategy, Dependency Injection, etc.)
```

---

## 1. No Repetir Código (DRY - Don't Repeat Yourself)

- **Extraer lógica común:** Si encuentras código duplicado en más de un lugar, crea una función o servicio reutilizable.
- **Crear utilidades compartidas:** Coloca funciones comunes en archivos de utilidades (`src/common/utils/`).
- **Usar decoradores y middlewares:** Aprovecha los decoradores de NestJS para evitar repetición de lógica.

**❌ Incorrecto:**
```typescript
@Post('users')
async createUser(@Body() data: CreateUserDto) {
  if (!data.email) throw new Error('Email requerido');
  if (!data.password) throw new Error('Password requerido');
  return await this.userService.create(data);
}

@Post('products')
async createProduct(@Body() data: CreateProductDto) {
  if (!data.email) throw new Error('Email requerido');
  if (!data.password) throw new Error('Password requerido');
  return await this.productService.create(data);
}
```

**✅ Correcto:**
```typescript
// common/validators/email-password.validator.ts
export function validateEmailPassword(data: any) {
  if (!data.email) throw new Error('Email requerido');
  if (!data.password) throw new Error('Password requerido');
}

@Post('users')
async createUser(@Body() data: CreateUserDto) {
  validateEmailPassword(data);
  return await this.userService.create(data);
}
```

---

## 2. No Usar `any` en TypeScript

- **Extraer lógica común:** Si encuentras código duplicado en más de un lugar, crea una función o servicio reutilizable.
- **Crear utilidades compartidas:** Coloca funciones comunes en archivos de utilidades (`src/common/utils/`).
- **Usar decoradores y middlewares:** Aprovecha los decoradores de NestJS para evitar repetición de lógica.

**❌ Incorrecto:**
```typescript
@Post('users')
async createUser(@Body() data: CreateUserDto) {
  if (!data.email) throw new Error('Email requerido');
  if (!data.password) throw new Error('Password requerido');
  return await this.userService.create(data);
}

@Post('products')
async createProduct(@Body() data: CreateProductDto) {
  if (!data.email) throw new Error('Email requerido');
  if (!data.password) throw new Error('Password requerido');
  return await this.productService.create(data);
}
```

**✅ Correcto:**
```typescript
// common/validators/email-password.validator.ts
export function validateEmailPassword(data: any) {
  if (!data.email) throw new Error('Email requerido');
  if (!data.password) throw new Error('Password requerido');
}

@Post('users')
async createUser(@Body() data: CreateUserDto) {
  validateEmailPassword(data);
  return await this.userService.create(data);
}
```

---

## 2. No Usar `any` en TypeScript

- **Siempre utilizar tipos específicos:** Usa interfaces, tipos o tipos genéricos en lugar de `any`.
- **Crear DTOs para datos externos:** Define la estructura esperada en DTOs o interfaces.
- **Usar `unknown` si es necesario:** Si realmente no sabes el tipo, usa `unknown` y realiza type guards.

**❌ Incorrecto:**
```typescript
async getData(data: any): any {
  return data.transform();
}

const result: any = await this.service.getData(input);
```

**✅ Correcto:**
```typescript
interface DataInput {
  id: string;
  value: number;
}

interface DataOutput {
  result: string;
}

async getData(data: DataInput): Promise<DataOutput> {
  return { result: data.value.toString() };
}
```

---

## 3. No Crear Números o Cadenas Mágicas

- **Usar constantes:** Define todos los valores fijos en archivos de configuración o constantes.
- **Nombrar constantes claramente:** El nombre debe explicar qué representa.
- **Centralizar en enums o configuración:** Especialmente para valores que se repiten.

**❌ Incorrecto:**
```typescript
async createUser(user: CreateUserDto) {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.role = 'user';
  user.status = 1;
  return this.userRepository.save(user);
}

if (response.code === 200) {
  // success
}

setTimeout(() => {
  // refresh token
}, 3600000);
```

**✅ Correcto:**
```typescript
// common/constants/auth.constants.ts
export const AUTH_CONSTANTS = {
  BCRYPT_ROUNDS: 10,
  DEFAULT_USER_ROLE: 'user',
  TOKEN_EXPIRATION_MS: 3600000, // 1 hora
  USER_STATUS: {
    ACTIVE: 1,
    INACTIVE: 0,
    SUSPENDED: 2,
  },
} as const;

export const HTTP_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

// En el servicio:
async createUser(user: CreateUserDto) {
  const hashedPassword = await bcrypt.hash(
    user.password,
    AUTH_CONSTANTS.BCRYPT_ROUNDS,
  );
  user.role = AUTH_CONSTANTS.DEFAULT_USER_ROLE;
  user.status = AUTH_CONSTANTS.USER_STATUS.ACTIVE;
  return this.userRepository.save(user);
}

if (response.code === HTTP_STATUS.SUCCESS) {
  // success
}

setTimeout(() => {
  // refresh token
}, AUTH_CONSTANTS.TOKEN_EXPIRATION_MS);
```

---

## 4. Otras Buenas Prácticas

### 4.1 Estructura de Carpetas

```
src/
├── auth/
│   ├── controllers/
│   ├── services/
│   ├── entities/
│   ├── dto/
│   ├── guards/
│   ├── strategies/
│   └── auth.module.ts
├── common/
│   ├── constants/
│   ├── decorators/
│   ├── exceptions/
│   ├── filters/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
├── config/
├── database/
│   └── migrations/
└── app.module.ts
```

### 4.2 Nombres Descriptivos

- **Variables y funciones:** Usar camelCase y nombres que describan claramente qué hacen.
- **Clases:** Usar PascalCase.
- **Constantes:** Usar UPPER_SNAKE_CASE.

**❌ Incorrecto:**
```typescript
const x = 5;
const d = new Date();
function process() {}
```

**✅ Correcto:**
```typescript
const maxRetries = 5;
const createdAt = new Date();
function validateEmail() {}
```

### 4.3 Error Handling

- **Crear excepciones personalizadas:** Usa `HttpException` o crea custom exceptions.
- **Loguear errores:** Siempre registra los errores para debugging.
- **Mensajes descriptivos:** El mensaje de error debe indicar qué salió mal.

**❌ Incorrecto:**
```typescript
throw new Error('Error');
```

**✅ Correcto:**
```typescript
throw new BadRequestException('El email ya está registrado en el sistema');
```

### 4.4 Documentación

- **Comentar lógica compleja:** Los comentarios deben explicar el "por qué", no el "qué".
- **Usar JSDoc en funciones públicas:** Documenta parámetros y return types.
- **README y documentación:** Mantener docs actualizadas.

**✅ Correcto:**
```typescript
/**
 * Valida si el email es único en la base de datos
 * @param email - Email a validar
 * @returns true si el email es único, false si ya existe
 */
async isEmailUnique(email: string): Promise<boolean> {
  const user = await this.userRepository.findOne({ where: { email } });
  return !user;
}
```

### 4.5 Testing

- **Escribir tests para lógica crítica:** Especialmente en servicios.
- **Usar descripciones claras:** Los nombres de los tests deben explicar qué se está probando.
- **Cobertura mínima del 80%:** Apuntar a una cobertura alta pero realista.

**✅ Correcto:**
```typescript
describe('AuthService', () => {
  it('should hash password with bcrypt', async () => {
    const result = await authService.hashPassword('password123');
    expect(result).not.toBe('password123');
  });
});
```

### 4.6 Enviroment Variables

- **No hardcodear valores sensibles:** Usar `.env` para configuraciones.
- **Validar variables al iniciar:** Verificar que existan todas las variables necesarias.
- **Documentar variables requeridas:** Crear `.env.example`.

### 4.7 Async/Await

- **Preferir async/await sobre Promises:** Es más legible.
- **Usar try/catch para manejo de errores:** Evita `.catch()` cuando sea posible.
- **No olvidar `await`:** Asegúrate de usar await con promesas.

**❌ Incorrecto:**
```typescript
this.userService.create(data); // Olvida await
```

**✅ Correcto:**
```typescript
await this.userService.create(data);
```

### 4.8 Inyección de Dependencias

- **Usar el sistema de inyección de NestJS:** No instanciar servicios manualmente.
- **Declarar en constructor:** Inyectar dependencias en el constructor.

**✅ Correcto:**
```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService,
  ) {}
}
```

### 4.9 Validación

- **Usar class-validator:** Para validar DTOs.
- **Validación en entrada:** Valida datos externos antes de procesarlos.

**✅ Correcto:**
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### 4.10 Performance

- **Evitar N+1 queries:** Usar `leftJoinAndSelect` en TypeORM.
- **Usar paginación:** En endpoints que devuelven listas.
- **Implementar caching:** Para datos que cambian poco.
- **Lazy loading:** Cargar datos solo cuando sea necesario.

---

## Checklist Antes de Hacer Commit

- [ ] Código limpio y legible (funciones pequeñas, nombres significativos)
- [ ] Arquitectura escalable y mantenible
- [ ] Todo el código es testeable
- [ ] No hay código repetido
- [ ] No hay tipos `any`
- [ ] No hay números/cadenas mágicas
- [ ] Todos los tests pasan
- [ ] Cobertura de tests > 80%
- [ ] Nombres descriptivos en variables/funciones
- [ ] Error handling apropiado
- [ ] Documentación actualizada
- [ ] Variables de entorno en .env
- [ ] Código formateado (eslint + prettier)
- [ ] Máximo 100 caracteres por línea
- [ ] Funciones con máximo 20-30 líneas
- [ ] SOLID principles aplicados

---

## Recursos

- [NestJS Best Practices](https://docs.nestjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Clean Code Principles](https://en.wikipedia.org/wiki/Code_smell)
