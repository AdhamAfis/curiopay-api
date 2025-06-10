# API Overview

The CurioPay API provides RESTful endpoints for managing financial data, user accounts, and payment methods.

## Base URL

```
https://curiopay-api-production.up.railway.app/api/v1
```

For development:

```
http://localhost:3000/api/v1
```

## Authentication

Most API endpoints require authentication using JWT (JSON Web Tokens). To authenticate:

1. Obtain a token using the `/api/v1/auth/login` endpoint
2. Include the token in subsequent requests using the `Authorization` header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

Learn more in the [Authentication](auth.md) section.

## API Versioning

The API uses URL versioning with the format `/api/v{version_number}`. The current version is `/api/v1`.

## Response Format

All API responses follow the format defined in the OpenAPI specification. Success responses typically include the requested data, while error responses include appropriate HTTP status codes and error messages.

Example success response:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

Example error response:

```json
{
  "message": "Unauthorized",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Limits vary by endpoint and user tier.

## Documentation

The complete API specification is available in OpenAPI format at `/api-docs` when running the API locally.
