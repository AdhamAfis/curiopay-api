# Expense Endpoints

This page provides detailed documentation for the expense management endpoints in CurioPay API.

## Get All Expenses

Retrieves a list of expenses with pagination and filters.

**URL**: `/api/v1/expenses`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters

| Parameter        | Type    | Description                 | Required |
| ---------------- | ------- | --------------------------- | -------- |
| startDate        | string  | Start date (YYYY-MM-DD)     | No       |
| endDate          | string  | End date (YYYY-MM-DD)       | No       |
| categoryId       | string  | Filter by category ID       | No       |
| paymentMethodId  | string  | Filter by payment method ID | No       |
| searchTerm       | string  | Search term for description | No       |
| minAmount        | number  | Minimum amount in cents     | No       |
| maxAmount        | number  | Maximum amount in cents     | No       |
| page             | number  | Page number                 | No       |
| limit            | number  | Items per page              | No       |
| includeVoid      | boolean | Include void expenses       | No       |
| includeRecurring | boolean | Include recurring expenses  | No       |

### Success Response

**Code**: `200 OK`

```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "amount": 15000,
      "description": "Grocery Shopping",
      "date": "2024-05-15T00:00:00.000Z",
      "categoryId": "456e4567-e89b-12d3-a456-426614174000",
      "userId": "789e4567-e89b-12d3-a456-426614174000",
      "createdAt": "2024-05-15T12:00:00.000Z",
      "updatedAt": "2024-05-15T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Error Responses

**Code**: `401 UNAUTHORIZED` - Invalid or missing token

```json
{
  "message": "Unauthorized",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

## Create a New Expense

Creates a new expense entry.

**URL**: `/api/v1/expenses`

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
  "date": "2024-05-15",
  "description": "Grocery Shopping",
  "amount": 15000,
  "categoryId": "456e4567-e89b-12d3-a456-426614174000",
  "paymentMethodId": "789e4567-e89b-12d3-a456-426614174000",
  "notes": "Monthly groceries including special items"
}
```

| Field           | Type   | Description                        | Required |
| --------------- | ------ | ---------------------------------- | -------- |
| date            | string | Date when the expense occurred     | Yes      |
| description     | string | Description of the expense         | Yes      |
| amount          | number | Expense amount in cents            | Yes      |
| categoryId      | string | Category ID for the expense        | Yes      |
| paymentMethodId | string | Payment method ID                  | Yes      |
| notes           | string | Additional notes about the expense | No       |

### Success Response

**Code**: `201 CREATED`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 15000,
  "description": "Grocery Shopping",
  "date": "2024-05-15T00:00:00.000Z",
  "categoryId": "456e4567-e89b-12d3-a456-426614174000",
  "userId": "789e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2024-05-15T12:00:00.000Z",
  "updatedAt": "2024-05-15T12:00:00.000Z"
}
```

### Error Responses

**Code**: `400 BAD REQUEST` - Invalid input

```json
{
  "message": "Bad request - Invalid input",
  "statusCode": 400,
  "error": "Bad Request"
}
```

**Code**: `401 UNAUTHORIZED` - Invalid or missing token

```json
{
  "message": "Unauthorized",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

## Update an Expense

Updates an existing expense entry.

**URL**: `/api/v1/expenses`

**Method**: `PUT`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Request Body

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "date": "2024-05-15",
  "description": "Updated Grocery Shopping",
  "amount": 17500,
  "categoryId": "456e4567-e89b-12d3-a456-426614174000",
  "paymentMethodId": "789e4567-e89b-12d3-a456-426614174000",
  "notes": "Updated notes"
}
```

