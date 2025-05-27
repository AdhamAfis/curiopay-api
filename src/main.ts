import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: isProduction
      ? ['error', 'warn']
      : ['error', 'warn', 'log', 'debug'],
    bufferLogs: true,
  });

  // Configure trust proxy for proper IP detection behind load balancers
  app.set('trust proxy', isProduction ? true : 'loopback');

  // Enhanced Security Headers
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
            },
          }
        : false,
      // Cross-Origin options
      crossOriginEmbedderPolicy: isProduction,
      crossOriginOpenerPolicy: isProduction,
      crossOriginResourcePolicy: { policy: 'same-site' },
      // Disable X-Powered-By header
      hidePoweredBy: true,
      // HSTS configuration
      hsts: {
        maxAge: 15552000, // 180 days
        includeSubDomains: true,
        preload: true,
      },
      // Prevent MIME type sniffing
      noSniff: true,
      // Prevent clickjacking
      frameguard: { action: 'deny' },
      // XSS Protection
      xssFilter: true,
      // Referrer Policy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // Add Permissions-Policy header separately since it's not directly supported in Helmet
  app.use((req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(none), camera=(none), microphone=(none), payment=(self), ' +
        'accelerometer=(none), gyroscope=(none), magnetometer=(none), interest-cohort=(none)',
    );
    next();
  });

  // CORS configuration - use explicit origins in production
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : isProduction
        ? [] // Default to no origins in production if not specified
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    credentials: true,
    maxAge: 3600,
  });

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
        if (!isProduction) {
          logger.debug('Validation Errors:', JSON.stringify(errors, null, 2));
        }
        const formattedErrors = errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        }));
        return new BadRequestException({
          message: errors
            .map((error) => Object.values(error.constraints || {}))
            .flat(),
          details: isProduction ? undefined : formattedErrors,
        });
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Only setup Swagger in non-production environments, or if explicitly enabled
  if (!isProduction || process.env.ENABLE_SWAGGER === 'true') {
    setupSwagger(app);
  }

  await app.listen(process.env.PORT || 3000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  if (!isProduction || process.env.ENABLE_SWAGGER === 'true') {
    logger.log('Swagger documentation is available at /docs');
  }
}

function setupSwagger(app) {
  // Swagger API documentation
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
      'JWT-auth', // This name is used for reference in the controllers
    )
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'X-API-Key')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: false,
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
    ignoreGlobalPrefix: false,
  });

  // Add security requirement for all paths except auth endpoints
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
              security: [{ 'JWT-auth': [] }],
            },
          ];
        }),
      );

      return [path, updatedPathItem];
    }),
  );

  // Set up Basic Auth for Swagger UI in production
  const swaggerOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
      maxDisplayedTags: 12,
      defaultModelsExpandDepth: 0,
      defaultModelExpandDepth: 1,
    },
    customSiteTitle: 'CurioPay API Documentation',
  };

  // Add Basic Auth for Swagger UI in production
  if (process.env.NODE_ENV === 'production') {
    // Add authentication to Swagger UI
    const swaggerUiAuth = (req, res, next) => {
      const credentials =
        process.env.SWAGGER_USER && process.env.SWAGGER_PASSWORD;

      if (!credentials) {
        return next();
      }

      // Parse the auth header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).send('Authentication required');
      }

      // Verify credentials
      const base64Credentials = authHeader.split(' ')[1];
      const [username, password] = Buffer.from(base64Credentials, 'base64')
        .toString()
        .split(':');

      if (
        username !== process.env.SWAGGER_USER ||
        password !== process.env.SWAGGER_PASSWORD
      ) {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).send('Invalid credentials');
      }

      next();
    };

    // Apply the auth middleware only to Swagger UI routes
    app.use('/docs', swaggerUiAuth);
    app.use('/docs-json', swaggerUiAuth);
  }

  SwaggerModule.setup('docs', app, document, swaggerOptions);
}

bootstrap();
