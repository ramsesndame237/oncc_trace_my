'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RegisterPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    if (
      'serviceWorker' in navigator &&
      typeof window !== 'undefined' &&
      (window as unknown).serwist !== undefined
    ) {
      ;(window as unknown).serwist
        .register()
        .then((registration: ServiceWorkerRegistration) => {
          console.log('[PWA]  Service Worker enregistré avec succès')

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) return

            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                console.log('[PWA]  Nouvelle version disponible')

                toast.info('Nouvelle version disponible', {
                  description:
                    'Une mise à jour de l\'application est disponible. Rechargez pour appliquer.',
                  action: {
                    label: 'Recharger',
                    onClick: () => window.location.reload(),
                  },
                  duration: 10000,
                })
              }
            })
          })
          setInterval(
            () => {
              registration.update().catch((err) => {
                console.warn('[PWA]  Erreur vérification mise à jour:', err)
              })
            },
            60 * 60 * 1000,
          )
        })
        .catch((err: Error) => {
          console.error('[PWA]  Erreur enregistrement Service Worker:', err)
        })
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)

      console.log('[PWA]  Application installable détectée')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', () => {
      console.log('[PWA]  Application installée avec succès')

      toast.success('Application installée', {
        description:
          'ONCC Trace a été ajouté à votre écran d\'accueil. Vous pouvez maintenant l\'utiliser offline.',
        duration: 5000,
      })

      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    })
    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      )
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('  Utilisateur a accepté')
    } else {
      console.log('[PWA]  Utilisateur a refusé')
    }
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismissInstallPrompt = () => {
    setShowInstallPrompt(false)
    console.log('installation ignoré')

    toast.info('Installation disponible', {
      description:
        'Vous pouvez installer ONCC Trace depuis le menu de votre navigateur.',
      duration: 3000,
    })
  }
  if (!showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 transform px-4">
      <div className="rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Download className="size-5 text-primary" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold">Installer ONCC Trace</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Installez cette application pour un accès rapide et une utilisation
              offline.
            </p>

            <div className="mt-4 flex gap-2">
              <Button onClick={handleInstallClick} size="sm" className="flex-1">
                Installer
              </Button>
              <Button
                onClick={handleDismissInstallPrompt}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Plus tard
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismissInstallPrompt}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
