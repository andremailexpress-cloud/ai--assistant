FROM node:20-alpine AS base
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source, prisma schema, and shared workspace reference
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 3001

# Migrate then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
