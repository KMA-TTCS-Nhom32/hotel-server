import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { customSwaggerCss } from './common/utils/swagger.util';
import { ExposedEnumsDto } from './common/dtos/exposed-enums.dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware - Helmet sets various HTTP headers for security
  app.use(
    helmet({
      // Content Security Policy - prevents XSS attacks
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Swagger
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow for Swagger
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      // HTTP Strict Transport Security - forces HTTPS
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      // Prevent clickjacking
      frameguard: { action: 'deny' },
      // Prevent MIME type sniffing
      noSniff: true,
      // XSS filter
      xssFilter: true,
      // Hide X-Powered-By header
      hidePoweredBy: true,
    }),
  );

  const configService = app.get(ConfigService);

  app.setGlobalPrefix(configService.getOrThrow('API_PREFIX'), {
    exclude: ['/'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // CORS configuration - environment-based
  const allowedOrigins = configService.get<string>('CORS_ORIGINS');
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser clients (Postman, mobile app, curl)
      if (!origin) {
        return callback(null, true);
      }

      // Development: allow all
      if (!isProduction) {
        return callback(null, true);
      }

      // Production but no CORS_ORIGINS set → allow all
      if (!allowedOrigins) {
        return callback(null, true);
      }

      // Production with whitelist
      const whitelist = allowedOrigins.split(',').map((o) => o.trim());

      if (whitelist.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },

    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, Accept-Language',
    exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
  });

  const documentConfig = new DocumentBuilder()
    .setTitle('AHomeVilla documentation')
    .setDescription("This is AHomeVilla's APIs description")
    .setVersion('1.0')
    .addTag('AHomeVilla')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig, {
    extraModels: [ExposedEnumsDto],
  });

  const swaggerCustomOptions: SwaggerCustomOptions = {
    customSiteTitle: 'AHomeVilla RESTful API documentations',
    customCss: customSwaggerCss,
  };

  SwaggerModule.setup('docs', app, document, swaggerCustomOptions);

  const port = configService.get('PORT');

  await app.listen(port);
}
bootstrap();
