#!/bin/sh
set -e

echo "🚀 Démarrage du container SIFC API..."

# Fonction pour vérifier si l'initialisation a déjà été faite
check_initialization_done() {
    # Vérifier d'abord si la table users existe
    local table_exists=$(psql -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-sifc_user}" -d "${DB_DATABASE:-sifc_db}" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');" 2>/dev/null | tr -d ' ' || echo "f")

    if [ "$table_exists" = "t" ]; then
        # La table existe, vérifier s'il y a des utilisateurs
        local user_count=$(psql -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-sifc_user}" -d "${DB_DATABASE:-sifc_db}" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
        if [ "$user_count" -gt 0 ]; then
            return 0  # Initialisation déjà faite
        fi
    fi
    return 1  # Initialisation pas encore faite
}

# Fonction pour attendre que PostgreSQL soit prêt
wait_for_postgres() {
    echo "⏳ Attente de PostgreSQL..."
    until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-sifc_user}"; do
        echo "PostgreSQL n'est pas encore prêt - attente..."
        sleep 2
    done
    echo "✅ PostgreSQL est prêt!"
}

# Fonction pour attendre que Redis soit prêt
wait_for_redis() {
    echo "⏳ Attente de Redis..."
    until nc -z "${REDIS_HOST:-redis}" "${REDIS_PORT:-6379}"; do
        echo "Redis n'est pas encore prêt - attente..."
        sleep 2
    done
    echo "✅ Redis est prêt!"
}

# Fonction pour réinitialiser la base de données
reset_database() {
    echo "🔄 Réinitialisation de la base de données..."

    echo "🗑️ Suppression de toutes les données..."

    if node ace migration:fresh --force; then
        echo "✅ Réinitialisation terminée avec succès"
    else
        echo "❌ Erreur lors de la réinitialisation"
    fi
}

# Fonction pour exécuter les migrations et seeders
run_database_setup() {
    echo "🗄️ Exécution des migrations..."
    if node ace migration:run --force; then
        echo "✅ Migrations terminées avec succès"
    else
        echo "❌ Erreur lors des migrations"
        exit 1
    fi

    echo "🌱 Exécution des seeders..."
    if node ace db:seed; then
        echo "✅ Seeders terminés avec succès"
    else
        echo "⚠️ Erreur lors des seeders (continuons quand même)"
    fi
}

# Attendre les services dépendants
wait_for_postgres
wait_for_redis

# Exécuter les migrations et seeders seulement si demandé
if [ "${RUN_SEEDERS}" = "true" ]; then
  # Vérifier si on doit réinitialiser la base de données
  if ! check_initialization_done; then
    echo "🚀 Première initialisation de la base de données..."
    if [ "${RESET_DATABASE}" = "true" ]; then
      echo "🔄 RESET_DATABASE=true détecté - Réinitialisation forcée de la base de données..."
      reset_database
      echo "🚀 Initialisation complète de la base de données..."
    fi
    run_database_setup
    echo "✅ Initialisation terminée."
  else
    echo "✅ Initialisation déjà effectuée (utilisateurs détectés dans la DB), on saute."
    echo "💡 Utilisez RESET_DATABASE=true pour forcer la réinitialisation."
  fi
else
  if [ "${RESET_DATABASE}" = "true" ]; then
    if ! check_initialization_done; then
      echo "🔄 RESET_DATABASE=true détecté - Réinitialisation forcée de la base de données..."
      reset_database
    fi
  else
    echo "ℹ️  RUN_SEEDERS n'est pas 'true', on saute l'initialisation."
  fi
fi

echo "🎯 (${DEPLOY_MODE}) Démarrage de l'application..."

# Exécuter la commande passée en argument (ou la commande par défaut)
exec "$@"
