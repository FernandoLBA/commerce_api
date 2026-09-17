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
 * DTO for security tests
 */
class SecurityTestDto {
  input: string;
}

class PasswordTestDto {
  password: string;
}

// class BruteForceTestDto {
//   endpoint?: string;
//   requests?: number;
// }

/**
 * Security Controller
 *
 * This controller provides endpoints to test and verify
 * the security measures implemented in the API.
 *
 * ⚠️ IMPORTANT: This module is designed for controlled security
 * testing. In production, these endpoints should be
 * protected or disabled.
 */
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  /**
   * GET /security/report
   * Retrieves a full report of the security status
   * Accessible only to administrators
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
   * Retrieves test payloads for different types of attacks
   * Accessible only to administrators
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
   * SQL Injection detection test
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
   * XSS (Cross-Site Scripting) detection test
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
   * Path Traversal detection test
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
   * Command Injection detection test
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
   * Tests the strength of a password
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
   * Runs all security tests on an input
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
   * Endpoint to test rate limiting
   * Has a very low limit (3 requests per minute) for demonstration purposes
   */
  @Get('test/rate-limit')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  testRateLimit(@Query('attempt') attempt?: string) {
    return {
      success: true,
      message: 'Successful request',
      data: {
        attempt: attempt || '1',
        timestamp: new Date(),
        info: 'This endpoint has a limit of 3 requests per minute for demonstration purposes',
      },
    };
  }

  /**
   * GET /security/test/rate-limit-bypass
   * Endpoint without rate limiting for comparison
   */
  @Get('test/no-rate-limit')
  @SkipThrottle()
  testNoRateLimit() {
    return {
      success: true,
      message: 'Request without rate limiting',
      data: {
        timestamp: new Date(),
        info: 'This endpoint has NO rate limiting (SkipThrottle)',
      },
    };
  }

  /**
   * POST /security/test/validation
   * Tests the ValidationPipe with different malicious inputs
   */
  @Post('test/validation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  testValidation(@Body() body: Record<string, unknown>): {
    success: boolean;
    data: Record<string, unknown>;
  } {
    // If it reaches here, the ValidationPipe did not block the request
    return {
      success: true,
      data: {
        message: 'Request passed validation',
        receivedBody: body,
        timestamp: new Date(),
        note: 'The ValidationPipe with whitelist will strip properties not defined in the DTO',
      },
    };
  }

  /**
   * GET /security/headers
   * Shows the security headers configured by Helmet
   */
  @Get('headers')
  getSecurityHeaders() {
    return {
      success: true,
      data: {
        message: 'Security headers configured by Helmet',
        headers: {
          'Content-Security-Policy':
            "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; script-src 'self'",
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'X-XSS-Protection': '0',
          'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
          'Cross-Origin-Resource-Policy': 'cross-origin',
        },
        note: 'These headers are automatically added by Helmet to every response',
      },
    };
  }

  /**
   * GET /security/cors-test
   * Endpoint to test CORS from different origins
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
