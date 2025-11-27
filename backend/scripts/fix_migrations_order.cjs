#!/usr/bin/env node

/**
 * Script pour réorganiser les migrations dans le bon ordre de dépendances
 */

const fs = require('fs')
const path = require('path')

const migrationsDir = path.join(__dirname, '..', 'database', 'migrations')

// Ordre correct des migrations (sans dépendances vers autres tables)
const migrationOrder = [
  // 1. Tables de base sans dépendances
  { old: 'create_locations_table', new: '1749346741904_create_locations_table' },
  { old: 'create_production_basins_table', new: '1749346783391_create_production_basins_table' },

  // 2. Tables avec dépendances simples
  {
    old: 'create_create_user_production_basins_table',
    new: '1749346818841_create_create_user_production_basins_table',
  },
  { old: 'create_actors_table', new: '1749346956911_create_actors_table' },

  // 3. Table users (dépend de actors et production_basins)
  { old: 'create_users_table', new: '1749346959000_create_users_table' },

  // 4. Tables qui dépendent de users
  { old: 'create_access_tokens_table', new: '1749346960000_create_access_tokens_table' },
  { old: 'create_campaigns_table', new: '1749346961000_create_campaigns_table' },

  // 5. Tables avec dépendances multiples
  { old: 'create_producteur_opa_table', new: '1749346962000_create_producteur_opa_table' },
  {
    old: 'create_exportateur_mandataires_table',
    new: '1749346963000_create_exportateur_mandataires_table',
  },
  { old: 'create_stores_table', new: '1749347033443_create_stores_table' },

  // 6. Tables de liaison et métadonnées
  { old: 'create_magasin_campagnes_table', new: '1749350000006_create_magasin_campagnes_table' },
  { old: 'create_magasin_occupants_table', new: '1749350000007_create_magasin_occupants_table' },
  { old: 'create_parcelles_table', new: '1749350000008_create_parcelles_table' },
  { old: 'create_metadata_table', new: '1749350000009_create_metadata_table' },
  { old: 'create_submissions_table', new: '1749350000010_create_submissions_table' },
  { old: 'create_notifications_table', new: '1749350000011_create_notifications_table' },
  { old: 'create_documents_table', new: '1749347085659_create_documents_table' },
  { old: 'create_audit_logs_table', new: '1749347124612_create_audit_logs_table' },

  // 7. Contraintes métier (à la fin)
  { old: 'add_business_constraints', new: '1749350000012_add_business_constraints' },

  // 8. Modifications de tables existantes (tout à la fin)
  { old: 'remove_last_login_from_users', new: '1749370000002_remove_last_login_from_users' },
  { old: 'update_user_roles', new: '1749370000001_update_user_roles' },
]

console.log('🔧 Réorganisation des migrations...')

// Lister tous les fichiers de migration actuels
const files = fs.readdirSync(migrationsDir)
const migrationFiles = files.filter((file) => file.endsWith('.ts'))

console.log(`📁 ${migrationFiles.length} fichiers de migration trouvés`)

// Renommer les fichiers selon l'ordre correct
migrationOrder.forEach((migration, index) => {
  const currentFile = migrationFiles.find((file) => file.includes(migration.old))

  if (currentFile) {
    const oldPath = path.join(migrationsDir, currentFile)
    const newPath = path.join(migrationsDir, migration.new + '.ts')

    if (oldPath !== newPath) {
      console.log(`📝 ${currentFile} → ${migration.new}.ts`)
      fs.renameSync(oldPath, newPath)
    }
  } else {
    console.log(`⚠️  Migration non trouvée: ${migration.old}`)
  }
})

console.log('✅ Réorganisation terminée!')
console.log('💡 Vous pouvez maintenant exécuter: node ace migration:fresh')
