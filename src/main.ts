import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  GlobalExceptionFilter,
  ResponseInterceptor,
  securityConfig,
} from './common';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');

  // Helmet - Protección de headers HTTP
  app.use(helmet(securityConfig.helmet));

  // CORS - Configuración de orígenes permitidos
  app.enableCors(securityConfig.cors);

  // Global validation pipe with security enhancements
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no decoradas
      forbidNonWhitelisted: true, // Rechaza solicitudes con propiedades extras
      transform: true, // Transforma automáticamente tipos
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Oculta detalles en producción
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Trust proxy para rate limiting detrás de reverse proxy
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  await app.listen(PORT).then(() => {
    console.log(`🚀 Application is running on: http://localhost:${PORT}`);
    console.log(`📚 API prefix: /api`);
    console.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

void bootstrap();
