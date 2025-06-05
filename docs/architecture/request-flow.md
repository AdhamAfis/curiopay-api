# Request Flow

This document outlines the request flow through the CurioPay API system, showing how requests are processed from client to database and back.

## Standard API Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant NestJSMiddleware as Middleware
    participant Guards
    participant Controller
    participant Service
    participant Repository
    participant Database

    Client->>+NestJSMiddleware: HTTP Request

    NestJSMiddleware->>NestJSMiddleware: Apply global middleware
    NestJSMiddleware->>+Guards: Pass request

    Guards->>Guards: Validate JWT token
    Guards->>Guards: Check permissions
    Guards-->>NestJSMiddleware: Unauthorized (if failed)
    Guards->>-NestJSMiddleware: Pass authorized request

    NestJSMiddleware->>+Controller: Route to controller
    Controller->>Controller: Validate input (DTOs)
    Controller->>+Service: Call service method

    Service->>Service: Apply business logic
    Service->>+Repository: Request data access

    Repository->>+Database: Execute query
    Database-->>-Repository: Return data

    Repository-->>-Service: Return processed data
    Service-->>-Controller: Return result

    Controller->>Controller: Transform response
    Controller-->>-NestJSMiddleware: Return response

    NestJSMiddleware->>NestJSMiddleware: Apply interceptors
    NestJSMiddleware-->>Client: HTTP Response
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant UsersService
    participant JwtService
    participant Database

    Client->>+AuthController: POST /auth/login
    AuthController->>+AuthService: login(credentials)

    AuthService->>+UsersService: validateUser(email, password)
    UsersService->>+Database: Find user & credentials
    Database-->>-UsersService: User data

    UsersService->>UsersService: Verify password hash
    UsersService-->>-AuthService: Validated user or null

    alt Invalid credentials
        AuthService-->>AuthController: Throw UnauthorizedException
        AuthController-->>Client: 401 Unauthorized
    else Valid credentials
        alt MFA enabled
            AuthService->>AuthService: Generate temporary token
            AuthService-->>AuthController: {requireMfa: true, tempToken}
            AuthController-->>Client: 200 OK with MFA required

            Client->>+AuthController: POST /auth/mfa/verify
            AuthController->>+AuthService: verifyMfa(code, tempToken)
            AuthService->>AuthService: Validate MFA code
            AuthService->>+JwtService: Generate JWT token
            JwtService-->>-AuthService: JWT access token
            AuthService-->>-AuthController: {accessToken, user}
            AuthController-->>-Client: 200 OK with token
        else MFA not enabled
            AuthService->>+JwtService: Generate JWT token
            JwtService-->>-AuthService: JWT access token
            AuthService-->>-AuthController: {accessToken, user}
            AuthController-->>-Client: 200 OK with token
        end
    end
```

## OAuth Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant Provider as OAuth Provider
    participant Strategy as OAuth Strategy
    participant AuthService
    participant UsersService
    participant JwtService
    participant Database

    Client->>AuthController: GET /auth/google
    AuthController->>Provider: Redirect to provider
    Provider->>Client: Show consent screen
    Client->>Provider: Authorize app
    Provider->>AuthController: Callback with code
    AuthController->>Strategy: Process callback
    Strategy->>Provider: Exchange code for tokens
    Provider->>Strategy: Access tokens

    Strategy->>Strategy: Extract user profile
    Strategy->>+AuthService: validateOAuthUser(profile)

    AuthService->>+UsersService: findOrCreateFromOAuth(profile)
    UsersService->>+Database: Find user by provider ID
    Database-->>-UsersService: User data or null

    alt New user
        UsersService->>+Database: Create user
        Database-->>-UsersService: New user data
    end

    UsersService-->>-AuthService: User entity

    AuthService->>+JwtService: Generate JWT token
    JwtService-->>-AuthService: JWT access token

    AuthService-->>Strategy: Return authenticated user
    Strategy-->>AuthController: Redirect with token
    AuthController-->>Client: 302 Redirect with token
```

## Data Modification Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant JwtAuthGuard
    participant Service
    participant AuditService
    participant Repository
    participant Database

    Client->>+Controller: POST/PUT/DELETE request
    Controller->>+JwtAuthGuard: Authenticate request

    JwtAuthGuard->>JwtAuthGuard: Validate JWT token
    JwtAuthGuard->>JwtAuthGuard: Extract user from token
    JwtAuthGuard-->>Controller: Add user to request
    JwtAuthGuard-->>Controller: Unauthorized (if failed)

    Controller->>Controller: Validate request data (DTO)
    Controller->>+Service: Call service method

    Service->>Service: Apply business rules
    Service->>+Repository: Execute operation
    Repository->>+Database: Update data
    Database-->>-Repository: Return result

    Service->>+AuditService: Log operation
    AuditService->>+Database: Write audit log
    Database-->>-AuditService: Confirm
    AuditService-->>-Service: Operation logged

    Repository-->>-Service: Return operation result
    Service-->>-Controller: Return processed result

    Controller->>Controller: Transform response
    Controller-->>-Client: HTTP Response
```

## Error Handling Flow

```mermaid
sequenceDiagram
    participant Client
    participant NestJSMiddleware as Middleware
    participant ExceptionFilters
    participant Controller
    participant Service

    Client->>+NestJSMiddleware: HTTP Request
    NestJSMiddleware->>+Controller: Route to controller

    alt Service error
        Controller->>+Service: Call method
        Service->>Service: Process request
        Service-->>Controller: Throw exception
    else Controller error
        Controller->>Controller: Process request
        Controller->>Controller: Throw exception
    end

    Controller-->>+ExceptionFilters: Exception caught

    ExceptionFilters->>ExceptionFilters: Map exception to HTTP response
    ExceptionFilters->>ExceptionFilters: Format error message
    ExceptionFilters->>ExceptionFilters: Add error code

    alt Production environment
        ExceptionFilters->>ExceptionFilters: Remove sensitive details
    end

    ExceptionFilters-->>-NestJSMiddleware: Formatted error response
    NestJSMiddleware-->>-Client: HTTP Error Response
```
