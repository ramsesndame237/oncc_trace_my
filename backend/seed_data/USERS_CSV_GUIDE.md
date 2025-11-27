# Guide du fichier CSV des utilisateurs

Ce document explique la structure et l'utilisation du fichier `users.csv` pour le seeding des utilisateurs du système SIFC.

## Structure du fichier CSV

Le fichier `users.csv` contient uniquement les colonnes essentielles suivantes :

### Colonnes requises

| Colonne      | Type   | Description                              | Exemple           |
| ------------ | ------ | ---------------------------------------- | ----------------- |
| `familyName` | string | Nom de famille de l'utilisateur          | `Ningha`          |
| `givenName`  | string | Prénom de l'utilisateur                  | `Catelle`         |
| `email`      | string | Adresse email unique                     | `catelle@sifc.cm` |
| `phone`      | string | Numéro de téléphone (format camerounais) | `237657273247`    |
| `role`       | string | Rôle de l'utilisateur                    | `technical_admin` |

## Génération automatique des champs

### Pseudo

Le **pseudo** est généré automatiquement lors de la création de l'utilisateur selon la règle :

- **Première lettre du givenName** + **Premier familyName**
- Exemples :
  - `Catelle Ningha` → `cningha`
  - `Jean-Pierre Mballa` → `jmballa`
  - `Marie-Claire Kamga` → `mkamga`
- Le pseudo est **non modifiable** après création

### Autres champs par défaut

- **Statut** : `actif` (tous les utilisateurs sont actifs après le seed)
- **Langue** : `fr` (français par défaut)
- **UUID** : Généré automatiquement
- **Mot de passe** : Généré automatiquement (doit être changé à la première connexion)
- **Timestamps** : Créés automatiquement

## Rôles disponibles

| Rôle                     | Code              | Description                                 |
| ------------------------ | ----------------- | ------------------------------------------- |
| Administrateur technique | `technical_admin` | Accès complet au système                    |
| Administrateur de bassin | `bassin_admin`    | Gestion des acteurs et magasins du bassin   |
| Agent de terrain         | `field_agent`     | Collecte et mise à jour des données terrain |
| Gérant de magasin        | `gerant`          | Gestion des données de son magasin          |

## Exemples d'utilisation

### Administrateur technique

```csv
Ningha,Catelle,catelle@sifc.cm,237657273247,technical_admin
```

→ Pseudo généré : `cningha`

### Administrateur de bassin

```csv
Mballa,Jean-Pierre,centre@sifc.cm,237600000002,bassin_admin
```

→ Pseudo généré : `jmballa`

### Agent de terrain

```csv
Fouda,Paul,agent.centre1@sifc.cm,237600000006,field_agent
```

→ Pseudo généré : `pfouda`

### Gérant de magasin

```csv
Gérant,Démo,gerant.demo@sifc.cm,237600000011,gerant
```

→ Pseudo généré : `dgerant`

## Bonnes pratiques

### Emails

- Utilisez le domaine `@sifc.cm` pour la production
- Pour les tests, vous pouvez utiliser des domaines de test
- Assurez-vous que chaque email est unique

### Téléphones

- Format camerounais : `237XXXXXXXXX` (237 + 9 chiffres)
- Vérifiez que les numéros sont valides et uniques

### FamilyName et GivenName

- Utilisez des noms réels et appropriés
- Gérez les prénoms composés (ex: Jean-Pierre, Marie-Claire)
- Attention aux caractères spéciaux (apostrophes, traits d'union)

## Fichiers disponibles

- `seed_data/auto/test/users.csv` : 13 utilisateurs de test
- `seed_data/auto/prod/users.csv` : 11 utilisateurs de production

## Utilisation

Le fichier CSV est automatiquement utilisé par le système de seeding :

```bash
# Mode test
SEED_MODE=test node ace db:seed

# Mode production
SEED_MODE=prod node ace db:seed
```

## Traitement automatique

Lors du seeding, le système :

1. **Lit le fichier CSV** correspondant au mode choisi
2. **Génère le pseudo** selon la règle (première lettre givenName + familyName)
3. **Vérifie l'unicité** du pseudo et de l'email
4. **Génère un UUID** unique pour chaque utilisateur
5. **Crée un mot de passe temporaire** (à changer à la première connexion)
6. **Définit le statut** à `actif`
7. **Assigne la langue** par défaut (`fr`)
8. **Crée l'utilisateur** en base de données

## Gestion des conflits

Si un pseudo généré existe déjà, le système peut :

- Ajouter un suffixe numérique (ex: `cningha2`)
- Utiliser le nom complet si nécessaire
- Signaler l'erreur pour résolution manuelle
