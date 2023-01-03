import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';

const config = new DocumentBuilder()
  .addBearerAuth({ type: 'http', scheme: 'bearer' })
  .setTitle('TEKANA eWallet API Docs')
  .setDescription('TEKANA eWallet API documentation')
  .setVersion('1.0.0')
  .addTag('Home')
  .addTag('Authentication')
  .addTag('Wallet')
  .addTag('Transactions')
  .build();

const customOptions: SwaggerCustomOptions = {
  customSiteTitle: 'TEKANA eWallet API Doc',
  swaggerOptions: {
    persistAuthorization: true,
  },
};

export const setupSwagger = (app: INestApplication): void => {
  const document = SwaggerModule.createDocument(app, config);
  return SwaggerModule.setup('api-docs', app, document, customOptions);
};
