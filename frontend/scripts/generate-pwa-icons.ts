/**
 * Script de génération des icônes PWA
 *
 * Génère automatiquement toutes les icônes PWA aux dimensions requises
 * à partir du logo source (/public/logo/logo.png)
 *
 * Usage:
 *   npm run generate:icons
 *
 * Prérequis:
 *   - sharp (installé comme dépendance)
 *   - Logo source à /public/logo/logo.png
 *
 * Tailles générées:
 *   - 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const SOURCE_LOGO = path.join(process.cwd(), 'public/logo/logo.png')
const OUTPUT_DIR = path.join(process.cwd(), 'public/icons')

async function generatePWAIcons() {
  console.log('🎨 Vérification des icônes PWA...\n')

  // Vérifier que le logo source existe
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error(`❌ Logo source introuvable: ${SOURCE_LOGO}`)
    process.exit(1)
  }

  // Créer le dossier de destination s'il n'existe pas
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`📁 Dossier créé: ${OUTPUT_DIR}`)
  }

  // Vérifier si toutes les icônes existent déjà
  const missingIcons = ICON_SIZES.filter((size) => {
    const iconPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`)
    return !fs.existsSync(iconPath)
  })

  if (missingIcons.length === 0) {
    console.log('✓ Toutes les icônes PWA existent déjà, génération ignorée.')
    console.log(
      `💡 Pour régénérer les icônes, supprimez-les d'abord ou exécutez: npm run generate:icons\n`
    )
    return
  }

  console.log(
    `📋 ${missingIcons.length}/${ICON_SIZES.length} icône(s) manquante(s), génération en cours...\n`
  )

  // Générer uniquement les icônes manquantes
  for (const size of missingIcons) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`)

    try {
      await sharp(SOURCE_LOGO)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }, // Fond blanc
        })
        .png()
        .toFile(outputPath)

      console.log(`✓ Icône générée: icon-${size}x${size}.png`)
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de icon-${size}x${size}.png:`, error)
    }
  }

  console.log('\n✅ Génération des icônes PWA terminée!')
  console.log(`📦 ${missingIcons.length} icône(s) générée(s) dans ${OUTPUT_DIR}`)
}

generatePWAIcons().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
