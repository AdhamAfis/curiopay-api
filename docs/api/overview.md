# API Overview

The CurioPay API provides RESTful endpoints for managing financial data, user accounts, and payment methods.

## Base URL

```
https://api.curiopay.com/v1
```

For development:
```
http://localhost:3000/v1
```

## Authentication

Most API endpoints require authentication using JWT (JSON Web Tokens). To authenticate:

1. Obtain a token using the `/auth/login` endpoint
2. Include the token in subsequent requests using the `Authorization` header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

Learn more in the [Authentication](auth.md) section.

## API Versioning

The API uses URL versioning with the format `/v{version_number}`. The current version is `v1`.

## Response Format

All API responses follow a consistent JSON format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "errors": []
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "message": "Operation failed",
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Limits vary by endpoint and user tier.

## Documentation

The complete API specification is available in OpenAPI format at `/api-docs` when running the API locally. 