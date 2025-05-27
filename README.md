# CurioPay API

Backend REST API for the CurioPay financial management platform. This API is currently under development.

## Overview

CurioPay API provides secure endpoints for financial data management, user authentication, expense tracking, and reporting functionality.

## Key Features

### Security

- **JWT Authentication** with secure token management and proper expiration policies
- **OAuth Integration** with multiple providers (Google, GitHub, Facebook, Apple)
- **Audit Logging** with cryptographic integrity verification using RSA digital signatures
- **Data Encryption** for sensitive information at rest and in transit
- **Rate Limiting** to prevent brute force and DDoS attacks
- **Environment-Based Configuration** with strict validation
- **Input Validation** on all endpoints to prevent injection attacks
- **CORS Protection** with configurable allowed origins

### Performance

- **Database Connection Pooling** for optimized query performance
- **Performance Indexes** for faster data retrieval
- **Efficient Data Processing** with optimized algorithms
- **Caching Strategies** to reduce database load
- **Optimized Query Patterns** to minimize database operations

### Planned Features

- **LLM Integration:** Restore and enhance AI-powered insights and analytics.
- **Comprehensive Automated Testing:** Expand test coverage and reliability.
- **CI/CD with GitHub Workflows:** Automate builds, tests, and deployments for faster, safer releases.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see `.env.example`)
4. Run development server: `npm run start:dev`

## Environment Setup

Set up your environment variables according to `.env.example`. For production, ensure all security-related variables use strong, unique values stored securely.

## Contributing & Feature Requests

- **Feature Requests:** Please open an issue describing your feature idea or enhancement. Include as much detail as possible.
- **Forking:**
  1. Click the "Fork" button at the top right of this repository.
  2. Clone your fork: `git clone https://github.com/adhamafis/curiopay-api.git`
  3. Create a new branch for your feature or fix: `git checkout -b my-feature`
  4. Make your changes and commit them.
  5. Push to your fork: `git push origin my-feature`
  6. Open a pull request to the main repository.

## License
This project is licensed under the [Apache License 2.0](LICENSE).
