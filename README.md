# DTS Developer Challenge

This repository contains a case management application built with Node.js, Express, TypeScript, and Prisma ORM with a PostgreSQL database.

## Prerequisites
Before you begin, ensure you have the following installed:
 - Node.js (v20 or later)   
 - Docker and Docker Compose
 - Git

## Getting Started

Clone the Repository

    git clone https://github.com/ypk/dts-developer-challenge.git
    cd dts-developer-challenge
  
## Environment Setup

The application uses environment files for configuration. Two environment files are provided:

  - `.env.development` - For development environment
  - `.env.production` - For production environment

## Running the Application

Development Mode

To run the application in development mode with hot-reloading:

`npm run docker:dev:build`

This command:
 - Builds the Docker containers
 - Starts the PostgreSQL database on port 5432
 - Runs database migrations
 - Seeds the database with sample data
 - Starts the application in development mode

The application will be available at: http://localhost:3000

 ## Production Mode

To run the application in production mode:

    npm run docker:prod:build

 This command:

 - Builds the Docker containers for production
 - Starts the PostgreSQL database on port 5433
 - Runs database migrations
 - Seeds the database with sample data
 - Starts the application in production mode

The application will be available at: http://localhost:3000

 ## Stopping the Application

To stop and remove all containers:

    npm run docker:down

 ## Available Scripts

 - `npm run dev` Run the application locally in development mode
 - `npm run build` Build the TypeScript application
 - `npm run start` Start the built application
 - `npm test` Run tests
 - `npm run docker:dev` Start the application in development mode with Docker
 - `npm run docker:dev:build` Build and start the application in development mode
 - `npm run docker:prod` Start the application in production mode with Docker
 - `npm run docker:prod:build` Build and start the application in production mode
 - `npm run docker:down` Stop and remove all Docker containers
 - `npm run prisma:dev:migrate` Run database migrations in development
 - `npm run prisma:dev:seed` Seed the database with sample data

## Database

The application uses PostgreSQL as its database. The schema is defined in `prisma/schema.prisma` file

When running the application, the database is automatically:

 - Created (if it doesn't exist)
 - Migrated to the latest schema
 - Seeded with sample data

The seed script creates several sample cases with different statuses and due dates.
