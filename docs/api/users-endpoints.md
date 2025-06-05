# User Management Endpoints

This page provides detailed documentation for the user management endpoints in CurioPay API.

## Get User Profile

Retrieves the profile information of the currently authenticated user.

**URL**: `/api/v1/users/me/profile`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "isActive": true,
  "phone": "+1234567890",
  "currencyId": "usd",
  "languageId": "en",
  "themeId": "light",
  "lastLoginAt": "2024-03-20T12:00:00Z",
  "createdAt": "2024-03-20T12:00:00Z",
  "updatedAt": "2024-03-20T12:00:00Z"
}
```

### Error Responses

**Code**: `401 UNAUTHORIZED` - Missing or invalid token

```json
{
  "message": "Unauthorized",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

## Delete Account

Deletes the account of the currently authenticated user.

**URL**: `/api/v1/users/me/delete-account`

**Method**: `DELETE`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Request Body

```json
{
  "currentPassword": "SecurePassword123",
  "confirm": true
}
```

| Field           | Type    | Description                       | Required |
| --------------- | ------- | --------------------------------- | -------- |
| currentPassword | string  | Current password for verification | Yes      |
| confirm         | boolean | Confirmation for account deletion | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "message": "Account successfully deleted."
}
```

### Error Responses

**Code**: `400 BAD REQUEST` - Invalid input

```json
{
  "message": "Invalid request or confirmation not provided.",
  "statusCode": 400,
  "error": "Bad Request"
}
```

**Code**: `401 UNAUTHORIZED` - Invalid password

```json
{
  "message": "Invalid password or email not verified.",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

## User Preferences

### Get User Preferences

Retrieves user preferences settings.

**URL**: `/api/v1/user-preferences`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "currency": {
    "id": "usd",
    "code": "USD",
    "symbol": "$",
    "name": "US Dollar"
  },
  "language": {
    "id": "en",
    "code": "en",
    "name": "English"
  },
  "theme": {
    "id": "light",
    "name": "Light"
  },
  "monthlyBudget": 5000,
  "enableAiFeatures": true
}
```

### Error Responses

**Code**: `401 UNAUTHORIZED` - Missing or invalid token

```json
{
  "message": "Unauthorized",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

### Update User Preferences

Updates user preferences settings.

**URL**: `/api/v1/user-preferences`

**Method**: `PATCH`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Request Body

```json
{
  "currencyId": "eur",
  "languageId": "fr",
  "themeId": "dark",
  "monthlyBudget": 7500,
  "enableAiFeatures": false
}
```

| Field            | Type    | Description        | Required |
| ---------------- | ------- | ------------------ | -------- |
| currencyId       | string  | Currency ID        | No       |
| languageId       | string  | Language ID        | No       |
| themeId          | string  | Theme ID           | No       |
| monthlyBudget    | number  | Monthly budget     | No       |
| enableAiFeatures | boolean | Enable AI features | No       |

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "currency": {
    "id": "eur",
    "code": "EUR",
    "symbol": "€",
    "name": "Euro"
  },
  "language": {
    "id": "fr",
    "code": "fr",
    "name": "French"
  },
  "theme": {
    "id": "dark",
    "name": "Dark"
  },
  "monthlyBudget": 7500,
  "enableAiFeatures": false
}
```

### Toggle AI Features

Toggle AI features on/off.

**URL**: `/api/v1/user-preferences/toggle-ai-features`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "currency": {
    "id": "usd",
    "code": "USD",
    "symbol": "$",
    "name": "US Dollar"
  },
  "language": {
    "id": "en",
    "code": "en",
    "name": "English"
  },
  "theme": {
    "id": "light",
    "name": "Light"
  },
  "monthlyBudget": 5000,
  "enableAiFeatures": false
}
```

### Get Preference Options

Get available preference options.

**URL**: `/api/v1/user-preferences/options`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response

**Code**: `200 OK`

```json
{
  "currencies": [
    {
      "id": "usd",
      "code": "USD",
      "symbol": "$",
      "name": "US Dollar"
    },
    {
      "id": "eur",
      "code": "EUR",
      "symbol": "€",
      "name": "Euro"
    }
  ],
  "languages": [
    {
      "id": "en",
      "code": "en",
      "name": "English"
    },
    {
      "id": "fr",
      "code": "fr",
      "name": "French"
    }
  ],
  "themes": [
    {
      "id": "light",
      "name": "Light"
    },
    {
      "id": "dark",
      "name": "Dark"
    }
  ]
}
```

## Admin User Management

### Get All Users (Admin only)

**URL**: `/api/v1/users`

**Method**: `GET`

**Auth required**: Yes (Admin role required)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response

**Code**: `200 OK`

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER"
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }
]
```

### Create User (Admin only)

**URL**: `/api/v1/users`

**Method**: `POST`

**Auth required**: Yes (Admin role required)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Request Body

```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123",
  "firstName": "New",
  "lastName": "User"
}
```

### Success Response

**Code**: `201 CREATED`

### Get User by ID (Admin only)

**URL**: `/api/v1/users/{id}`

**Method**: `GET`

**Auth required**: Yes (Admin role required)

### Path Parameters

| Parameter | Description | Required |
| --------- | ----------- | -------- |
| id        | User ID     | Yes      |

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER"
}
```

### Update User Role (Admin only)

**URL**: `/api/v1/users/{id}/role`

**Method**: `PATCH`

**Auth required**: Yes (Admin role required)

### Path Parameters

| Parameter | Description | Required |
| --------- | ----------- | -------- |
| id        | User ID     | Yes      |

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Request Body

```json
{
  "role": "ADMIN"
}
```

### Success Response

**Code**: `200 OK`

```json
{
  "message": "User role updated successfully"
}
```

### Toggle User Active Status (Admin only)

**URL**: `/api/v1/users/{id}/toggle-active`

**Method**: `PATCH`

**Auth required**: Yes (Admin role required)

### Path Parameters

| Parameter | Description | Required |
| --------- | ----------- | -------- |
| id        | User ID     | Yes      |

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response

**Code**: `200 OK`

```json
{
  "message": "User status has been toggled successfully."
}
```
