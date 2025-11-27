import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ONCC Trace - Système de suivi et de gestion des opérations de la Filière Cacao et Café',
    short_name: 'ONCC Trace',
    description: 'Système de suivi et de gestion des opérations de la Filière Cacao et Café',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#21700f',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'fr',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Tableau de bord',
        short_name: 'Dashboard',
        description: 'Accéder au tableau de bord principal',
        url: '/dashboard',
        icons: [
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
          },
        ],
      },
      {
        name: 'Gestion des acteurs',
        short_name: 'Acteurs',
        description: 'Gérer les acteurs de la filière',
        url: '/actors',
        icons: [
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
          },
        ],
      },
    ],
    screenshots: [
      {
        src: '/screenshots/desktop-1.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: "Vue d'ensemble du tableau de bord",
      },
      {
        src: '/screenshots/mobile-1.png',
        sizes: '375x667',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Interface mobile',
      },
    ],
  }
}
