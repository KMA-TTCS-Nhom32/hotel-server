import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { customSwaggerCss } from './common/utils/swagger.util';
import { ExposedEnumsDto } from './common/dtos/exposed-enums.dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Updated CORS configuration
  app.enableCors({
    // For development (accepts all origins):
    origin: true,

    // OR for production (more secure):
    // origin: ['http://localhost:3000', 'https://your-production-domain.com'],

    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, Accept-Language',
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
