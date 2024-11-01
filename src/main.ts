import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  const documentConfig = new DocumentBuilder()
    .setTitle('ExHotel documentation')
    .setDescription("This is exhotel's APIs description")
    .setVersion('1.0')
    .addTag('exhotel')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('api', app, documentFactory);

  const port = configService.get('PORT');

  await app.listen(port);
}
bootstrap();
