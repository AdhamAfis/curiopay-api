# User Preferences Endpoints

This page provides detailed documentation for the user preferences endpoints in CurioPay API.

## Get User Preferences

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

## Update User Preferences

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

## Toggle AI Features

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

## Get Preference Options

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

### Error Responses

**Code**: `401 UNAUTHORIZED` - Missing or invalid token

```json
{
  "message": "Unauthorized",
  "statusCode": 401,
  "error": "Unauthorized"
}
```
