# API Endpoints

This page documents the available endpoints in the CurioPay API.

## App

| Endpoint  | Method | Description           |
| --------- | ------ | --------------------- |
| `/api/v1` | GET    | Health check endpoint |

## Authentication

| Endpoint                                          | Method | Description                                 |
| ------------------------------------------------- | ------ | ------------------------------------------- |
| `/api/v1/auth/register`                           | POST   | Register a new user                         |
| `/api/v1/auth/login`                              | POST   | Authenticate a user and get tokens          |
| `/api/v1/auth/login/mfa/complete`                 | POST   | Complete login with MFA verification        |
| `/api/v1/auth/logout`                             | POST   | Logout user                                 |
| `/api/v1/auth/password-reset/request`             | POST   | Request password reset                      |
| `/api/v1/auth/password-reset/reset`               | POST   | Reset password using token                  |
| `/api/v1/auth/mfa/generate`                       | GET    | Generate MFA secret and QR code             |
| `/api/v1/auth/mfa/enable`                         | POST   | Enable MFA                                  |
| `/api/v1/auth/mfa/verify`                         | POST   | Verify MFA code                             |
| `/api/v1/auth/mfa/disable`                        | POST   | Disable MFA                                 |
| `/api/v1/auth/email/request-verification`         | POST   | Request email verification                  |
| `/api/v1/auth/email/request-verification/current` | POST   | Request email verification for current user |
| `/api/v1/auth/email/verify`                       | POST   | Verify email with token                     |
| `/api/v1/auth/email/verification-status`          | GET    | Check email verification status             |
| `/api/v1/auth/google`                             | GET    | Google OAuth login                          |
| `/api/v1/auth/google/callback`                    | GET    | Google OAuth callback                       |
| `/api/v1/auth/github`                             | GET    | GitHub OAuth login                          |
| `/api/v1/auth/github/callback`                    | GET    | GitHub OAuth callback                       |
| `/api/v1/auth/link-account`                       | POST   | Link current account with OAuth provider    |
| `/api/v1/auth/unlink-provider/{provider}`         | POST   | Unlink an OAuth provider from account       |

## Users

| Endpoint                           | Method | Description                    |
| ---------------------------------- | ------ | ------------------------------ |
| `/api/v1/users`                    | GET    | Get all users (Admin only)     |
| `/api/v1/users`                    | POST   | Create a new user (Admin only) |
| `/api/v1/users/{id}`               | GET    | Get user by ID (Admin only)    |
| `/api/v1/users/{id}/role`          | PATCH  | Update user role (Admin only)  |
| `/api/v1/users/{id}/toggle-active` | PATCH  | Toggle user active status      |
| `/api/v1/users/me/profile`         | GET    | Get current user profile       |
| `/api/v1/users/me/delete-account`  | DELETE | Delete current user account    |

## User Preferences

| Endpoint                                      | Method | Description             |
| --------------------------------------------- | ------ | ----------------------- |
| `/api/v1/user-preferences`                    | GET    | Get user preferences    |
| `/api/v1/user-preferences`                    | PATCH  | Update user preferences |
| `/api/v1/user-preferences/toggle-ai-features` | GET    | Toggle AI features      |
| `/api/v1/user-preferences/options`            | GET    | Get preference options  |

## Payment Methods

| Endpoint                              | Method | Description                     |
| ------------------------------------- | ------ | ------------------------------- |
| `/api/v1/payment-methods`             | GET    | List all payment methods        |
| `/api/v1/payment-methods`             | POST   | Create a new payment method     |
| `/api/v1/payment-methods/{id}`        | GET    | Get payment method details      |
| `/api/v1/payment-methods/{id}`        | PATCH  | Update payment method           |
| `/api/v1/payment-methods/{id}`        | DELETE | Delete payment method           |
| `/api/v1/payment-methods/default/all` | GET    | Get all default payment methods |
| `/api/v1/payment-methods/system/all`  | GET    | Get all system payment methods  |

