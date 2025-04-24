import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors();

  // Compression
  app.use(compression());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        console.log('Validation Errors:', JSON.stringify(errors, null, 2));
        const formattedErrors = errors.map(error => ({
          property: error.property,
          value: error.value,
          constraints: error.constraints,
          children: error.children
        }));
        console.log('Formatted Validation Errors:', JSON.stringify(formattedErrors, null, 2));
        return new BadRequestException({
          message: errors.map(error => Object.values(error.constraints || {})).flat(),
          details: formattedErrors
        });
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('CurioPay API')
    .setDescription(`
      The CurioPay API provides a comprehensive suite of endpoints for managing personal finances.
      
      ## Features
      - User Authentication & Authorization
      - Expense Management
      - Income Tracking
      - Category Management
      - Multi-factor Authentication
      - Data Export
      - Newsletter Management
      
      ## Authentication
      Most endpoints require JWT authentication. Include the JWT token in the Authorization header:
      \`\`\`
      Authorization: Bearer <your_jwt_token>
      \`\`\`

      ## Getting Started
      1. Register a new account using POST /auth/register
      2. Login using POST /auth/login to get your JWT token
      3. Include the token in subsequent requests using the Authorization header
      4. Token expires in 24 hours by default

      ## Newsletter Operations
      Some newsletter operations require an API key. Include it in the X-API-Key header:
      \`\`\`
      X-API-Key: your_api_key
      \`\`\`
    `)
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints including login, register, and password reset')
    .addTag('users', 'User management and profile operations')
    .addTag('expenses', 'Expense tracking and management')
    .addTag('incomes', 'Income tracking and management')
    .addTag('categories', 'Category management for expenses and income')
    .addTag('export', 'Data export functionality')
    .addTag('newsletter', 'Newsletter subscription and preference management')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'X-API-Key')
    .build();
  
  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    operationIdFactory: (
      controllerKey: string,
      methodKey: string
    ) => methodKey
  });
  
  // Customize Swagger UI
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'CurioPay API Documentation',
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log('Swagger documentation is available at /docs');
}
bootstrap();
