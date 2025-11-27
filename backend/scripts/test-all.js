#!/usr/bin/env node

/**
 * Script de test global pour vérifier toutes les modifications
 */

import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🧪 Tests Globaux du Projet SIFC\n')

const tests = [
  {
    name: '🧹 Nettoyage des modèles (Redis)',
    command: 'npm run test:cleanup',
    description: 'Vérification du nettoyage après intégration Redis',
  },
  {
    name: '👥 Types de rôles utilisateur',
    command: 'npm run test:roles',
    description: 'Vérification des types et constantes de rôles',
  },
  {
    name: '🔗 Connexion Redis',
    command: 'npm run test:redis',
    description: 'Test de la connectivité et fonctionnalités Redis',
  },
]

let allTestsPassed = true
const results = []

console.log('📋 Exécution des tests...\n')

for (const test of tests) {
  console.log(`${test.name}`)
  console.log(`   ${test.description}`)

  try {
    const output = execSync(test.command, {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
    })

    console.log('   ✅ RÉUSSI\n')
    results.push({ ...test, status: 'RÉUSSI', output })
  } catch (error) {
    console.log('   ❌ ÉCHEC\n')
    console.log(`   Erreur: ${error.message}\n`)
    allTestsPassed = false
    results.push({ ...test, status: 'ÉCHEC', error: error.message })
  }
}

console.log('📊 Résumé des Tests\n')

results.forEach((result, index) => {
  const status = result.status === 'RÉUSSI' ? '✅' : '❌'
  console.log(`${index + 1}. ${status} ${result.name}`)
})

console.log('\n📈 Statistiques:')
const passed = results.filter((r) => r.status === 'RÉUSSI').length
const failed = results.filter((r) => r.status === 'ÉCHEC').length
console.log(`   Réussis: ${passed}/${results.length}`)
console.log(`   Échoués: ${failed}/${results.length}`)

if (allTestsPassed) {
  console.log('\n🎉 Tous les tests sont passés!')
  console.log('\n✨ État du Projet:')
  console.log('   ✅ Redis intégré et fonctionnel')
  console.log('   ✅ Modèles nettoyés et optimisés')
  console.log('   ✅ Rôles utilisateur refactorisés')
  console.log('   ✅ Types centralisés et réutilisables')
  console.log('   ✅ Migrations prêtes à être exécutées')

  console.log('\n📝 Prochaines Étapes:')
  console.log('1. Exécuter les migrations: npm run migration:run')
  console.log("2. Tester l'authentification complète")
  console.log('3. Créer des contrôleurs avec les nouveaux types')
  console.log("4. Implémenter les middleware d'autorisation")
  console.log("5. Tests d'intégration complets")
} else {
  console.log('\n❌ Certains tests ont échoué!')
  console.log('Veuillez corriger les erreurs avant de continuer.')
  process.exit(1)
}

console.log('\n📚 Documentation Disponible:')
console.log('   📄 REDIS_SETUP.md - Configuration Redis')
console.log('   📄 REDIS_CLEANUP.md - Nettoyage des modèles')
console.log('   📄 USER_ROLES_UPDATE.md - Refactorisation des rôles')
console.log('   📄 MIGRATION_SUMMARY.md - Résumé complet des migrations')

console.log('\n🔧 Commandes Utiles:')
console.log('   npm run test:all - Exécuter tous les tests')
console.log('   npm run test:redis - Tester Redis uniquement')
console.log('   npm run test:roles - Tester les rôles uniquement')
console.log('   npm run test:cleanup - Tester le nettoyage uniquement')
console.log('   npm run migration:run - Exécuter les migrations')
console.log('   npm run migration:status - Statut des migrations')
