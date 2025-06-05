# Newsletter Endpoints

This page provides detailed documentation for the newsletter subscription endpoints in CurioPay API.

## Subscribe to Newsletter

Subscribe to the newsletter with optional preferences.

**URL**: `/api/v1/newsletter/subscribe`

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
  "weeklyDigest": true,
  "promotionalEmails": true,
  "productUpdates": true
}
```

| Field             | Type    | Description                  | Required |
| ----------------- | ------- | ---------------------------- | -------- |
| weeklyDigest      | boolean | Receive weekly digest emails | Yes      |
| promotionalEmails | boolean | Receive promotional emails   | Yes      |
| productUpdates    | boolean | Receive product updates      | Yes      |

### Success Response

**Code**: `201 CREATED`

```json
{
  "isSubscribed": true,
  "preferences": {
    "weeklyDigest": true,
    "promotionalEmails": true,
    "productUpdates": true
  },
  "subscribedAt": "2024-05-15T12:00:00.000Z"
}
```

### Error Responses

**Code**: `404 NOT FOUND` - User not found

```json
{
  "message": "User not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Unsubscribe from Newsletter

Unsubscribe from all newsletter types and set unsubscribe timestamp.

**URL**: `/api/v1/newsletter/unsubscribe`

**Method**: `DELETE`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response

**Code**: `200 OK`

```json
{
  "message": "Successfully unsubscribed from newsletter",
  "unsubscribedAt": "2024-05-15T12:00:00.000Z"
}
```

### Error Responses

**Code**: `404 NOT FOUND` - Subscription not found

```json
{
  "message": "Subscription not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Update Newsletter Preferences

Update subscription preferences for different types of newsletters.

**URL**: `/api/v1/newsletter/preferences`

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
  "weeklyDigest": true,
  "promotionalEmails": false,
  "productUpdates": true
}
```

| Field             | Type    | Description                  | Required |
| ----------------- | ------- | ---------------------------- | -------- |
| weeklyDigest      | boolean | Receive weekly digest emails | Yes      |
| promotionalEmails | boolean | Receive promotional emails   | Yes      |
| productUpdates    | boolean | Receive product updates      | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "isSubscribed": true,
  "preferences": {
    "weeklyDigest": true,
    "promotionalEmails": false,
    "productUpdates": true
  },
  "updatedAt": "2024-05-15T12:00:00.000Z"
}
```

### Error Responses

**Code**: `404 NOT FOUND` - Subscription not found

```json
{
  "message": "Subscription not found",
  "statusCode": 404,
  "error": "Not Found"
}
```

## Get Newsletter Subscription Status

Get current subscription status and preferences.

**URL**: `/api/v1/newsletter/status`

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
  "isSubscribed": true,
  "preferences": {
    "weeklyDigest": true,
    "promotionalEmails": false,
    "productUpdates": true
  },
  "unsubscribedAt": null
}
```

## Send Newsletter

Trigger sending of newsletter to all active subscribers. Super Admin only.

**URL**: `/api/v1/newsletter/send`

**Method**: `POST`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response

**Code**: `200 OK`

```json
{
  "message": "Newsletter sending initiated"
}
```

### Error Responses

**Code**: `401 UNAUTHORIZED` - Invalid API key

```json
{
  "message": "Unauthorized - Invalid API key",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

**Code**: `403 FORBIDDEN` - Super Admin only

```json
{
  "message": "Forbidden - Super Admin only",
  "statusCode": 403,
  "error": "Forbidden"
}
```

**Code**: `429 TOO MANY REQUESTS` - Rate limited

```json
{
  "message": "Too many requests",
  "statusCode": 429,
  "error": "Too Many Requests"
}
```

## Check Inactive Users

Send "we miss you" emails to users who have not logged in for over a month. Super Admin only.

**URL**: `/api/v1/newsletter/check-inactive`

**Method**: `POST`

**Auth required**: Yes (via Authorization header)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response

**Code**: `200 OK`

```json
{
  "message": "Inactive user check completed",
  "usersNotified": 5
}
```

### Error Responses

**Code**: `401 UNAUTHORIZED` - Invalid API key

```json
{
  "message": "Unauthorized - Invalid API key",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

**Code**: `403 FORBIDDEN` - Super Admin only

```json
{
  "message": "Forbidden - Super Admin only",
  "statusCode": 403,
  "error": "Forbidden"
}
```

**Code**: `429 TOO MANY REQUESTS` - Rate limited

```json
{
  "message": "Too many requests",
  "statusCode": 429,
  "error": "Too Many Requests"
}
```
