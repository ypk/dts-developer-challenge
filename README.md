# DTS Developer Challenge

This repository contains a case management application built with Node.js, Express, TypeScript, and Prisma ORM with a PostgreSQL database.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Logging](#logging)
- [Project Structure](#project-structure)
- [Development Guidelines](#development-guidelines)
- [Docker Configuration](#docker-configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v20 or later)   
- Docker and Docker Compose
- Git

## Getting Started

**Clone the Repository**
```bash
git clone https://github.com/ypk/dts-developer-challenge.git
cd dts-developer-challenge
```

## Environment Setup

The application uses environment files for configuration. Two environment files are provided:
- `.env.development` - For development environment (port 3000, database port 5432)
- `.env.production` - For production environment (port 8080, database port 5433)

## Running the Application

### Development Mode
To run the application in development mode with hot-reloading:
```bash
npm run docker:dev:build
```

This command:
- Builds the Docker containers using development target
- Starts the PostgreSQL database on port 5432
- Runs database migrations with `prisma migrate dev`
- Seeds the database with sample data
- Starts the application in development mode with file watching

**Application available at:** http://localhost:3000

### Production Mode
To run the application in production mode:
```bash
npm run docker:prod:build
```

This command:
- Builds the Docker containers using production target
- Starts the PostgreSQL database on port 5433
- Runs database migrations with `prisma migrate deploy` (production-safe)
- Seeds the database with sample data
- Starts the application in production mode

**Application available at:** http://localhost:8080

### Local Development (without Docker)
```bash
# Install dependencies
npm install

# Set up environment
npm run setup

# Build SASS styles
npm run sass

# Start development server
npm run dev
```

### Stopping the Application
To stop and remove all containers:
```bash
npm run docker:down
```

## Available Scripts

### Development
- `npm run dev` - Run the application locally in development mode
- `npm run dev:server` - Start development server with nodemon
- `npm run sass:watch` - Watch and compile SASS files

### Build & Production
- `npm run build` - Build the TypeScript application
- `npm run start` - Start the built application
- `npm run sass` - Compile SASS styles

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Docker Commands
- `npm run docker:dev` - Start the application in development mode with Docker
- `npm run docker:dev:build` - Build and start the application in development mode
- `npm run docker:prod` - Start the application in production mode with Docker
- `npm run docker:prod:build` - Build and start the application in production mode
- `npm run docker:down` - Stop and remove all Docker containers

### Database Commands

#### Production-Safe Commands
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Deploy database migrations (production-safe)
- `npm run prisma:seed` - Seed the database with sample data

#### Development-Only Commands
- `npm run prisma:dev:migrate` - Create and apply migrations in development
- `npm run prisma:dev:reset` - ⚠️ **DANGER**: Reset database (deletes all data)
- `npm run prisma:dev:seed` - Seed database (alias for prisma:seed)

### Code Quality
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Testing

The project uses Jest for testing. Tests are located in the `src/__tests__` directory.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Test individual components and services
- **Integration Tests**: Test API endpoints and database operations
- **Route Tests**: Test Express route configurations

## API Documentation

The application includes Swagger/OpenAPI documentation for all API endpoints.

**Access the documentation:**
- **Development**: http://localhost:3000/api-docs
- **Production**: http://localhost:8080/api-docs
- **JSON Schema**: `/api-docs.json`

### API Endpoints

#### Cases
- `GET /api/cases` - Get all cases (with pagination)
- `GET /api/cases/:id` - Get case by ID
- `POST /api/cases` - Create new case
- `PUT /api/cases/:id` - Update case
- `PATCH /api/cases/:id/status` - Update case status
- `DELETE /api/cases/:id` - Delete case

#### Web Interface
- `GET /` - Home page
- `GET /cases` - Cases list view
- `GET /cases/new` - Create case form
- `GET /cases/:id` - Case details view
- `GET /cases/:id/edit` - Edit case form

## Database

The application uses PostgreSQL as its database. The schema is defined in `prisma/schema.prisma`.

### Database Ports
- **Development**: localhost:5432
- **Production**: localhost:5433

### Database Schema
- **Cases**: Main entity with fields for title, description, status, due date, and timestamps
- **Status Types**: PENDING, IN_PROGRESS, COMPLETED

### Migration Strategy
- **Development**: Uses `prisma migrate dev` for interactive migrations
- **Production**: Uses `prisma migrate deploy` for safe, non-interactive deployments

## Logging

The application uses **Winston** for structured logging with automatic request/response tracking.

### Log Configuration

- **Log Level**: `info` (default)
- **Format**: JSON with timestamps for files, colorized simple format for console
- **Service Identifier**: All logs include `service: 'case-management-api'`

### Log Files

Logs are automatically written to the `logs/` directory:

```
logs/
├── error.log      # Error level logs only (HTTP 4xx/5xx responses, application errors)
├── combined.log   # All logs (info, error, etc.)
```

**Note**: File logging is disabled during testing to avoid cluttering test output.

### What You'll See in Logs

#### HTTP Request Logging
Every HTTP request is automatically logged twice:

**1. Request Received:**
```json
{
  "message": "Request received",
  "method": "GET",
  "url": "/api/cases",
  "ip": "127.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "service": "case-management-api",
  "timestamp": "2023-12-01T10:30:45.123Z"
}
```

**2. Request Completed:**
```json
{
  "message": "Request completed", 
  "method": "GET",
  "url": "/api/cases",
  "statusCode": 200,
  "duration": "45ms",
  "ip": "127.0.0.1",
  "service": "case-management-api",
  "timestamp": "2023-12-01T10:30:45.168Z"
}
```

#### Console Output

In development, you'll see logs in the console

### Log Levels

| Level | Description | Examples |
|-------|-------------|----------|
| `error` | Application errors, HTTP 4xx/5xx responses | Database connection failures, validation errors, not found errors |
| `info` | General application flow | HTTP requests, successful operations, server startup |

## Project Structure

```
src/
├── __tests__/                 # Test files
│   ├── controllers/           # Controller tests
│   ├── routes/                # Route tests
│   └── services/              # Service tests
├── controllers/               # Request handlers
├── middleware/                # Express middleware
├── repositories/              # Data access layer
├── routes/                    # Route definitions
├── services/                  # Business logic
├── utils/                     # Utility functions
├── views/                     # EJS templates
└── server.ts                  # Application entry point

prisma/
├── migrations/                # Database migrations
├── schema.prisma              # Database schema
└── seed.ts                    # Database seeding script

docker/
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Development configuration
└── docker-compose.prod.yml    # Production configuration
```

## Development Guidelines

### ES Modules Configuration
This project uses ES Modules with NodeNext resolution. Key points:

- **Import Extensions**: Use `.js` extensions for relative imports in TypeScript files
- **Reason**: TypeScript compiles `.ts` → `.js`, so import paths must reference output files
- **Example**: `import { something } from './utils/helper.js'`

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks for code quality

### Middleware Architecture
The application uses a layered architecture:
1. **Routes** - Define endpoints and apply middleware
2. **Controllers** - Handle HTTP requests/responses
3. **Services** - Business logic
4. **Repositories** - Data access
5. **Database** - Prisma ORM with PostgreSQL

## Docker Configuration

### Multi-Stage Build
The Dockerfile uses multi-stage builds for optimal image sizes:

- **Base**: Common Node.js setup
- **Development**: Full source code with dev dependencies
- **Builder**: Compiles TypeScript and prepares artifacts
- **Production**: Lean image with only compiled code and runtime dependencies

### Service Architecture

#### Development (`docker-compose.yml`)
- **app**: Main application with hot-reloading
- **migrate**: Runs development migrations
- **seed**: Seeds database with test data
- **db**: PostgreSQL database

#### Production (`docker-compose.prod.yml`)
- **app**: Production-optimized application
- **migrate**: Runs production-safe migrations
- **db**: PostgreSQL database with production settings

### Key Differences: Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| **Build Target** | `development` | `production` |
| **Port** | 3000 | 8080 |
| **Database Port** | 5432 | 5433 |
| **Migrations** | `prisma migrate dev` | `prisma migrate deploy` |
| **Hot Reload** | Enabled | Disabled |
| **Source Maps** | Included | Excluded |
| **Dependencies** | All (including dev) | Production only |

## Troubleshooting

### Common Issues

#### Import Errors
```
Cannot find module './some-file'
```
**Solution**: Ensure relative imports use `.js` extensions
```typescript
// Wrong
import { helper } from './utils/helper';

// Correct
import { helper } from './utils/helper.js';
```

#### Database Migration Errors
```
Error: Environment variable not found: DATABASE_URL
```
**Solution**: Ensure you're using the correct environment
```bash
# Check which environment command is being used
npm run docker:dev:build      # Uses .env.development
npm run docker:prod:build     # Uses .env.production
```

#### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**: Stop existing processes or use different ports

```bash
# Stop all Docker containers
npm run docker:down
```

**Linux/macOS:**
```bash
# Check what's using the port
lsof -i :3000
```

**Windows (Command Prompt):**
```bash
# Check what's using the port
netstat -ano | findstr :3000
```

#### Docker Build Failures
```bash
# Clean rebuild
npm run docker:down
docker system prune -f
npm run docker:dev:build
```

#### Migration Issues in Production
```
Error: Prisma schema validation failed
```
**Solution**: Ensure migration service uses development target (has source files)

### Development Tips

1. **Hot Reloading**: Use `npm run dev` for automatic server restart
2. **Database Reset**: Use `npm run prisma:dev:reset` to reset database in development
3. **Logs**: Check Docker logs with `docker compose logs -f`
4. **Database GUI**: Connect to PostgreSQL with your preferred client
5. **API Testing**: Use the Swagger UI at `/api-docs` for interactive testing

### Environment Variables

#### Required Variables
- `NODE_ENV` - Environment (development/production/test)
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Application port
- `SESSION_SECRET` - Session encryption secret (required in production)

#### Database Variables
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name
- `POSTGRES_PORT` - Database port

### Performance Monitoring

Monitor request performance through logs:
- Watch `duration` field for slow requests
- Check `statusCode` for error patterns
- Use `ip` field for request tracking
- Monitor `error.log` for application issues

### Security Considerations

- Session secrets are required in production
- Security headers are configured via environment variables
- Database credentials should be secure in production
- HTTPS should be configured in production deployment

