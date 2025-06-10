# CurioPay API

[![Build Status](https://img.shields.io/github/actions/workflow/status/adhamafis/curiopay-api/test-build.yml?branch=main&label=build&style=flat-square)](https://github.com/adhamafis/curiopay-api/actions/workflows/test-build.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

[![API Status](https://img.shields.io/website?style=flat-square&url=https%3A%2F%2Fcuriopay-api-production.up.railway.app/api/v1&logo=railway&logoColor=white&label=API)](https://curiopay-api-production.up.railway.app/api/v1)
[![Documentation](https://img.shields.io/badge/docs-online-brightgreen?style=flat-square&logo=gitbook&logoColor=white)](https://adhamafis.github.io/curiopay-api/)
[![Swagger API](https://img.shields.io/badge/swagger-online-brightgreen?style=flat-square&logo=swagger&logoColor=white)](https://curiopay-api-production.up.railway.app/docs)
[![Open Issues](https://img.shields.io/github/issues/adhamafis/curiopay-api?style=flat-square)](https://github.com/adhamafis/curiopay-api/issues)

[![Maintained](https://img.shields.io/badge/maintained-yes-brightgreen?style=flat-square&logo=github&logoColor=white)](https://github.com/adhamafis/curiopay-api/commits/main)

## 📚 Documentation

### 🔗 Quick Links

- **🚀 [Live API Documentation (Swagger)](https://curiopay-api-production.up.railway.app/docs)** - Interactive API explorer
- **📖 [Complete Documentation](https://adhamafis.github.io/curiopay-api/)** - Full technical documentation
- **🏗️ [Architecture Guide](https://adhamafis.github.io/curiopay-api/architecture/overview/)** - System design and architecture
- **🚢 [Deployment Guide](https://adhamafis.github.io/curiopay-api/deployment/environments/)** - Kubernetes & Helm deployment

## Overview

**CurioPay API** is the newly refactored backend REST API for the existing CurioPay financial management web application. It is designed to provide a secure, performant, and scalable service layer for user authentication, financial data management, expense tracking, and reporting.

This new backend improves upon the previous system by implementing modern security best practices, optimized database interactions, and a modular architecture to support future features such as AI-powered insights.

> **🚧 Development Status**: This backend is currently under active development. I am working on implementing a comprehensive migration plan to seamlessly transition from the existing legacy backend to this new refactored system. The migration strategy includes data migration utilities, API compatibility layers, and gradual feature rollout to ensure zero downtime during the transition.

## Key Features

### 🔐 Security

- **JWT Authentication** with secure token management and expiration policies
- **OAuth Integration** supporting multiple providers (Google, GitHub)
- **Audit Logging** with RSA digital signature verification for integrity
- **Data Encryption** in transit and at rest
- **Rate Limiting** to mitigate brute force and DDoS attacks
- **Environment-Based Configuration** with strict validation to prevent misconfiguration
- **Comprehensive Input Validation** to prevent injection and other common attacks
- **CORS Protection** with configurable allowed origins

### ⚡ Performance

- **Database Connection Pooling** for efficient queries
- **Performance Indexes** for optimized data retrieval
- **Efficient Data Processing** via optimized algorithms and data structures
- **Caching Strategies** to minimize database load and improve response times
- **Optimized Query Patterns** to reduce redundant operations

### 🚀 Planned Features

- **LLM Integration:** Enhance AI-powered insights and analytics
- **Comprehensive Automated Testing:** Improve test coverage and reliability
- **CI/CD with GitHub Workflows:** Automate builds, tests, and deployments
- **Enhanced Documentation:** Comprehensive API and technical documentation

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- Database (PostgreSQL)

### Installation

```bash
git clone https://github.com/adhamafis/curiopay-api.git
cd curiopay-api
npm install
```

### Configuration

Copy the example environment file and configure your environment variables:

```bash
cp .env.example .env
```

> For production, ensure all secrets and keys are strong and stored securely.

### Running the Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1` and Swagger documentation at `http://localhost:3000/docs`.

## Deployment

CurioPay API supports deployment using both Kubernetes and Helm:

### Kubernetes Deployment

For deploying directly with Kubernetes manifests, including GitOps-friendly secret management:

- [Kubernetes Deployment Guide](./k8s/README.md)

### Helm Deployment

For deploying with Helm (includes PostgreSQL and Prisma integration):

- [Helm Deployment Guide](./helm/curiopay-api/README.md)

Both deployment methods include:

- PostgreSQL database setup
- Automatic Prisma migrations
- High availability configuration
- Horizontal scaling

> **⚠️ SECURITY WARNING**: Both deployment configurations contain example credentials. Always replace all default credentials and secrets before deploying to production.

## Contributing & Feature Requests

We welcome your contributions!

- **Feature Requests:** Open an issue detailing your idea.
- **Forking Workflow:**

  1. Fork the repo
  2. Clone your fork
  3. Create a feature branch
  4. Commit your changes
  5. Push to your fork
  6. Open a Pull Request to the main repo

## License

This project is licensed under the [Apache License 2.0](LICENSE).
