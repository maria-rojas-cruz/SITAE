# Etapa 1: Dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci

# Etapa 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias de compilación
RUN apk add --no-cache libc6-compat python3 make g++

# Copiar dependencias desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno necesarias para el build
# NextAuth requiere NEXTAUTH_URL aunque no se use en build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build de la aplicación
RUN npm run build

# Etapa 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Crear directorio public vacío (Next.js puede necesitarlo)
RUN mkdir -p ./public && chown nextjs:nodejs ./public

# Cambiar a usuario no-root
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicio
CMD ["node", "server.js"]