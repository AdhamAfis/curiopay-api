# Security Architecture

CurioPay API incorporates multiple layers of security to protect sensitive financial data and ensure user privacy.

## Security Layers

```mermaid
flowchart TD
    subgraph "Network Security"
        direction TB
        TLS["TLS/SSL Encryption"]
        WAF["Web Application Firewall"]
        CORS["CORS Policy"]
        IPS["IP Filtering"]
    end

    subgraph "Application Security"
        direction TB
        Auth["Authentication"]
        Authz["Authorization"]
        Input["Input Validation"]
        CSRF["CSRF Protection"]
        XSS["XSS Prevention"]
        Helmet["Security Headers"]
    end

    subgraph "Data Security"
        direction TB
        Encrypt["Data Encryption"]
        Masking["Data Masking"]
        MinData["Data Minimization"]
        DataPart["Data Partitioning"]
    end

    subgraph "Infrastructure Security"
        direction TB
        SecCont["Secure Containers"]
        NetPol["Network Policies"]
        SecCtx["Security Context"]
    end

    subgraph "Operational Security"
        direction TB
        Audit["Audit Logging"]
        Monitor["Security Monitoring"]
        Updates["Regular Updates"]
        SAST["Static Analysis"]
    end

    Client -->|"Accesses"| TLS
    TLS --> WAF
    WAF --> CORS
    CORS --> IPS
    IPS --> Auth
    Auth --> Authz
    Authz --> Input
    Input --> CSRF
    CSRF --> XSS
    XSS --> Helmet
    Helmet --> Encrypt
    Encrypt --> Masking
    Masking --> MinData
    MinData --> DataPart
    DataPart --> Database

    SecCont --- Auth
    NetPol --- Input
    SecCtx --- Helmet

    Audit --- Encrypt
    Monitor --- Masking
    Updates --- MinData
    SAST --- DataPart
```

## Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant JWTGuard as JWT Guard
    participant RolesGuard as Roles Guard
    participant ThrottleGuard as Throttle Guard
    participant Controller

    User->>API: Request with JWT
    API->>ThrottleGuard: Check rate limits

    alt Rate limit exceeded
        ThrottleGuard-->>User: 429 Too Many Requests
    else Rate limit ok
        ThrottleGuard->>JWTGuard: Validate token

        alt Invalid token
            JWTGuard-->>User: 401 Unauthorized
        else Valid token
            JWTGuard->>JWTGuard: Decode user data
            JWTGuard->>RolesGuard: Check permissions

            alt Insufficient permissions
                RolesGuard-->>User: 403 Forbidden
            else Permissions ok
                RolesGuard->>Controller: Execute request
                Controller-->>User: 200 OK with response
            end
        end
    end
```

## Data Encryption Strategy

```mermaid
flowchart LR
    subgraph "Transport Layer"
        TLS["TLS 1.3"]
    end

    subgraph "Application Layer"
        JWT["JWT Encryption"]
        Payload["Payload Encryption"]
    end

    subgraph "Database Layer"
        Column["Column-level Encryption"]
        TDE["Transparent Data Encryption"]
    end

    subgraph "Key Management"
        KMS["Key Management Service"]
        Rotation["Key Rotation"]
        MasterKey["Master Keys"]
    end

    Client <--> TLS
    TLS <--> JWT
    TLS <--> Payload
    JWT --> Column
    Payload --> Column

    Column <--> KMS
    TDE <--> KMS
    KMS <--> Rotation
    KMS <--> MasterKey
```

## Multi-Factor Authentication

```mermaid
sequenceDiagram
    participant User
    participant API
    participant AuthService
    participant Database

    User->>API: Login with username/password
    API->>AuthService: Validate credentials
    AuthService->>Database: Check credentials
    Database-->>AuthService: User with MFA enabled

    AuthService->>AuthService: Generate temporary token
    AuthService-->>API: MFA required + temp token
    API-->>User: Prompt for MFA code

    User->>API: Submit MFA code + temp token
    API->>AuthService: Verify MFA code
    AuthService->>AuthService: Validate OTP code

    alt Invalid MFA code
        AuthService-->>API: Authentication failed
        API-->>User: 401 Unauthorized
    else Valid MFA code
        AuthService->>AuthService: Generate JWT token
        AuthService-->>API: Authentication successful
        API-->>User: 200 OK with JWT token
    end
```

## Audit Logging System

```mermaid
classDiagram
    class AuditLog {
        +id: string
        +userId: string
        +timestamp: DateTime
        +action: string
        +resourceType: string
        +resourceId: string
        +oldValues: Json
        +newValues: Json
        +ipAddress: string
        +userAgent: string
        +status: string
        +metadata: Json
    }

    class AuditService {
        +logAction(action, resource, userId)
        +logDataChange(resource, oldData, newData, userId)
        +logAuthEvent(event, userId, status)
        +queryAuditLogs(filters)
    }

    class AuditInterceptor {
        +intercept(context, next)
    }

    AuditService --> AuditLog : creates
    AuditInterceptor --> AuditService : uses
```

## Security Controls by Data Sensitivity

```mermaid
flowchart TD
    subgraph "Public Data"
        PD1["Category Names"]
        PD2["Public User Profiles"]
    end

    subgraph "Internal Data"
        ID1["Aggregated Statistics"]
        ID2["System Logs"]
        ID3["Expense Amounts"]
    end

    subgraph "Sensitive Data"
        SD1["User Email"]
        SD2["Full Names"]
        SD3["Transaction Details"]
    end

    subgraph "Highly Sensitive Data"
        HSD1["Password Hashes"]
        HSD2["MFA Secrets"]
        HSD3["Payment Details"]
    end

    Public["Basic Security Controls"] --> PD1
    Public --> PD2

    Standard["Standard Security Controls"] --> ID1
    Standard --> ID2
    Standard --> ID3

    Enhanced["Enhanced Security Controls"] --> SD1
    Enhanced --> SD2
    Enhanced --> SD3

    Strict["Strict Security Controls"] --> HSD1
    Strict --> HSD2
    Strict --> HSD3

    classDef public fill:#c1e1c5
    classDef internal fill:#c4def6
    classDef sensitive fill:#ffe066
    classDef highSensitive fill:#ffb3b3

    class PD1,PD2 public
    class ID1,ID2,ID3 internal
    class SD1,SD2,SD3 sensitive
    class HSD1,HSD2,HSD3 highSensitive
```
