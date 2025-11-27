/**
 * Script de test pour l'authentification SIFC
 * Usage: node scripts/test_auth.js
 */

const API_BASE = 'http://localhost:3333/api/v1'

async function testHealthCheck() {
  console.log('🔍 Test du health check...')
  try {
    const response = await fetch(`${API_BASE}/health`)
    const data = await response.json()
    console.log('✅ Health check:', data)
    return true
  } catch (error) {
    console.error('❌ Health check failed:', error.message)
    return false
  }
}

async function testCreateUser() {
  console.log("\n👤 Test de création d'utilisateur...")
  try {
    const userData = {
      pseudo: 'admin_test',
      nom: 'Admin',
      prenom: 'Test',
      email: 'admin.test@sifc.cm',
      telephone: '+237612345678',
      password: 'AdminTest123!',
      role: 'technical_admin',
      langue: 'fr',
      securityQuestion1: 'Quel est le nom de votre premier animal de compagnie ?',
      securityAnswer1: 'Rex',
      securityQuestion2: 'Dans quelle ville êtes-vous né ?',
      securityAnswer2: 'Yaoundé',
      securityQuestion3: 'Quel est votre plat préféré ?',
      securityAnswer3: 'Ndolé',
    }

    const response = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Utilisateur créé:', data.data.pseudo)
      return data.data
    } else {
      console.log('ℹ️ Utilisateur existe déjà ou erreur:', data.message)
      return null
    }
  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error.message)
    return null
  }
}

async function testLogin() {
  console.log('\n🔐 Test de connexion...')
  try {
    const loginData = {
      pseudo: 'admin_test',
      password: 'AdminTest123!',
    }

    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    })

    const data = await response.json()

    if (response.ok && data.requiresOtp) {
      console.log('✅ Connexion initiale réussie, OTP requis')
      console.log('📧 Session key:', data.sessionKey)
      return data.sessionKey
    } else {
      console.error('❌ Erreur de connexion:', data.message)
      return null
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
    return null
  }
}

async function testOtpVerification(sessionKey) {
  console.log('\n🔢 Test de vérification OTP...')

  // Simuler l'OTP (en production, il serait envoyé par email)
  const otp = '123456' // Code de test

  try {
    const otpData = {
      otp: otp,
      sessionKey: sessionKey,
    }

    const response = await fetch(`${API_BASE}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(otpData),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Vérification OTP réussie')
      console.log('🎫 Token reçu:', data.data.token.type)
      return data.data.token.value
    } else {
      console.log('ℹ️ OTP invalide (normal en test):', data.message)
      return null
    }
  } catch (error) {
    console.error('❌ Erreur vérification OTP:', error.message)
    return null
  }
}

async function testProtectedRoute(token) {
  console.log('\n🛡️ Test de route protégée...')
  try {
    const response = await fetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Route protégée accessible:', data.data.pseudo)
      return true
    } else {
      console.error('❌ Accès refusé:', data.message)
      return false
    }
  } catch (error) {
    console.error('❌ Erreur route protégée:', error.message)
    return false
  }
}

async function runTests() {
  console.log("🚀 Démarrage des tests d'authentification SIFC\n")

  // Test 1: Health check
  const healthOk = await testHealthCheck()
  if (!healthOk) {
    console.log('❌ Serveur non accessible, arrêt des tests')
    return
  }

  // Test 2: Création d'utilisateur (optionnel)
  await testCreateUser()

  // Test 3: Connexion
  const sessionKey = await testLogin()
  if (!sessionKey) {
    console.log('❌ Connexion échouée, arrêt des tests')
    return
  }

  // Test 4: Vérification OTP (simulée)
  const token = await testOtpVerification(sessionKey)
  if (!token) {
    console.log('ℹ️ Vérification OTP échouée (normal sans vrai OTP)')
    return
  }

  // Test 5: Route protégée
  await testProtectedRoute(token)

  console.log('\n✨ Tests terminés!')
}

// Exécuter les tests
runTests().catch(console.error)
