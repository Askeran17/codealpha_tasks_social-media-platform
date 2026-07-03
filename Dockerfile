# Stage 1: Build the Vite frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build the Express backend and runner
FROM node:20-alpine AS runner
WORKDIR /app

# Copy server package configuration and install dependencies (including devDependencies for tsc)
COPY server/package*.json ./server/
RUN npm --prefix server ci

# Copy server source code and compile
COPY server/ ./server/
RUN npm --prefix server run build

# Prune development dependencies to keep the container size small
RUN npm --prefix server prune --production

# Copy frontend static build assets from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Set environments
ENV NODE_ENV=production

# Expose port (Express uses process.env.PORT, which Render sets, otherwise default to 5001)
EXPOSE 5001

# Command to run
CMD ["npm", "--prefix", "server", "start"]
