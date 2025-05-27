# Stage 1: Build
FROM node:23.11.1-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm audit fix --omit=dev || true
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:23.11.1-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY .env .
EXPOSE 3000
CMD ["node", "dist/main.js"]