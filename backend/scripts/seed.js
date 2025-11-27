#!/usr/bin/env node

/**
 * Script de seeding pour SIFC
 *
 * Usage:
 *   npm run seed              # Mode test par défaut
 *   npm run seed:prod         # Mode production
 *   npm run seed:test         # Mode test explicite
 */

const { execSync } = require('child_process')

// Récupérer le mode depuis les arguments
const args = process.argv.slice(2)
let mode = 'test' // Par défaut

// Vérifier si un mode est spécifié
if (args.includes('--mode=prod') || process.argv.includes('seed:prod')) {
  mode = 'prod'
} else if (args.includes('--mode=test') || process.argv.includes('seed:test')) {
  mode = 'test'
}

console.log(`🌱 Lancement du seeding en mode: ${mode.toUpperCase()}`)
console.log('📍 Importation des localisations depuis localizations.csv...')
console.log('')

try {
  // Exécuter la commande de seeding AdonisJS avec variable d'environnement
  const command = `node ace db:seed`
  execSync(command, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env, SEED_MODE: mode },
  })

  console.log('')
  console.log('✅ Seeding terminé avec succès!')
} catch (error) {
  console.error('')
  console.error('❌ Erreur lors du seeding:', error.message)
  process.exit(1)
}
