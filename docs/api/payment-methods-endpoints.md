# Payment Methods Endpoints

This page provides detailed documentation for the payment methods management endpoints in CurioPay API.

## Get All Payment Methods

Retrieves a list of payment methods with optional filtering.

**URL**: `/api/v1/payment-methods`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters

| Parameter | Type    | Description            | Required |
| --------- | ------- | ---------------------- | -------- |
| search    | string  | Search by name         | No       |
| isDefault | boolean | Filter by default flag | No       |
| isSystem  | boolean | Filter by system flag  | No       |

### Success Response

**Code**: `200 OK`

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "CREDIT_CARD",
    "icon": "credit-card",
    "isDefault": true,
    "isSystem": true,
    "createdAt": "2024-05-01T12:00:00.000Z",
    "updatedAt": "2024-05-01T12:00:00.000Z"
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "name": "CASH",
    "icon": "money",
    "isDefault": true,
    "isSystem": true,
    "createdAt": "2024-05-01T12:00:00.000Z",
    "updatedAt": "2024-05-01T12:00:00.000Z"
  }
]
```

## Create a Payment Method

Creates a new payment method.

**URL**: `/api/v1/payment-methods`

**Method**: `POST`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Request Body

```json
{
  "name": "CREDIT_CARD",
  "icon": "credit-card",
  "isDefault": false,
  "isSystem": false
}
```

| Field     | Type    | Description                                           | Required |
| --------- | ------- | ----------------------------------------------------- | -------- |
| name      | string  | Payment method name (from enum)                       | Yes      |
| icon      | string  | Icon for the payment method                           | No       |
| isDefault | boolean | Whether this is a default payment method (Admin only) | No       |
| isSystem  | boolean | Whether this is a system payment method (Admin only)  | No       |

### Success Response

**Code**: `201 CREATED`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "CREDIT_CARD",
  "icon": "credit-card",
  "isDefault": false,
  "isSystem": false,
  "createdAt": "2024-05-01T12:00:00.000Z",
  "updatedAt": "2024-05-01T12:00:00.000Z"
}
```

### Error Responses

**Code**: `400 BAD REQUEST` - Invalid input

```json
{
  "message": "Bad request",
  "statusCode": 400,
  "error": "Bad Request"
}
```

**Code**: `403 FORBIDDEN` - Admin privileges required for setting isDefault or isSystem

```json
{
  "message": "Forbidden. Admin privileges required for setting isDefault or isSystem.",
  "statusCode": 403,
  "error": "Forbidden"
}
```

**Code**: `409 CONFLICT` - Payment method already exists

```json
{
  "message": "Payment method already exists",
  "statusCode": 409,
  "error": "Conflict"
}
```

## Get a Payment Method by ID

Retrieves a specific payment method by ID.

**URL**: `/api/v1/payment-methods/{id}`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Path Parameters

| Parameter | Description       | Required |
| --------- | ----------------- | -------- |
| id        | Payment method ID | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "CREDIT_CARD",
  "icon": "credit-card",
  "isDefault": true,
  "isSystem": true,
  "createdAt": "2024-05-01T12:00:00.000Z",
  "updatedAt": "2024-05-01T12:00:00.000Z"
}
```

### Error Responses

**Code**: `404 NOT FOUND` - Payment method not found

```json
{
  "message": "Payment method not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Update a Payment Method

Updates an existing payment method.

**URL**: `/api/v1/payment-methods/{id}`

**Method**: `PATCH`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Path Parameters

| Parameter | Description       | Required |
| --------- | ----------------- | -------- |
| id        | Payment method ID | Yes      |

### Request Body

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "icon": "updated-icon",
  "isDefault": true
}
```

| Field     | Type    | Description                              | Required |
| --------- | ------- | ---------------------------------------- | -------- |
| id        | string  | Payment method ID                        | Yes      |
| icon      | string  | Updated icon for the payment method      | No       |
| isDefault | boolean | Whether this is a default payment method | No       |

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "CREDIT_CARD",
  "icon": "updated-icon",
  "isDefault": true,
  "isSystem": true,
  "createdAt": "2024-05-01T12:00:00.000Z",
  "updatedAt": "2024-05-01T12:00:00.000Z"
}
```

### Error Responses

**Code**: `400 BAD REQUEST` - Invalid input

```json
{
  "message": "Bad request",
  "statusCode": 400,
  "error": "Bad Request"
}
```

**Code**: `403 FORBIDDEN` - Admin privileges required for setting isDefault or isSystem

```json
{
  "message": "Forbidden. Admin privileges required for setting isDefault or isSystem.",
  "statusCode": 403,
  "error": "Forbidden"
}
```

**Code**: `404 NOT FOUND` - Payment method not found

```json
{
  "message": "Payment method not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Delete a Payment Method

Deletes a specific payment method.

**URL**: `/api/v1/payment-methods/{id}`

**Method**: `DELETE`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Path Parameters

| Parameter | Description       | Required |
| --------- | ----------------- | -------- |
| id        | Payment method ID | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "message": "Payment method deleted successfully"
}
```

### Error Responses

**Code**: `400 BAD REQUEST` - Payment method has associated transactions

```json
{
  "message": "Bad request or payment method has associated transactions",
  "statusCode": 400,
  "error": "Bad Request"
}
```

**Code**: `404 NOT FOUND` - Payment method not found

```json
{
  "message": "Payment method not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Get All Default Payment Methods

Retrieves a list of all default payment methods.

**URL**: `/api/v1/payment-methods/default/all`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

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
    "name": "CREDIT_CARD",
    "icon": "credit-card",
    "isDefault": true,
    "isSystem": true,
    "createdAt": "2024-05-01T12:00:00.000Z",
    "updatedAt": "2024-05-01T12:00:00.000Z"
  }
]
```

## Get All System Payment Methods

Retrieves a list of all system payment methods.

**URL**: `/api/v1/payment-methods/system/all`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

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
    "name": "CREDIT_CARD",
    "icon": "credit-card",
    "isDefault": true,
    "isSystem": true,
    "createdAt": "2024-05-01T12:00:00.000Z",
    "updatedAt": "2024-05-01T12:00:00.000Z"
  }
]
```
