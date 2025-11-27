#!/usr/bin/env node

/**
 * Script de test Redis simple
 * Usage: node scripts/test-redis.js
 */

import redis from 'redis'

async function testRedis() {
  console.log('🔄 Test de connexion Redis...\n')

  const client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB || '0'),
  })

  try {
    // Connexion
    console.log('📡 Connexion à Redis...')
    await client.connect()
    console.log('✅ Connexion Redis réussie')

    // Test PING
    console.log('\n🏓 Test PING...')
    const pong = await client.ping()
    console.log(`✅ PING: ${pong}`)

    // Test SET/GET
    console.log('\n💾 Test SET/GET...')
    await client.set('test:key', 'test:value')
    const value = await client.get('test:key')
    console.log(`✅ SET/GET: ${value}`)

    // Test SETEX (avec expiration)
    console.log('\n⏰ Test SETEX...')
    await client.setEx('test:expiring', 5, 'expires in 5 seconds')
    const expiringValue = await client.get('test:expiring')
    console.log(`✅ SETEX: ${expiringValue}`)

    // Test TTL
    const ttl = await client.ttl('test:expiring')
    console.log(`✅ TTL: ${ttl} secondes`)

    // Nettoyage
    console.log('\n🧹 Nettoyage...')
    await client.del('test:key', 'test:expiring')
    console.log('✅ Nettoyage terminé')

    console.log('\n🎉 Tous les tests Redis ont réussi !')
  } catch (error) {
    console.error('\n❌ Erreur Redis:', error.message)
    process.exit(1)
  } finally {
    await client.quit()
    console.log('\n🔌 Connexion Redis fermée')
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error)
  process.exit(1)
})

// Exécution du test
testRedis().catch(console.error)
