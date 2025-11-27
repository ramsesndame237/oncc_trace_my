# APIs de Gestion des Localisations

## Vue d'ensemble

Les APIs de localisations permettent de gérer la hiérarchie géographique du Cameroun selon la structure :

- **Régions** (10 régions)
- **Départements** (par région)
- **Arrondissements** (par département)
- **Villages** (par arrondissement)

## Authentification

Toutes les APIs nécessitent une authentification. Les opérations de création, modification et suppression sont réservées aux **administrateurs techniques**.

## Endpoints

### 1. Lister les localisations

```
GET /api/v1/locations
```

**Paramètres de requête :**

- `page` (optionnel) : Numéro de page (défaut: 1)
- `limit` (optionnel) : Nombre d'éléments par page (défaut: 20)
- `type` (optionnel) : Filtrer par type (`region`, `department`, `arrondissement`, `village`)
- `parent_code` (optionnel) : Filtrer par code parent
- `search` (optionnel) : Recherche par nom
- `statut` (optionnel) : Filtrer par statut (`actif`, `inactif`) (défaut: `actif`)

**Réponse :**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "code": "CE",
        "nom": "Centre",
        "type": "region",
        "parentCode": null,
        "statut": "actif",
        "createdAt": "2024-12-19T10:00:00.000Z",
        "updatedAt": "2024-12-19T10:00:00.000Z",
        "parent": null,
        "children": [...]
      }
    ],
    "meta": {
      "total": 50,
      "perPage": 20,
      "currentPage": 1,
      "lastPage": 3
    }
  }
}
```

### 2. Récupérer une localisation

```
GET /api/v1/locations/:code
```

**Paramètres :**

- `code` : Code de la localisation

**Réponse :**

```json
{
  "success": true,
  "data": {
    "code": "CE",
    "nom": "Centre",
    "type": "region",
    "parentCode": null,
    "statut": "actif",
    "parent": null,
    "children": [...]
  }
}
```

### 3. Créer une localisation

```
POST /api/v1/locations
```

**Permissions :** Administrateur technique uniquement

**Corps de la requête :**

```json
{
  "nom": "Nouvelle Localisation",
  "type": "department",
  "code": "NL",
  "parentCode": "CE",
  "statut": "actif"
}
```

**Validation :**

- `nom` : Obligatoire, 2-100 caractères, lettres/espaces/tirets/apostrophes uniquement, unique
- `type` : Obligatoire, valeurs : `region`, `department`, `arrondissement`, `village`
- `code` : Obligatoire, 2-10 caractères, lettres majuscules/chiffres/tirets, unique
- `parentCode` : Optionnel, doit exister dans la base
- `statut` : Optionnel, valeurs : `actif`, `inactif` (défaut: `actif`)

**Hiérarchie validée :**

- `department` peut avoir comme parent : `region`
- `arrondissement` peut avoir comme parent : `department`
- `village` peut avoir comme parent : `arrondissement`

### 4. Mettre à jour une localisation

```
PUT /api/v1/locations/:code
```

**Permissions :** Administrateur technique uniquement

**Corps de la requête :** Mêmes champs que la création (tous optionnels)

### 5. Supprimer une localisation

```
DELETE /api/v1/locations/:code
```

**Permissions :** Administrateur technique uniquement

**Contraintes :**

- Ne peut pas supprimer une localisation qui a des enfants
- Ne peut pas supprimer une localisation utilisée par des acteurs

### 6. Récupérer la hiérarchie complète

```
GET /api/v1/locations/hierarchy
```

**Réponse :** Arbre hiérarchique complet avec toutes les relations parent-enfant

### 7. Récupérer les enfants d'une localisation

```
GET /api/v1/locations/:code/children
```

**Réponse :** Liste des localisations enfants directes

## Codes d'erreur

- `400` : Données de validation invalides
- `401` : Non authentifié
- `403` : Permissions insuffisantes
- `404` : Localisation non trouvée
- `500` : Erreur serveur

## Exemples d'utilisation

### Récupérer toutes les régions

```bash
GET /api/v1/locations?type=region
```

### Récupérer tous les départements de la région Centre

```bash
GET /api/v1/locations?type=department&parent_code=CE
```

### Rechercher des localisations par nom

```bash
GET /api/v1/locations?search=Yaoundé
```

### Créer un nouveau département

```bash
POST /api/v1/locations
Content-Type: application/json
Authorization: Bearer <token>

{
  "nom": "Nouveau Département",
  "type": "department",
  "code": "ND",
  "parentCode": "CE"
}
```

## Données de test

Le seeder inclut :

- 10 régions du Cameroun
- Départements principaux des zones de production cacao/café
- Arrondissements des grandes villes
- Villages de production représentatifs

Les codes suivent la convention :

- Régions : 2 lettres (CE, OU, SW, LT, etc.)
- Départements : 2-5 lettres (MF, NK, BA, etc.)
- Arrondissements : 3-4 lettres (YDE1, DLA1, BUE, etc.)
- Villages : 3 lettres (FOT, MUE, BOK, etc.)
