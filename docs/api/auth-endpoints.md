# Authentication Endpoints

This page provides detailed documentation for the authentication endpoints in CurioPay API.

## Register a New User

Used to register a new user in the system.

**URL**: `/api/v1/auth/register`

**Method**: `POST`

**Auth required**: No

### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

| Field     | Type   | Description                                                                 | Required |
| --------- | ------ | --------------------------------------------------------------------------- | -------- |
| email     | string | User's email address (must be unique)                                       | Yes      |
| password  | string | User's password (min 8 chars, must include uppercase, lowercase and number) | Yes      |
| firstName | string | User's first name                                                           | Yes      |
| lastName  | string | User's last name                                                            | Yes      |

### Success Response

**Code**: `201 CREATED`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Error Responses

**Code**: `400 BAD REQUEST` - Invalid input parameters

```json
{
  "message": "Validation error",
  "statusCode": 400,
  "error": "Bad Request"
}
```

**Code**: `409 CONFLICT` - Email already registered

```json
{
  "message": "Email already registered",
  "statusCode": 409,
  "error": "Conflict"
}
```

## User Login

Used to obtain an authentication token for a registered user.

**URL**: `/api/v1/auth/login`

**Method**: `POST`

**Auth required**: No

### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "rememberMe": false
}
```

| Field      | Type    | Description                         | Required |
| ---------- | ------- | ----------------------------------- | -------- |
| email      | string  | User's email address                | Yes      |
| password   | string  | User's password                     | Yes      |
| rememberMe | boolean | Extended session duration when true | No       |

### Success Response

**Code**: `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requireMfa": false,
  "tempToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Error Responses

**Code**: `401 UNAUTHORIZED` - Invalid credentials

```json
{
  "message": "Invalid credentials",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

## MFA Login Completion

Used to complete login with MFA verification.

**URL**: `/api/v1/auth/login/mfa/complete`

**Method**: `POST`

**Auth required**: No

### Request Body

```json
{
  "code": "123456",
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field     | Type   | Description                         | Required |
| --------- | ------ | ----------------------------------- | -------- |
| code      | string | MFA verification code               | Yes      |
| tempToken | string | Temporary token received from login | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Error Responses

**Code**: `401 UNAUTHORIZED` - Invalid MFA code or token

```json
{
  "message": "Invalid MFA code or token",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

## Request Password Reset

Used to request a password reset for a registered email.

**URL**: `/api/v1/auth/password-reset/request`

**Method**: `POST`

**Auth required**: No

### Request Body

```json
{
  "email": "user@example.com"
}
```

| Field | Type   | Description          | Required |
| ----- | ------ | -------------------- | -------- |
| email | string | User's email address | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "message": "Reset instructions sent"
}
```

## Reset Password

Used to reset a password using a reset token.

**URL**: `/api/v1/auth/password-reset/reset`

**Method**: `POST`

**Auth required**: No

### Request Body

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePassword123!"
}
```

| Field       | Type   | Description                             | Required |
| ----------- | ------ | --------------------------------------- | -------- |
| token       | string | Password reset token received via email | Yes      |
| newPassword | string | New password                            | Yes      |

### Success Response

**Code**: `200 OK`

```json
{
  "message": "Password reset successful"
}
```

### Error Responses

**Code**: `400 BAD REQUEST` - Invalid or expired token

```json
{
  "message": "Invalid or expired token",
  "statusCode": 400,
  "error": "Bad Request"
}
```

## Logout

Used to invalidate the current token.

**URL**: `/api/v1/auth/logout`

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
  "message": "Logout successful"
}
```

## MFA Endpoints

### Generate MFA Secret

**URL**: `/api/v1/auth/mfa/generate`

**Method**: `GET`

**Auth required**: Yes

### Success Response

```json
{
  "secret": "ABCDEFGHIJKLMNOP",
  "qrCode": "data:image/png;base64,..."
}
```

### Enable MFA

**URL**: `/api/v1/auth/mfa/enable`

**Method**: `POST`

**Auth required**: Yes

### Request Body

```json
{
  "code": "123456"
}
```

### Success Response

**Code**: `200 OK`

```json
{
  "message": "MFA enabled successfully"
}
```

### Disable MFA

**URL**: `/api/v1/auth/mfa/disable`

**Method**: `POST`

**Auth required**: Yes

### Request Body

```json
{
  "code": "123456",
  "confirm": true
}
```

### Success Response

**Code**: `200 OK`

```json
{
  "message": "MFA disabled successfully"
}
```

## Email Verification Endpoints

### Request Email Verification

**URL**: `/api/v1/auth/email/request-verification`

**Method**: `POST`

**Auth required**: No

### Request Body

```json
{
  "email": "user@example.com"
}
```

### Success Response

**Code**: `200 OK`

```json
{
  "success": true,
  "verified": false,
  "message": "Verification email sent",
  "verifiedAt": null
}
```

### Verify Email

**URL**: `/api/v1/auth/email/verify`

**Method**: `POST`

**Auth required**: No

### Request Body

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Success Response

**Code**: `200 OK`

```json
{
  "message": "Email verified successfully"
}
```

### Error Responses

**Code**: `400 BAD REQUEST` - Invalid or expired token

```json
{
  "message": "Invalid or expired token",
  "statusCode": 400,
  "error": "Bad Request"
}
```
