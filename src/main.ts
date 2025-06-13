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
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://fonts.googleapis.com',
              ],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
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
    .setExternalDoc(
      'Full Documentation',
      process.env.DOCS_URL || 'https://adhamafis.github.io/curiopay-api/',
    )
    .setContact(
      'Github Repository',
      process.env.GITHUB_REPO_URL || 'https://github.com/adhamafis/curiopay-api',
      '',
    )
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
    customfavIcon: '/api/v1/favicon.ico',
    customCss: `
      /* Modern Theme Overrides */
      :root {
        --primary: #2563eb;
        --primary-dark: #1d4ed8;
        --secondary: #7c3aed;
        --accent: #f59e0b;
        --success: #10b981;
        --error: #ef4444;
        --warning: #f59e0b;
        --info: #3b82f6;
        --background: #f8fafc;
        --surface: #ffffff;
        --text-primary: #1e293b;
        --text-secondary: #475569;
        --border: #e2e8f0;
      }

      .swagger-ui {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        color: var(--text-primary);
        background: var(--background);
      }

      /* Hide default topbar */
      .swagger-ui .topbar { 
        display: none; 
      }

      /* Enhanced Info Section */
      .swagger-ui .info {
        margin: 20px 0;
        padding: 20px;
        background: var(--surface);
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        border: 1px solid var(--border);
      }

      .swagger-ui .info .title {
        color: var(--text-primary);
        font-size: 2.5em;
        font-weight: 700;
        margin-bottom: 0.5em;
        padding-bottom: 0.5em;
        border-bottom: 2px solid var(--border);
      }

      /* Enhanced Links Section */
      .custom-links {
        margin: 25px 0;
        padding: 25px;
        background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
        border-radius: 12px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;
      }

      .custom-links:hover {
        transform: translateY(-2px);
      }

      .custom-links h4 {
        margin: 0 0 20px 0;
        color: white;
        font-size: 1.5em;
        font-weight: 600;
        text-align: center;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .custom-links .links-container {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 20px;
      }

      .custom-links a {
        display: inline-flex;
        align-items: center;
        padding: 14px 24px;
        background: rgba(255, 255, 255, 0.95);
        color: var(--text-primary) !important;
        text-decoration: none !important;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 500;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
      }

      .custom-links a:hover {
        background: white;
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      }

      .custom-links a:active {
        transform: translateY(0);
      }

      .custom-links a.github {
        background: var(--text-primary);
        color: white !important;
      }

      .custom-links a.github:hover {
        background: var(--text-secondary);
      }

      /* Enhanced API Endpoints */
      .swagger-ui .opblock {
        border-radius: 8px;
        margin: 0 0 15px 0;
        border: 1px solid var(--border);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
      }

      .swagger-ui .opblock:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .swagger-ui .opblock .opblock-summary {
        padding: 12px;
      }

      .swagger-ui .opblock .opblock-summary-method {
        border-radius: 6px;
        font-weight: 600;
        padding: 6px 12px;
      }

      /* Method Colors */
      .swagger-ui .opblock-get {
        background: rgba(59, 130, 246, 0.1);
        border-color: var(--info);
      }

      .swagger-ui .opblock-post {
        background: rgba(16, 185, 129, 0.1);
        border-color: var(--success);
      }

      .swagger-ui .opblock-put {
        background: rgba(245, 158, 11, 0.1);
        border-color: var(--warning);
      }

      .swagger-ui .opblock-delete {
        background: rgba(239, 68, 68, 0.1);
        border-color: var(--error);
      }

      .swagger-ui .opblock-patch {
        background: rgba(124, 58, 237, 0.1);
        border-color: var(--secondary);
      }

      /* Enhanced Buttons */
      .swagger-ui .btn {
        border-radius: 6px;
        font-weight: 500;
        padding: 8px 16px;
        transition: all 0.2s ease;
      }

      .swagger-ui .btn:hover {
        transform: translateY(-1px);
      }

      .swagger-ui .btn.execute {
        background-color: var(--primary);
        border-color: var(--primary);
      }

      .swagger-ui .btn.execute:hover {
        background-color: var(--primary-dark);
      }

      /* Enhanced Tables */
      .swagger-ui table {
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--border);
      }

      .swagger-ui table thead tr {
        background: var(--background);
      }

      .swagger-ui table tbody tr {
        transition: background-color 0.2s ease;
      }

      .swagger-ui table tbody tr:hover {
        background-color: var(--background);
      }

      /* Enhanced Code Blocks */
      .swagger-ui .highlight-code {
        border-radius: 8px;
        background: var(--background);
        border: 1px solid var(--border);
      }

      /* Enhanced Schema */
      .swagger-ui .model {
        border-radius: 8px;
        background: var(--surface);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border: 1px solid var(--border);
      }

      /* Tags */
      .swagger-ui .opblock-tag {
        border-bottom: 1px solid var(--border);
        color: var(--text-primary);
      }

      .swagger-ui .opblock-tag:hover {
        background: var(--background);
      }

      /* Parameters */
      .swagger-ui .parameters-container {
        background: var(--surface);
        border-radius: 8px;
        border: 1px solid var(--border);
      }

      .swagger-ui .parameter__name {
        color: var(--text-primary);
        font-weight: 600;
      }

      .swagger-ui .parameter__type {
        color: var(--text-secondary);
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .custom-links {
          padding: 15px;
        }

        .custom-links .links-container {
          flex-direction: column;
          align-items: stretch;
        }

        .custom-links a {
          width: 100%;
          justify-content: center;
        }
      }
    `,
    customJs: `
      window.onload = function() {
        setTimeout(function() {
          const info = document.querySelector('.swagger-ui .info');
          if (info && !document.querySelector('.custom-links')) {
            const linksDiv = document.createElement('div');
            linksDiv.className = 'custom-links';
            linksDiv.innerHTML = \`
              <h4>📚 Additional Resources</h4>
              <a href="\${window.location.origin.includes('localhost') ? 'http://localhost:8000' : '${process.env.DOCS_URL || 'https://docs.curiopay.com'}'}" target="_blank">
                📖 Full Documentation
              </a>
              <a href="${process.env.GITHUB_REPO_URL || 'https://github.com/curiopay/curiopay-api'}" target="_blank" class="github">
                🐙 GitHub Repository
              </a>
            \`;
            info.appendChild(linksDiv);
          }
        }, 500);
      };
    `,
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
