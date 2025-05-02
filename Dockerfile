# Base stage for shared dependencies
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

# Build stage
FROM base AS builder
COPY package*.json ./
# Install ALL dependencies (including devDependencies) for building
RUN npm install --include=dev
COPY . .
RUN npx prisma generate
# Run TypeScript compilation
RUN npm run build

# Production stage
FROM base AS production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY package*.json ./
COPY prisma ./prisma

# Set up production environment
USER node
EXPOSE ${PORT}
CMD ["npm", "start"]
