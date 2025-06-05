# Category Endpoints

This page provides detailed documentation for the category management endpoints in CurioPay API.

## Get All Categories

Retrieves a list of categories with optional filtering.

**URL**: `/api/v1/categories`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters

| Parameter | Type    | Description                        | Required |
| --------- | ------- | ---------------------------------- | -------- |
| search    | string  | Search by category name            | No       |
| type      | string  | Filter by type (INCOME or EXPENSE) | No       |
| isDefault | boolean | Filter by default flag             | No       |
| isSystem  | boolean | Filter by system flag              | No       |

### Success Response

**Code**: `200 OK`

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Groceries",
    "icon": "🛒",
    "type": "EXPENSE",
    "color": "#FF5733",
    "isDefault": false,
    "isSystem": false,
    "createdAt": "2024-05-01T12:00:00.000Z",
    "updatedAt": "2024-05-01T12:00:00.000Z"
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "name": "Salary",
    "icon": "💰",
    "type": "INCOME",
    "color": "#33FF57",
    "isDefault": true,
    "isSystem": true,
    "createdAt": "2024-05-01T12:00:00.000Z",
    "updatedAt": "2024-05-01T12:00:00.000Z"
  }
]
```

## Create a Category

Creates a new category.

**URL**: `/api/v1/categories`

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
  "name": "Groceries",
  "icon": "🛒",
  "type": "EXPENSE",
  "color": "#FF5733",
  "isDefault": false,
  "isSystem": false
}
```

| Field     | Type    | Description                                     | Required |
| --------- | ------- | ----------------------------------------------- | -------- |
| name      | string  | Name of the category                            | Yes      |
| icon      | string  | Emoji icon for the category                     | Yes      |
| type      | string  | Type of the category (INCOME or EXPENSE)        | Yes      |
| color     | string  | Color code for the category (hex format)        | No       |
| isDefault | boolean | Whether this is a default category (Admin only) | No       |
| isSystem  | boolean | Whether this is a system category (Admin only)  | No       |

### Success Response

**Code**: `201 CREATED`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Groceries",
  "icon": "🛒",
  "type": "EXPENSE",
  "color": "#FF5733",
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

**Code**: `409 CONFLICT` - Category already exists

```json
{
  "message": "Category already exists",
  "statusCode": 409,
  "error": "Conflict"
}
```

## Get a Category by ID

Retrieves a specific category by ID.

**URL**: `/api/v1/categories/{id}`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Path Parameters

| Parameter | Description | Required |
| --------- | ----------- | -------- |
| id        | Category ID | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Groceries",
  "icon": "🛒",
  "type": "EXPENSE",
  "color": "#FF5733",
  "isDefault": false,
  "isSystem": false,
  "createdAt": "2024-05-01T12:00:00.000Z",
  "updatedAt": "2024-05-01T12:00:00.000Z"
}
```

### Error Responses

**Code**: `404 NOT FOUND` - Category not found

```json
{
  "message": "Category not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Update a Category

Updates an existing category.

**URL**: `/api/v1/categories/{id}`

**Method**: `PATCH`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Path Parameters

| Parameter | Description | Required |
| --------- | ----------- | -------- |
| id        | Category ID | Yes      |

### Request Body

```json
{
  "name": "Updated Groceries",
  "icon": "🛍️",
  "type": "EXPENSE",
  "color": "#FFA500",
  "isDefault": true
}
```

| Field     | Type    | Description                                      | Required |
| --------- | ------- | ------------------------------------------------ | -------- |
| name      | string  | Updated name of the category                     | No       |
| icon      | string  | Updated emoji icon for the category              | No       |
| type      | string  | Updated type of the category (INCOME or EXPENSE) | No       |
| color     | string  | Updated color code for the category (hex format) | No       |
| isDefault | boolean | Whether this is a default category               | No       |

### Success Response

**Code**: `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Updated Groceries",
  "icon": "🛍️",
  "type": "EXPENSE",
  "color": "#FFA500",
  "isDefault": true,
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

**Code**: `404 NOT FOUND` - Category not found

```json
{
  "message": "Category not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Delete a Category

Deletes a specific category.

**URL**: `/api/v1/categories/{id}`

**Method**: `DELETE`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Path Parameters

| Parameter | Description | Required |
| --------- | ----------- | -------- |
| id        | Category ID | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "message": "Category deleted successfully"
}
```

### Error Responses

**Code**: `400 BAD REQUEST` - Category has associated transactions

```json
{
  "message": "Bad request or category has associated transactions",
  "statusCode": 400,
  "error": "Bad Request"
}
```

**Code**: `404 NOT FOUND` - Category not found

```json
{
  "message": "Category not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Get All Category Types

Retrieves a list of all category types.

**URL**: `/api/v1/categories/types/all`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response

**Code**: `200 OK`

```json
["INCOME", "EXPENSE"]
```

## Get All Default Categories

Retrieves a list of all default categories.

**URL**: `/api/v1/categories/default/all`

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
    "name": "Groceries",
    "icon": "🛒",
    "type": "EXPENSE",
    "color": "#FF5733",
    "isDefault": true,
    "isSystem": false,
    "createdAt": "2024-05-01T12:00:00.000Z",
    "updatedAt": "2024-05-01T12:00:00.000Z"
  }
]
```

## Get All System Categories

Retrieves a list of all system categories.

**URL**: `/api/v1/categories/system/all`

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
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "name": "Salary",
    "icon": "💰",
    "type": "INCOME",
    "color": "#33FF57",
    "isDefault": true,
    "isSystem": true,
    "createdAt": "2024-05-01T12:00:00.000Z",
    "updatedAt": "2024-05-01T12:00:00.000Z"
  }
]
```
