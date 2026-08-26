import { Injectable } from '@nestjs/common';

export interface SecurityTestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface BruteForceTestResult {
  totalRequests: number;
  successfulRequests: number;
  blockedRequests: number;
  timeElapsed: number;
  rateLimit: {
    detected: boolean;
    blockedAt?: number;
  };
}

@Injectable()
export class SecurityService {
  /**
   * Simula un ataque de inyección SQL para verificar que está protegido
   */
  testSqlInjection(input: string): SecurityTestResult {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
      /('|")\s*(OR|AND)\s*('|"|\d)/i,
      /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
      /--\s*$/,
      /\/\*.*\*\//,
    ];

    const detected = sqlPatterns.some((pattern) => pattern.test(input));

    return {
      testName: 'SQL Injection Test',
      passed: !detected,
      message: detected
        ? '⚠️ Posible inyección SQL detectada - El input sería sanitizado'
        : '✅ Input seguro - No se detectaron patrones de SQL injection',
      details: {
        input,
        patternsChecked: sqlPatterns.length,
        maliciousPatternFound: detected,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Simula un ataque XSS para verificar que está protegido
   */
  testXss(input: string): SecurityTestResult {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<svg\s+onload/gi,
      /document\.(cookie|location|write)/gi,
      /eval\s*\(/gi,
    ];

    const detected = xssPatterns.some((pattern) => pattern.test(input));

    return {
      testName: 'XSS (Cross-Site Scripting) Test',
      passed: !detected,
      message: detected
        ? '⚠️ Posible ataque XSS detectado - El input sería sanitizado'
        : '✅ Input seguro - No se detectaron patrones de XSS',
      details: {
        input,
        patternsChecked: xssPatterns.length,
        maliciousPatternFound: detected,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Simula un ataque de Path Traversal
   */
  testPathTraversal(input: string): SecurityTestResult {
    const pathPatterns = [
      /\.\.\//g,
      /\.\.%2f/gi,
      /\.\.%5c/gi,
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e\//gi,
      /\.\.%252f/gi,
    ];

    const detected = pathPatterns.some((pattern) => pattern.test(input));

    return {
      testName: 'Path Traversal Test',
      passed: !detected,
      message: detected
        ? '⚠️ Posible ataque de Path Traversal detectado'
        : '✅ Input seguro - No se detectaron patrones de Path Traversal',
      details: {
        input,
        patternsChecked: pathPatterns.length,
        maliciousPatternFound: detected,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Simula un ataque de Command Injection
   */
  testCommandInjection(input: string): SecurityTestResult {
    const commandPatterns = [
      /[;&|`$]/g,
      /\$\(/g,
      /`.*`/g,
      /\|\|/g,
      /&&/g,
      /\b(cat|ls|rm|mv|cp|wget|curl|bash|sh|nc|ncat)\b/gi,
      />\s*\/?(etc|tmp|var)/gi,
    ];

    const detected = commandPatterns.some((pattern) => pattern.test(input));

    return {
      testName: 'Command Injection Test',
      passed: !detected,
      message: detected
        ? '⚠️ Posible Command Injection detectado'
        : '✅ Input seguro - No se detectaron patrones de Command Injection',
      details: {
        input,
        patternsChecked: commandPatterns.length,
        maliciousPatternFound: detected,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Verifica la fortaleza de una contraseña
   */
  testPasswordStrength(password: string): SecurityTestResult {
    const checks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommonPatterns: !/(password|123456|qwerty|admin)/i.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const maxScore = Object.keys(checks).length;
    const percentage = Math.round((score / maxScore) * 100);

    let strength: string;
    if (percentage >= 100) strength = 'Muy fuerte';
    else if (percentage >= 80) strength = 'Fuerte';
    else if (percentage >= 60) strength = 'Moderada';
    else if (percentage >= 40) strength = 'Débil';
    else strength = 'Muy débil';

    return {
      testName: 'Password Strength Test',
      passed: percentage >= 60,
      message: `Fortaleza de contraseña: ${strength} (${percentage}%)`,
      details: {
        score: `${score}/${maxScore}`,
        percentage,
        strength,
        checks,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Ejecuta todas las pruebas de seguridad en un input
   */
  runAllTests(input: string): SecurityTestResult[] {
    return [
      this.testSqlInjection(input),
      this.testXss(input),
      this.testPathTraversal(input),
      this.testCommandInjection(input),
    ];
  }

  /**
   * Genera un reporte de seguridad del sistema
   */
  getSecurityReport(): Record<string, any> {
    return {
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      security: {
        helmet: {
          enabled: true,
          features: [
            'Content-Security-Policy',
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection',
            'Strict-Transport-Security',
          ],
        },
        cors: {
          enabled: true,
          origins: process.env.CORS_ORIGINS?.split(',') || [
            'localhost:3000',
            'localhost:4200',
          ],
        },
        rateLimiting: {
          enabled: true,
          globalLimit: process.env.THROTTLE_LIMIT || 100,
          authLimit: process.env.THROTTLE_AUTH_LIMIT || 5,
          windowMs: process.env.THROTTLE_TTL || 60000,
        },
        validation: {
          enabled: true,
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        },
        authentication: {
          type: 'JWT',
          expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        },
        passwordHashing: {
          algorithm: 'bcrypt',
          saltRounds: 10,
        },
      },
      recommendations: this.getSecurityRecommendations(),
    };
  }

  /**
   * Genera recomendaciones de seguridad basadas en la configuración actual
   */
  private getSecurityRecommendations(): string[] {
    const recommendations: string[] = [];

    if (process.env.NODE_ENV !== 'production') {
      recommendations.push(
        '⚠️ Configurar NODE_ENV=production en entorno de producción',
      );
    }

    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.includes('change_this')
    ) {
      recommendations.push(
        '🔴 CRÍTICO: Cambiar JWT_SECRET por una clave segura de al menos 32 caracteres',
      );
    }

    if (!process.env.CORS_ORIGINS) {
      recommendations.push(
        '⚠️ Configurar CORS_ORIGINS con dominios específicos en producción',
      );
    }

    if (parseInt(process.env.THROTTLE_AUTH_LIMIT || '5') > 10) {
      recommendations.push(
        '⚠️ Considerar reducir THROTTLE_AUTH_LIMIT para mayor seguridad',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Configuración de seguridad correcta');
    }

    return recommendations;
  }

  /**
   * Genera payloads de prueba para diferentes tipos de ataques
   */
  getTestPayloads(): Record<string, string[]> {
    return {
      sqlInjection: [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT * FROM users --",
        "admin'--",
        '1; DELETE FROM products',
      ],
      xss: [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(document.cookie)',
        '<svg onload="alert(1)">',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
      ],
      pathTraversal: [
        '../../../etc/passwd',
        '..%2f..%2f..%2fetc/passwd',
        '....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f',
        '..\\..\\..\\windows\\system32',
      ],
      commandInjection: [
        '; ls -la',
        '| cat /etc/passwd',
        '`whoami`',
        '$(cat /etc/passwd)',
        '&& rm -rf /',
      ],
      weakPasswords: ['password', '123456', 'admin123', 'qwerty', 'abc123'],
    };
  }
}