| Field           | Type   | Description                        | Required |
| --------------- | ------ | ---------------------------------- | -------- |
| id              | string | Expense ID                         | Yes      |
| date            | string | Date when the expense occurred     | No       |
| description     | string | Description of the expense         | No       |
| amount          | number | Expense amount in cents            | No       |
| categoryId      | string | Category ID for the expense        | No       |
| paymentMethodId | string | Payment method ID                  | No       |
| notes           | string | Additional notes about the expense | No       |

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 17500,
  "description": "Updated Grocery Shopping",
  "date": "2024-05-15T00:00:00.000Z",
  "categoryId": "456e4567-e89b-12d3-a456-426614174000",
  "userId": "789e4567-e89b-12d3-a456-426614174000",
  "updatedAt": "2024-05-15T13:00:00.000Z"
}
```

### Error Responses

**Code**: `400 BAD REQUEST` - Invalid input

```json
{
  "message": "Bad request - Invalid input",
  "statusCode": 400,
  "error": "Bad Request"
}
```

**Code**: `401 UNAUTHORIZED` - Invalid or missing token

```json
{
  "message": "Unauthorized",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

**Code**: `404 NOT FOUND` - Expense not found

```json
{
  "message": "Expense not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Delete an Expense

Deletes an expense entry.

**URL**: `/api/v1/expenses`

**Method**: `DELETE`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters

| Parameter | Type   | Description          | Required |
| --------- | ------ | -------------------- | -------- |
| id        | string | Expense ID to delete | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "message": "Expense deleted successfully"
}
```

### Error Responses

**Code**: `401 UNAUTHORIZED` - Invalid or missing token

```json
{
  "message": "Unauthorized",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

**Code**: `404 NOT FOUND` - Expense not found

```json
{
  "message": "Expense not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Get Expense by ID

Retrieves a specific expense by ID.

**URL**: `/api/v1/expenses/{id}`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Path Parameters

| Parameter | Description | Required |
| --------- | ----------- | -------- |
| id        | Expense ID  | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 15000,
  "description": "Grocery Shopping",
  "date": "2024-05-15T00:00:00.000Z",
  "categoryId": "456e4567-e89b-12d3-a456-426614174000",
  "userId": "789e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2024-05-15T12:00:00.000Z",
  "updatedAt": "2024-05-15T12:00:00.000Z"
}
```

### Error Responses

**Code**: `401 UNAUTHORIZED` - Invalid or missing token

```json
{
  "message": "Unauthorized",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

**Code**: `404 NOT FOUND` - Expense not found

```json
{
  "message": "Expense not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Get Expense Totals by Category

Retrieves expense totals grouped by category within a specified date range.

**URL**: `/api/v1/expenses/stats/by-category`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters

| Parameter        | Type    | Description                 | Required |
| ---------------- | ------- | --------------------------- | -------- |
| startDate        | string  | Start date (YYYY-MM-DD)     | Yes      |
| endDate          | string  | End date (YYYY-MM-DD)       | Yes      |
| categoryId       | string  | Filter by category ID       | No       |
| paymentMethodId  | string  | Filter by payment method ID | No       |
| searchTerm       | string  | Search term for description | No       |
| minAmount        | number  | Minimum amount in cents     | No       |
| maxAmount        | number  | Maximum amount in cents     | No       |
| includeVoid      | boolean | Include void expenses       | No       |
| includeRecurring | boolean | Include recurring expenses  | No       |

### Success Response

**Code**: `200 OK`

```json
[
  {
    "categoryId": "456e4567-e89b-12d3-a456-426614174000",
    "categoryName": "Groceries",
    "total": 35000,
    "count": 3
  },
  {
    "categoryId": "567e4567-e89b-12d3-a456-426614174000",
    "categoryName": "Dining Out",
    "total": 22500,
    "count": 2
  }
]
```

### Error Responses

**Code**: `400 BAD REQUEST` - Missing date range

```json
{
  "message": "Bad request - Missing date range",
  "statusCode": 400,
  "error": "Bad Request"
}
```

**Code**: `401 UNAUTHORIZED` - Invalid or missing token

```json
{
  "message": "Unauthorized",
  "statusCode": 401,
  "error": "Unauthorized"
}
```
