# Configuration

This page covers the configuration options for the CurioPay API.

## Environment Variables

The API requires several environment variables to be configured. Copy `.env.example` to `.env` and configure the following:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/curiopay` |
| `JWT_SECRET` | Secret key for JWT token signing | `your-super-secret-jwt-key` |
| `ENCRYPTION_KEY` | Key for data encryption | `your-encryption-key` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` (development) |

### Email Configuration

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

### OAuth Configuration

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |

## Security Configuration

The API includes several built-in security features:

- **Rate Limiting**: Multiple tiers (short, medium, long, sensitive)
- **Data Encryption**: AES-256-GCM for sensitive data
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configurable origins
- **Helmet Security**: Comprehensive security headers

## API Documentation

- **Development**: `http://localhost:3000/docs`
- **Production**: [Live Swagger Docs](https://curiopay-api-production.up.railway.app/docs)

For more details, see the [Getting Started](getting-started.md) guide. 