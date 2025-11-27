# Module de Notifications

Ce module fournit une implémentation du système de notifications pour l'application, suivant les principes de clean architecture.

## Architecture

- `useNotification.ts` : Hook React qui expose des méthodes pour afficher différents types de notifications.
- `index.ts` : Point d'entrée qui exporte le hook et d'autres éléments publics du module.

## Fonctionnalités

Le hook `useNotification` offre les méthodes suivantes :

- `success` : Affiche une notification de succès (fond vert)
- `error` : Affiche une notification d'erreur (fond rouge)
- `info` : Affiche une notification d'information (fond bleu)
- `warning` : Affiche une notification d'avertissement

## Utilisation dans les features

Les features doivent importer et utiliser le hook `useNotification` au lieu d'importer directement des librairies tierces comme Sonner ou des utilités de `lib/toast.ts`.

```typescript
import { useNotification } from "@/shared/notifications";

// À l'intérieur d'un composant :
const { success, error, info, warning } = useNotification();
```

## Avantages

- **Découplage** : Les features ne sont pas couplées à l'implémentation spécifique des notifications.
- **Cohérence** : Toutes les notifications suivent le même format et style à travers l'application.
- **Maintenabilité** : Si l'implémentation des notifications change, seul ce module doit être mis à jour.
- **Testabilité** : Le hook peut être facilement mocké pour les tests.
