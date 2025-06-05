# Architecture Overview

CurioPay API is built using NestJS, a progressive Node.js framework for building efficient and scalable server-side applications.

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **API Documentation**: OpenAPI/Swagger
- **Testing**: Jest
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions

## Application Layers

The application follows a layered architecture:

1. **Controller Layer**: Handles HTTP requests and responses
2. **Service Layer**: Contains business logic
3. **Data Access Layer**: Manages database interactions via Prisma

## Module Structure

The application is organized into feature modules:

- Auth Module
- Users Module
- Payment Methods Module
- Categories Module
- Expenses Module
- Income Module
- Export Module
- Newsletter Module

Each module follows the same structure with controllers, services, DTOs, and other components.

## Cross-Cutting Concerns

Several cross-cutting concerns are handled via NestJS mechanisms:

- **Logging**: Custom logger service and interceptors
- **Error Handling**: Global exception filters
- **Authentication**: JWT guards and strategies
- **Authorization**: Role-based guards
- **Validation**: Class-validator and custom pipes
- **Caching**: Response caching with Redis (for certain endpoints)

## Infrastructure

The application is deployed in a Kubernetes cluster with separate environments for development, staging, and production. Helm charts define the deployment configuration, and Kustomize manages environment-specific settings.
