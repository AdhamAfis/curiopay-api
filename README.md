# CurioPay API

[![Build Status](https://img.shields.io/github/actions/workflow/status/adhamafis/curiopay-api/test-build.yml?branch=main&label=build&style=flat-square)](https://github.com/adhamafis/curiopay-api/actions/workflows/test-build.yml)
[![License](https://img.shields.io/github/license/adhamafis/curiopay-api?style=flat-square)](https://github.com/adhamafis/curiopay-api/blob/main/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/nest-backend?style=flat-square)](https://www.npmjs.com/package/nest-backend)
[![Node.js](https://img.shields.io/node/v/nest-backend?style=flat-square)](https://nodejs.org/)

<!-- [![Coverage Status](https://img.shields.io/codecov/c/github/adhamafis/curiopay-api?style=flat-square)](https://codecov.io/gh/adhamafis/curiopay-api) -->

[![Open Issues](https://img.shields.io/github/issues/adhamafis/curiopay-api?style=flat-square)](https://github.com/adhamafis/curiopay-api/issues)

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
- **Detailed Mk-docs:** Documentation for the project

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
