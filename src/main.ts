import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import {
  GlobalExceptionFilter,
  ResponseInterceptor,
  securityConfig,
} from './common';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: NODE_ENV === 'production' ? ['error'] : ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');

  // Helmet - HTTP header protection
  app.use(helmet(securityConfig.helmet));

  // CORS - Allowed origin configuration
  app.enableCors(securityConfig.cors);

  // Global validation pipe with security enhancements
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips undecorated properties
      forbidNonWhitelisted: true, // Rejects requests with extra properties
      transform: true, // Automatically transforms types
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: NODE_ENV === 'production', // Hides details in production
    }),
  );

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Trust proxy for rate limiting behind a reverse proxy
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  await app.listen(PORT, '0.0.0.0').then(() => {
    console.log(`🚀 Application is running on: http://localhost:${PORT}`);
    console.log(`📚 API prefix: /api`);
    console.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
  });
}

void bootstrap();
