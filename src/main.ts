import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

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
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const documentConfig = new DocumentBuilder()
    .setTitle('VVintage documentation')
    .setDescription("This is VVintage's APIs description")
    .setVersion('1.0')
    .addTag('VVintage')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('docs', app, documentFactory);

  const port = configService.get('PORT');

  await app.listen(port);

}
bootstrap();
