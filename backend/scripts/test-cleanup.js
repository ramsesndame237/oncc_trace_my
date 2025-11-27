#!/usr/bin/env node

/**
 * Script de test pour vérifier le nettoyage des modèles après intégration Redis
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🧹 Test du nettoyage des modèles après intégration Redis\n')

// Vérifications des fichiers
const checks = [
  {
    name: 'Modèle User sans lastLoginAt',
    file: 'app/models/user.ts',
    shouldNotContain: ['lastLoginAt', 'updateLastLogin'],
    shouldContain: ['passwordChangedAt', 'DbAccessTokensProvider'],
  },
  {
    name: 'Migration de suppression créée',
    file: 'database/migrations/1749360000001_remove_last_login_from_users.ts',
    shouldContain: ['dropColumn', 'last_login_at'],
  },
  {
    name: 'Modèle Session avec Redis',
    file: 'app/models/session.ts',
    shouldContain: ['storeSessionMetadata', 'getSessionMetadata', 'redis'],
  },
  {
    name: 'Documentation de nettoyage',
    file: 'REDIS_CLEANUP.md',
    shouldContain: ['lastLoginAt', 'updateLastLogin', 'Redis', 'TTL'],
  },
]

let allPassed = true

checks.forEach((check, index) => {
  console.log(`${index + 1}. ${check.name}`)

  const filePath = path.join(__dirname, '..', check.file)

  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ Fichier non trouvé: ${check.file}`)
    allPassed = false
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Vérifier ce qui ne doit PAS être présent
  if (check.shouldNotContain) {
    const found = check.shouldNotContain.filter((text) => content.includes(text))
    if (found.length > 0) {
      console.log(`   ❌ Contient encore: ${found.join(', ')}`)
      allPassed = false
      return
    }
  }

  // Vérifier ce qui DOIT être présent
  if (check.shouldContain) {
    const missing = check.shouldContain.filter((text) => !content.includes(text))
    if (missing.length > 0) {
      console.log(`   ❌ Manque: ${missing.join(', ')}`)
      allPassed = false
      return
    }
  }

  console.log(`   ✅ OK`)
})

console.log('\n📊 Résumé des vérifications:')

if (allPassed) {
  console.log('✅ Tous les tests sont passés!')
  console.log('\n🎉 Le nettoyage des modèles a été effectué avec succès!')
  console.log('\n📝 Prochaines étapes:')
  console.log('1. Exécuter les migrations: npm run migration:run')
  console.log("2. Tester l'authentification")
  console.log('3. Vérifier que Redis fonctionne: npm run test:redis')
  console.log('4. Déployer en production')
} else {
  console.log('❌ Certains tests ont échoué!')
  console.log('Veuillez vérifier les erreurs ci-dessus.')
  process.exit(1)
}

console.log('\n📚 Documentation:')
console.log('- REDIS_SETUP.md : Configuration Redis')
console.log('- REDIS_CLEANUP.md : Nettoyage des modèles')
console.log('- MIGRATION_SUMMARY.md : Résumé complet')
