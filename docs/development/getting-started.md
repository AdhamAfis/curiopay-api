# Getting Started

This guide will help you set up the CurioPay API development environment on your local machine.

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Docker and Docker Compose (for local database)
- Git

## Clone the Repository

```bash
git clone https://github.com/adhamafis/curiopay-api.git
cd curiopay-api
```

## Install Dependencies

```bash
npm install
```

## Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your local settings.

## Database Setup

### Option 1: Local PostgreSQL Instance

If you have PostgreSQL installed locally, update the database connection string in your `.env` file:

```
DATABASE_URL="postgresql://username:password@localhost:5432/curiopay?schema=public"
```

### Option 2: Docker (Recommended)

Run a PostgreSQL instance using Docker:

```bash
docker-compose up -d db
```

## Database Migration

Apply the database migrations:

```bash
npx prisma migrate dev
```

Seed the database with initial data:

```bash
npm run seed
```

## Running the Application

### Development Mode

```bash
npm run start:dev
```

The API will be available at: http://localhost:3000

### Production Build

```bash
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:

http://localhost:3000/api-docs

## Testing

### Running Unit Tests

```bash
npm run test
```

### Running E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

## Helpful Commands

- Generate a new module: `nest g module module-name`
- Generate a new controller: `nest g controller controller-name`
- Generate a new service: `nest g service service-name`
- Generate a migration: `npx prisma migrate dev --name migration-name`

## Development Workflow

1. Create a new feature branch from `main`
2. Make your changes
3. Write tests
4. Ensure all tests pass
5. Submit a pull request

## Coding Standards

Follow the project's coding standards defined in the ESLint and Prettier configurations:

- Run linting: `npm run lint`
- Run formatting: `npm run format`
