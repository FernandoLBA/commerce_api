import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { SecurityService, SecurityTestResult } from './security.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

/**
 * DTO para pruebas de seguridad
 */
class SecurityTestDto {
  input: string;
}

class PasswordTestDto {
  password: string;
}

class BruteForceTestDto {
  endpoint?: string;
  requests?: number;
}

/**
 * Security Controller
 *
 * Este controlador proporciona endpoints para probar y verificar
 * las medidas de seguridad implementadas en la API.
 *
 * ⚠️ IMPORTANTE: Este módulo está diseñado para pruebas de seguridad
 * controladas. En producción, estos endpoints deberían estar
 * protegidos o deshabilitados.
 */
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  /**
   * GET /security/report
   * Obtiene un reporte completo del estado de seguridad
   * Solo accesible para administradores
   */
  @Get('report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getSecurityReport() {
    return {
      success: true,
      data: this.securityService.getSecurityReport(),
    };
  }

  /**
   * GET /security/payloads
   * Obtiene payloads de prueba para diferentes tipos de ataques
   * Solo accesible para administradores
   */
  @Get('payloads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getTestPayloads() {
    return {
      success: true,
      data: this.securityService.getTestPayloads(),
    };
  }

  /**
   * POST /security/test/sql-injection
   * Prueba de detección de SQL Injection
   */
  @Post('test/sql-injection')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  testSqlInjection(@Body() dto: SecurityTestDto): {
    success: boolean;
    data: SecurityTestResult;
  } {
    return {
      success: true,
      data: this.securityService.testSqlInjection(dto.input),
    };
  }

  /**
   * POST /security/test/xss
   * Prueba de detección de XSS (Cross-Site Scripting)
   */
  @Post('test/xss')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  testXss(@Body() dto: SecurityTestDto): {
    success: boolean;
    data: SecurityTestResult;
  } {
    return {
      success: true,
      data: this.securityService.testXss(dto.input),
    };
  }

  /**
   * POST /security/test/path-traversal
   * Prueba de detección de Path Traversal
   */
  @Post('test/path-traversal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  testPathTraversal(@Body() dto: SecurityTestDto): {
    success: boolean;
    data: SecurityTestResult;
  } {
    return {
      success: true,
      data: this.securityService.testPathTraversal(dto.input),
    };
  }

  /**
   * POST /security/test/command-injection
   * Prueba de detección de Command Injection
   */
  @Post('test/command-injection')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  testCommandInjection(@Body() dto: SecurityTestDto): {
    success: boolean;
    data: SecurityTestResult;
  } {
    return {
      success: true,
      data: this.securityService.testCommandInjection(dto.input),
    };
  }

  /**
   * POST /security/test/password-strength
   * Prueba la fortaleza de una contraseña
   */
  @Post('test/password-strength')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  testPasswordStrength(@Body() dto: PasswordTestDto): {
    success: boolean;
    data: SecurityTestResult;
  } {
    return {
      success: true,
      data: this.securityService.testPasswordStrength(dto.password),
    };
  }

  /**
   * POST /security/test/all
   * Ejecuta todas las pruebas de seguridad en un input
   */
  @Post('test/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  runAllTests(@Body() dto: SecurityTestDto): {
    success: boolean;
    data: {
      input: string;
      results: SecurityTestResult[];
      summary: {
        total: number;
        passed: number;
        failed: number;
      };
    };
  } {
    const results = this.securityService.runAllTests(dto.input);
    const passed = results.filter((r) => r.passed).length;

    return {
      success: true,
      data: {
        input: dto.input,
        results,
        summary: {
          total: results.length,
          passed,
          failed: results.length - passed,
        },
      },
    };
  }

  /**
   * GET /security/test/rate-limit
   * Endpoint para probar el rate limiting
   * Tiene un límite muy bajo (3 requests por minuto) para demostración
   */
  @Get('test/rate-limit')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  testRateLimit(@Query('attempt') attempt?: string) {
    return {
      success: true,
      message: 'Request exitoso',
      data: {
        attempt: attempt || '1',
        timestamp: new Date(),
        info: 'Este endpoint tiene un límite de 3 requests por minuto para demostración',
      },
    };
  }

  /**
   * GET /security/test/rate-limit-bypass
   * Endpoint sin rate limiting para comparación
   */
  @Get('test/no-rate-limit')
  @SkipThrottle()
  testNoRateLimit() {
    return {
      success: true,
      message: 'Request sin rate limiting',
      data: {
        timestamp: new Date(),
        info: 'Este endpoint NO tiene rate limiting (SkipThrottle)',
      },
    };
  }

  /**
   * POST /security/test/validation
   * Prueba el ValidationPipe con diferentes inputs maliciosos
   */
  @Post('test/validation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  testValidation(
    @Body() body: Record<string, any>,
  ): { success: boolean; data: Record<string, any> } {
    // Si llega aquí, el ValidationPipe no bloqueó el request
    return {
      success: true,
      data: {
        message: 'Request pasó la validación',
        receivedBody: body,
        timestamp: new Date(),
        note: 'El ValidationPipe con whitelist eliminará propiedades no definidas en el DTO',
      },
    };
  }

  /**
   * GET /security/headers
   * Muestra los headers de seguridad configurados por Helmet
   */
  @Get('headers')
  getSecurityHeaders() {
    return {
      success: true,
      data: {
        message: 'Headers de seguridad configurados por Helmet',
        headers: {
          'Content-Security-Policy':
            "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; script-src 'self'",
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'X-XSS-Protection': '0',
          'Strict-Transport-Security':
            'max-age=15552000; includeSubDomains',
          'Cross-Origin-Resource-Policy': 'cross-origin',
        },
        note: 'Estos headers son añadidos automáticamente por Helmet a cada response',
      },
    };
  }

  /**
   * GET /security/cors-test
   * Endpoint para probar CORS desde diferentes orígenes
   */
  @Get('cors-test')
  @SkipThrottle()
  testCors() {
    return {
      success: true,
      data: {
        message: 'CORS test endpoint',
        allowedOrigins: process.env.CORS_ORIGINS?.split(',') || [
          'http://localhost:3000',
          'http://localhost:4200',
          'http://localhost:5173',
        ],
        timestamp: new Date(),
      },
    };
  }
}
