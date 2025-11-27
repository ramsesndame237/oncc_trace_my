# Dockerfile pour AdonisJS - Build multi-stage pour optimiser la taille
FROM node:20-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    dumb-init \
    postgresql-client \
    netcat-openbsd \
    curl

# Créer l'utilisateur app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 adonisjs

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./
COPY adonisrc.ts ./

# Stage de développement
FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY . .

# Copier et rendre exécutable le script d'entrée
COPY ./docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN chown -R adonisjs:nodejs /app
USER adonisjs
EXPOSE ${PORT:-3333}
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["dumb-init", "npm", "run", "dev"]

# Stage de build
FROM base AS build
ENV NODE_ENV=development
# Installer TOUTES les dépendances (y compris devDependencies) pour le build
RUN npm ci
COPY . .
RUN npm run build
# Nettoyer les devDependencies après le build
RUN npm prune --production && npm cache clean --force

# Stage de production
FROM node:20-alpine AS production

# Installer dumb-init et postgresql-client
RUN apk add --no-cache dumb-init postgresql-client netcat-openbsd curl

# Créer l'utilisateur app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 adonisjs

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de production depuis le stage build
# On copie le contenu de build directement dans /app
COPY --from=build --chown=adonisjs:nodejs /app/build/ ./
COPY --from=build --chown=adonisjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=adonisjs:nodejs /app/package*.json ./

# Copier les données de seed pour l'initialisation
COPY --chown=adonisjs:nodejs seed_data ./seed_data

# Copier et rendre exécutable le script d'entrée
COPY ./docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Créer les répertoires nécessaires
RUN mkdir -p uploads logs tmp && \
    chown -R adonisjs:nodejs uploads logs tmp

# Passer à l'utilisateur non-root
USER adonisjs

# Exposer le port
EXPOSE ${PORT:-3333}

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3333}/api/v1/health || exit 1

# Commande de démarrage
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["dumb-init", "node", "bin/server.js"]
