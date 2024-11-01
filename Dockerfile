# Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install

# Copy application files
COPY . .

# Generate Prisma client before building the app
RUN pnpx prisma generate

# Build the app
RUN pnpm run build

# Expose the application port
EXPOSE 4005

# Start the app
CMD ["pnpm", "run", "start:dev"]
