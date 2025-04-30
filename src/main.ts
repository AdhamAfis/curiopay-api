import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    // Optimize buffer encoding
    bufferLogs: true,
  });

  // Security
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }));
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

  // Swagger API documentation - optimize configuration
  const config = new DocumentBuilder()
    .setTitle('CurioPay API')
    .setDescription('The CurioPay API documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User operations')
    .addTag('user-preferences', 'User preferences')
    .addTag('categories', 'Category management')
    .addTag('payment-methods', 'Payment method management')
    .addTag('expenses', 'Expense management')
    .addTag('income', 'Income management')
    .addTag('export', 'Data export')
    .addTag('newsletter', 'Newsletter management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth' // This name is used for reference in the controllers
    )
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'X-API-Key')
    .build();
  
  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: false,
    operationIdFactory: (
      controllerKey: string,
      methodKey: string
    ) => `${controllerKey}_${methodKey}`,
    ignoreGlobalPrefix: false,
    extraModels: []
  });
  
  // Add security requirement for all paths except auth endpoints
  // This makes JWT auth required by default in Swagger UI
  document.paths = Object.fromEntries(
    Object.entries(document.paths).map(([path, pathItem]) => {
      // Skip security for login, register, and password reset endpoints
      if (
        path.includes('/auth/login') || 
        path.includes('/auth/register') || 
        path.includes('/auth/password-reset')
      ) {
        return [path, pathItem];
      }
      
      // Add security requirement to all operations in this path
      const updatedPathItem = Object.fromEntries(
        Object.entries(pathItem).map(([method, operation]) => {
          return [
            method,
            {
              ...operation,
              security: [{ 'JWT-auth': [] }]
            }
          ];
        })
      );
      
      return [path, updatedPathItem];
    })
  );
  
  // Customize Swagger UI with optimized settings
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
      maxDisplayedTags: 12,
      defaultModelsExpandDepth: 0, // Don't expand models by default
      defaultModelExpandDepth: 1,  // Only expand one level of models
    },
    customSiteTitle: 'CurioPay API Documentation',
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log('Swagger documentation is available at /docs');
}
bootstrap();
