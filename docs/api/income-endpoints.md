# Income Endpoints

This page provides detailed documentation for the income management endpoints in CurioPay API.

## Get All Income Records

Retrieves a list of income records with pagination and filters.

**URL**: `/api/v1/income`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters

| Parameter       | Type   | Description                 | Required |
| --------------- | ------ | --------------------------- | -------- |
| startDate       | string | Start date (YYYY-MM-DD)     | No       |
| endDate         | string | End date (YYYY-MM-DD)       | No       |
| categoryId      | string | Filter by category ID       | No       |
| paymentMethodId | string | Filter by payment method ID | No       |
| searchTerm      | string | Search term for description | No       |
| minAmount       | number | Minimum amount in cents     | No       |
| maxAmount       | number | Maximum amount in cents     | No       |
| page            | number | Page number                 | No       |
| limit           | number | Items per page              | No       |

### Success Response

**Code**: `200 OK`

```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "amount": 500000,
      "description": "Monthly Salary",
      "date": "2024-05-01T00:00:00.000Z",
      "categoryId": "456e4567-e89b-12d3-a456-426614174000",
      "userId": "789e4567-e89b-12d3-a456-426614174000",
      "createdAt": "2024-05-01T12:00:00.000Z",
      "updatedAt": "2024-05-01T12:00:00.000Z"
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

## Create an Income Record

Creates a new income record.

**URL**: `/api/v1/income`

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
  "date": "2024-05-01",
  "description": "Monthly Salary",
  "amount": 500000,
  "categoryId": "456e4567-e89b-12d3-a456-426614174000",
  "paymentMethodId": "789e4567-e89b-12d3-a456-426614174000",
  "notes": "Includes end of month bonus"
}
```

| Field           | Type   | Description                       | Required |
| --------------- | ------ | --------------------------------- | -------- |
| date            | string | Date when the income was received | Yes      |
| description     | string | Description of the income         | Yes      |
| amount          | number | Income amount in cents            | Yes      |
| categoryId      | string | Category ID for the income        | Yes      |
| paymentMethodId | string | Payment method ID                 | Yes      |
| notes           | string | Additional notes about the income | No       |

### Success Response

**Code**: `201 CREATED`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 500000,
  "description": "Monthly Salary",
  "date": "2024-05-01T00:00:00.000Z",
  "categoryId": "456e4567-e89b-12d3-a456-426614174000",
  "userId": "789e4567-e89b-12d3-a456-426614174000",
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

**Code**: `401 UNAUTHORIZED` - Invalid or missing token

```json
{
  "message": "Unauthorized",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

## Update an Income Record

Updates an existing income record.

**URL**: `/api/v1/income`

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
  "date": "2024-05-01",
  "description": "Updated Monthly Salary",
  "amount": 525000,
  "categoryId": "456e4567-e89b-12d3-a456-426614174000",
  "paymentMethodId": "789e4567-e89b-12d3-a456-426614174000",
  "notes": "Updated notes with additional bonus"
}
```

| Field           | Type   | Description                       | Required |
| --------------- | ------ | --------------------------------- | -------- |
| id              | string | Income record ID                  | Yes      |
| date            | string | Date when the income was received | No       |
| description     | string | Description of the income         | No       |
| amount          | number | Income amount in cents            | No       |
| categoryId      | string | Category ID for the income        | No       |
| paymentMethodId | string | Payment method ID                 | No       |
| notes           | string | Additional notes about the income | No       |

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 525000,
  "description": "Updated Monthly Salary",
  "date": "2024-05-01T00:00:00.000Z",
  "categoryId": "456e4567-e89b-12d3-a456-426614174000",
  "userId": "789e4567-e89b-12d3-a456-426614174000",
  "updatedAt": "2024-05-01T14:00:00.000Z"
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

**Code**: `404 NOT FOUND` - Income record not found

```json
{
  "message": "Income record not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Void an Income Record

Voids (soft deletes) an income record.

**URL**: `/api/v1/income`

**Method**: `DELETE`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters

| Parameter | Type   | Description              | Required |
| --------- | ------ | ------------------------ | -------- |
| id        | string | Income record ID to void | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "message": "Income record voided successfully"
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

**Code**: `404 NOT FOUND` - Income record not found

```json
{
  "message": "Income record not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Get Income Record by ID

Retrieves a specific income record by ID.

**URL**: `/api/v1/income/{id}`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Path Parameters

| Parameter | Description      | Required |
| --------- | ---------------- | -------- |
| id        | Income record ID | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 500000,
  "description": "Monthly Salary",
  "date": "2024-05-01T00:00:00.000Z",
  "categoryId": "456e4567-e89b-12d3-a456-426614174000",
  "userId": "789e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2024-05-01T12:00:00.000Z",
  "updatedAt": "2024-05-01T12:00:00.000Z"
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

**Code**: `404 NOT FOUND` - Income record not found

```json
{
  "message": "Income record not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Get Income Totals by Category

Retrieves income totals grouped by category within a specified date range.

**URL**: `/api/v1/income/stats/by-category`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters

| Parameter       | Type   | Description                 | Required |
| --------------- | ------ | --------------------------- | -------- |
| startDate       | string | Start date (YYYY-MM-DD)     | Yes      |
| endDate         | string | End date (YYYY-MM-DD)       | Yes      |
| categoryId      | string | Filter by category ID       | No       |
| paymentMethodId | string | Filter by payment method ID | No       |
| searchTerm      | string | Search term for description | No       |
| minAmount       | number | Minimum amount in cents     | No       |
| maxAmount       | number | Maximum amount in cents     | No       |

### Success Response

**Code**: `200 OK`

```json
[
  {
    "categoryId": "456e4567-e89b-12d3-a456-426614174000",
    "categoryName": "Salary",
    "total": 1000000,
    "count": 2
  },
  {
    "categoryId": "567e4567-e89b-12d3-a456-426614174000",
    "categoryName": "Investments",
    "total": 25000,
    "count": 1
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
