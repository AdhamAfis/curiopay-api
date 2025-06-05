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

## Export Expenses

Exports expense data in CSV or PDF format.

**URL**: `/export/expenses`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters

| Parameter       | Type    | Description                            | Required | Default                    |
| --------------- | ------- | -------------------------------------- | -------- | -------------------------- |
| format          | string  | Export format (csv/pdf)                | No       | csv                        |
| startDate       | string  | Start date for filtering (YYYY-MM-DD)  | No       | First day of current month |
| endDate         | string  | End date for filtering (YYYY-MM-DD)    | No       | Last day of current month  |
| categoryId      | string  | Filter by category ID                  | No       | -                          |
| paymentMethodId | string  | Filter by payment method ID            | No       | -                          |
| minAmount       | number  | Minimum amount                         | No       | -                          |
| maxAmount       | number  | Maximum amount                         | No       | -                          |
| includeNotes    | boolean | Whether to include notes in the export | No       | false                      |
| includeTags     | boolean | Whether to include tags in the export  | No       | false                      |
| filename        | string  | Custom filename for the export         | No       | -                          |

### Success Response

**For CSV format**:

**Code**: `200 OK`

**Content-Type**: `text/csv`

**Content-Disposition**: `attachment; filename="expenses-2025-05-01-to-2025-05-31.csv"`

```csv
Date,Description,Category,Payment Method,Amount
2025-05-10,Grocery shopping,Groceries,Credit Card,125.50
2025-05-15,Restaurant dinner,Dining Out,Credit Card,78.25
2025-05-20,Gas station,Transportation,Credit Card,45.00
...
```

**For PDF format**:

**Code**: `200 OK`

**Content-Type**: `application/pdf`

**Content-Disposition**: `attachment; filename="expenses-2025-05-01-to-2025-05-31.pdf"`

The response body will be a binary PDF file.

### Error Responses

**Code**: `401 UNAUTHORIZED` - Missing or invalid token

```json
{
  "success": false,
  "data": null,
  "message": "Unauthorized",
  "errors": [
    {
      "code": "UNAUTHORIZED",
      "message": "Invalid or missing authentication token"
    }
  ]
}
```

**Code**: `400 BAD REQUEST` - Invalid query parameters

```json
{
  "success": false,
  "data": null,
  "message": "Invalid parameters",
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "field": "format",
      "message": "Format must be either 'csv' or 'pdf'"
    }
  ]
}
```

**Code**: `500 INTERNAL SERVER ERROR` - Error generating export

```json
{
  "success": false,
  "data": null,
  "message": "Failed to generate export",
  "errors": [
    {
      "code": "EXPORT_ERROR",
      "message": "An error occurred while generating the export"
    }
  ]
}
```

## Export Income

Exports income data in CSV or PDF format.

**URL**: `/export/income`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters

Same parameters as the Export Expenses endpoint.

### Success Response

**For CSV format**:

**Code**: `200 OK`

**Content-Type**: `text/csv`

**Content-Disposition**: `attachment; filename="income-2025-05-01-to-2025-05-31.csv"`

```csv
Date,Description,Category,Payment Method,Amount
2025-05-01,Monthly Salary,Salary,Bank Account,3500.00
2025-05-15,Freelance Project,Freelance,Bank Account,1300.00
2025-05-22,Sold unused item,Other,Cash,450.00
...
```

**For PDF format**:

**Code**: `200 OK`

**Content-Type**: `application/pdf`

**Content-Disposition**: `attachment; filename="income-2025-05-01-to-2025-05-31.pdf"`

The response body will be a binary PDF file.

### Error Responses

Same as for Export Expenses endpoint.

## Export Transactions

Exports both expense and income data in CSV or PDF format.

**URL**: `/export/transactions`

**Method**: `GET`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters

Same parameters as the Export Expenses endpoint, plus:

| Parameter       | Type   | Description                                           | Required | Default |
| --------------- | ------ | ----------------------------------------------------- | -------- | ------- |
| transactionType | string | Type of transactions to include (all/expenses/income) | No       | all     |

### Success Response

**For CSV format**:

**Code**: `200 OK`

**Content-Type**: `text/csv`

**Content-Disposition**: `attachment; filename="transactions-2025-05-01-to-2025-05-31.csv"`

```csv
Date,Description,Category,Payment Method,Amount,Type
2025-05-01,Monthly Salary,Salary,Bank Account,3500.00,Income
2025-05-10,Grocery shopping,Groceries,Credit Card,-125.50,Expense
2025-05-15,Freelance Project,Freelance,Bank Account,1300.00,Income
2025-05-15,Restaurant dinner,Dining Out,Credit Card,-78.25,Expense
...
```

**For PDF format**:

**Code**: `200 OK`

**Content-Type**: `application/pdf`

**Content-Disposition**: `attachment; filename="transactions-2025-05-01-to-2025-05-31.pdf"`

The response body will be a binary PDF file.

### Error Responses

Same as for Export Expenses endpoint.

## Generate Custom Report

Generates a custom financial report with user-defined parameters.

**URL**: `/export/report`

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
  "title": "Monthly Financial Report",
  "startDate": "2025-05-01",
  "endDate": "2025-05-31",
  "format": "pdf",
  "sections": [
    {
      "type": "summary",
      "title": "Monthly Summary"
    },
    {
      "type": "incomeBreakdown",
      "title": "Income Breakdown",
      "groupBy": "category"
    },
    {
      "type": "expenseBreakdown",
      "title": "Expense Breakdown",
      "groupBy": "category"
    },
    {
      "type": "transactions",
      "title": "Recent Transactions",
      "limit": 10
    },
    {
      "type": "chart",
      "chartType": "pie",
      "title": "Expense Categories",
      "data": "expensesByCategory"
    }
  ],
  "includeNotes": true
}
```

| Field        | Type    | Description              | Required |
| ------------ | ------- | ------------------------ | -------- |
| title        | string  | Report title             | Yes      |
| startDate    | string  | Start date (YYYY-MM-DD)  | Yes      |
| endDate      | string  | End date (YYYY-MM-DD)    | Yes      |
| format       | string  | Export format (pdf/xlsx) | Yes      |
| sections     | array   | Report sections          | Yes      |
| includeNotes | boolean | Whether to include notes | No       |

Each section in the `sections` array has:

| Field     | Type   | Description                                | Required |
| --------- | ------ | ------------------------------------------ | -------- |
| type      | string | Section type                               | Yes      |
| title     | string | Section title                              | No       |
| groupBy   | string | How to group data (for breakdown sections) | No       |
| limit     | number | Limit for transactions/items               | No       |
| chartType | string | Type of chart (for chart sections)         | No       |
| data      | string | Data source for chart                      | No       |

### Success Response

**Code**: `200 OK`

**Content-Type**: `application/pdf` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Content-Disposition**: `attachment; filename="Monthly-Financial-Report-2025-05-01-to-2025-05-31.pdf"`

The response body will be a binary file in the requested format.

### Error Responses

**Code**: `400 BAD REQUEST` - Invalid input

```json
{
  "success": false,
  "data": null,
  "message": "Validation error",
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "field": "sections",
      "message": "At least one section must be defined"
    }
  ]
}
```

**Code**: `500 INTERNAL SERVER ERROR` - Error generating report

```json
{
  "success": false,
  "data": null,
  "message": "Failed to generate report",
  "errors": [
    {
      "code": "REPORT_ERROR",
      "message": "An error occurred while generating the report"
    }
  ]
}
```
