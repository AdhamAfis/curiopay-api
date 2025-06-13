# Export Endpoints

This page provides detailed documentation for the data export endpoints in CurioPay API.

## Generate User Data Export

Generate a ZIP file containing user data based on specified options and send it via email.

**URL**: `/api/v1/export`

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
  "includeExpenses": true,
  "includeIncome": true,
  "includeCategories": true,
  "includePreferences": true,
  "includeNewsletter": true
}
```

| Field              | Type    | Description                              | Required |
| ------------------ | ------- | ---------------------------------------- | -------- |
| includeExpenses    | boolean | Include expense data in export           | Yes      |
| includeIncome      | boolean | Include income data in export            | Yes      |
| includeCategories  | boolean | Include categories in export             | Yes      |
| includePreferences | boolean | Include user preferences in export       | Yes      |
| includeNewsletter  | boolean | Include newsletter preferences in export | Yes      |

### Success Response

**Code**: `201 CREATED`

```json
{
  "success": true,
  "message": "Export generated and sent to your email"
}
```

### Error Responses

**Code**: `400 BAD REQUEST` - Invalid export options

```json
{
  "message": "Invalid export options",
  "statusCode": 400,
  "error": "Bad Request"
}
```

**Code**: `401 UNAUTHORIZED` - User is not authorized or email not verified

```json
{
  "message": "Unauthorized or email not verified",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

**Code**: `404 NOT FOUND` - User not found

```json
{
  "message": "User not found",
  "statusCode": 404,
  "error": "Not Found"
}
```