## Categories

| Endpoint                         | Method | Description                |
| -------------------------------- | ------ | -------------------------- |
| `/api/v1/categories`             | GET    | List all categories        |
| `/api/v1/categories`             | POST   | Create a new category      |
| `/api/v1/categories/{id}`        | GET    | Get category details       |
| `/api/v1/categories/{id}`        | PATCH  | Update category            |
| `/api/v1/categories/{id}`        | DELETE | Delete category            |
| `/api/v1/categories/types/all`   | GET    | Get all category types     |
| `/api/v1/categories/default/all` | GET    | Get all default categories |
| `/api/v1/categories/system/all`  | GET    | Get all system categories  |

## Expenses

| Endpoint                             | Method | Description                      |
| ------------------------------------ | ------ | -------------------------------- |
| `/api/v1/expenses`                   | GET    | List all expenses (with filters) |
| `/api/v1/expenses`                   | POST   | Create a new expense             |
| `/api/v1/expenses`                   | PUT    | Update an expense                |
| `/api/v1/expenses`                   | DELETE | Delete an expense                |
| `/api/v1/expenses/{id}`              | GET    | Get expense details              |
| `/api/v1/expenses/stats/by-category` | GET    | Get expense totals by category   |

## Income

| Endpoint                           | Method | Description                            |
| ---------------------------------- | ------ | -------------------------------------- |
| `/api/v1/income`                   | GET    | List all income entries (with filters) |
| `/api/v1/income`                   | POST   | Create a new income entry              |
| `/api/v1/income`                   | PUT    | Update an income entry                 |
| `/api/v1/income`                   | DELETE | Void an income record                  |
| `/api/v1/income/{id}`              | GET    | Get income entry details               |
| `/api/v1/income/stats/by-category` | GET    | Get income totals by category          |

## Export

| Endpoint         | Method | Description               |
| ---------------- | ------ | ------------------------- |
| `/api/v1/export` | POST   | Generate user data export |

## Newsletter

| Endpoint                            | Method | Description                             |
| ----------------------------------- | ------ | --------------------------------------- |
| `/api/v1/newsletter/subscribe`      | POST   | Subscribe to newsletter                 |
| `/api/v1/newsletter/unsubscribe`    | DELETE | Unsubscribe from newsletter             |
| `/api/v1/newsletter/preferences`    | PUT    | Update newsletter preferences           |
| `/api/v1/newsletter/status`         | GET    | Get newsletter subscription status      |
| `/api/v1/newsletter/send`           | POST   | Send newsletter to subscribers (Admin)  |
| `/api/v1/newsletter/check-inactive` | POST   | Check and notify inactive users (Admin) |

## Common Query Parameters

Many list endpoints support the following query parameters:

| Parameter                | Description              | Example                   |
| ------------------------ | ------------------------ | ------------------------- |
| `page`                   | Page number              | `?page=2`                 |
| `limit`                  | Number of items per page | `?limit=10`               |
| `startDate`              | Start date for filtering | `?startDate=2024-05-01`   |
| `endDate`                | End date for filtering   | `?endDate=2024-05-31`     |
| `search` or `searchTerm` | Text search              | `?search=groceries`       |
| `categoryId`             | Filter by category       | `?categoryId=abc123`      |
| `paymentMethodId`        | Filter by payment method | `?paymentMethodId=xyz456` |
| `minAmount`              | Minimum amount           | `?minAmount=1000`         |
| `maxAmount`              | Maximum amount           | `?maxAmount=50000`        |

## Status Codes

| Status Code | Description                            |
| ----------- | -------------------------------------- |
| 200         | Success - GET, PUT, PATCH              |
| 201         | Created - POST                         |
| 400         | Bad Request - Invalid parameters       |
| 401         | Unauthorized - Authentication required |
| 403         | Forbidden - Insufficient permissions   |
| 404         | Not Found - Resource not found         |
| 409         | Conflict - Resource conflict           |
