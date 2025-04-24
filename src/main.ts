import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
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
      
      ## Authentication
      Most endpoints require JWT authentication. Include the JWT token in the Authorization header:
      \`\`\`
      Authorization: Bearer <your_jwt_token>
      \`\`\`
    `)
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints including login, register, and password reset')
    .addTag('users', 'User management and profile operations')
    .addTag('expenses', 'Expense tracking and management')
    .addTag('incomes', 'Income tracking and management')
    .addTag('categories', 'Category management for expenses and income')
    .addTag('export', 'Data export functionality')
    .addBearerAuth(
      { 
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // Customize Swagger UI
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'CurioPay API Documentation',
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log('Swagger documentation is available at /docs');
}
bootstrap();
