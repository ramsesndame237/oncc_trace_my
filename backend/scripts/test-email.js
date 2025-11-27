import { EmailService } from '../app/services/email_service.js'

async function testEmailConfiguration() {
  console.log('🧪 Test de la configuration email SendGrid...\n')

  try {
    // Test 1: Configuration générale
    console.log('1️⃣ Test de la configuration générale...')
    const configTest = await EmailService.testEmailConfiguration()
    console.log(`   ✅ Configuration: ${configTest ? 'OK' : 'ÉCHEC'}\n`)

    // Test 2: Envoi d'OTP
    console.log("2️⃣ Test d'envoi d'OTP...")
    const otpTest = await EmailService.sendOTP('test@example.com', '123456', 'Utilisateur Test')
    console.log(`   ✅ OTP: ${otpTest ? 'OK' : 'ÉCHEC'}\n`)

    // Test 3: Email de bienvenue
    console.log("3️⃣ Test d'email de bienvenue...")
    const welcomeTest = await EmailService.sendWelcomeEmail(
      'test@example.com',
      'Jean Dupont',
      'TempPass123!'
    )
    console.log(`   ✅ Bienvenue: ${welcomeTest ? 'OK' : 'ÉCHEC'}\n`)

    // Test 4: Notification de changement de mot de passe
    console.log('4️⃣ Test de notification de changement de mot de passe...')
    const passwordTest = await EmailService.sendPasswordChangeNotification(
      'test@example.com',
      'Jean Dupont'
    )
    console.log(`   ✅ Notification: ${passwordTest ? 'OK' : 'ÉCHEC'}\n`)

    console.log('🎉 Tests terminés !')

    if (configTest && otpTest && welcomeTest && passwordTest) {
      console.log('✅ Tous les tests ont réussi ! La configuration email est opérationnelle.')
    } else {
      console.log('⚠️  Certains tests ont échoué. Vérifiez la configuration SendGrid.')
    }
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Exécuter les tests
testEmailConfiguration()
  .then(() => {
    console.log('\n📧 Tests email terminés.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
