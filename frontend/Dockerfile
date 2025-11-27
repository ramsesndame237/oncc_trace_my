# Dockerfile pour Next.js - Build multi-stage pour optimiser la taille
FROM node:20-alpine AS base

# Installer les dependances systeme necessaires
RUN apk add --no-cache libc6-compat curl

# Definir le repertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./

# Stage de dependances et de build
FROM base AS builder
RUN npm ci --include=dev

# Copier tout le code source du frontend
COPY . .

# Copier les fichiers backend nécessaires pour la génération de types
# Note: Ces fichiers doivent être fournis via build args ou volumes en CI/CD
RUN mkdir -p .backend-cache

# Générer les types TypeScript depuis les fichiers backend
RUN npm run generate:types

# Variables d'environnement pour le build
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_DESCRIPTION
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_VERSION
ARG NEXT_PUBLIC_INDEXEDDB_NAME
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET

ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_DESCRIPTION=$NEXT_PUBLIC_APP_DESCRIPTION
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_VERSION=$NEXT_PUBLIC_API_VERSION
ENV NEXT_PUBLIC_INDEXEDDB_NAME=$NEXT_PUBLIC_INDEXEDDB_NAME
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Desactiver la telemetrie Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Optimisations pour le build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build de l'application Next.js
RUN npm run build

# Stage de production
FROM node:20-alpine AS runner

# Installer dumb-init pour une meilleure gestion des signaux
RUN apk add --no-cache dumb-init curl

# Creer l'utilisateur app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Definir le repertoire de travail
WORKDIR /app

# Variables d'environnement de production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copier les fichiers de production depuis le stage builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copier package.json pour reference
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Passer a l'utilisateur non-root
USER nextjs

# Port configurable via build arg (par defaut 3000)
ARG PORT=3000
EXPOSE ${PORT}

# Variables d'environnement runtime
ENV PORT=${PORT}
ENV HOSTNAME="0.0.0.0"

# Healthcheck avec port dynamique
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Commande de demarrage
CMD ["dumb-init", "node", "server.js"]
