# Documentation Base de Données SIFC

## Vue d'ensemble

La base de données du Système d'Information de la Filière Cacao et Café (SIFC) est conçue pour gérer l'ensemble des acteurs, localisations, campagnes, et documents de la filière cacao-café au Cameroun.

## Architecture

- **SGBD** : PostgreSQL 15
- **ORM** : Lucid (AdonisJS)
- **Migrations** : Gérées par AdonisJS
- **Seeders** : Données de base pré-chargées

## Modèles de Données

### 1. Authentification et Autorisation

#### `users` - Utilisateurs du système

- **id** : Identifiant unique
- **full_name** : Nom complet
- **email** : Email (unique)
- **password** : Mot de passe hashé
- **created_at**, **updated_at** : Timestamps

#### `roles` - Rôles système

- **id** : Identifiant unique
- **name** : Nom technique du rôle (unique)
- **display_name** : Nom d'affichage
- **description** : Description du rôle
- **permissions** : Permissions JSON
- **is_active** : Statut actif/inactif

#### `user_roles` - Table pivot utilisateurs-rôles

- **user_id** : Référence vers users
- **role_id** : Référence vers roles

### 2. Géolocalisation

#### `locations` - Hiérarchie géographique

- **id** : Identifiant unique
- **name** : Nom de la localisation
- **code** : Code officiel
- **type** : Type (region, department, arrondissement, village)
- **parent_id** : Référence vers location parent
- **latitude**, **longitude** : Coordonnées GPS
- **metadata** : Métadonnées JSON
- **is_active** : Statut actif/inactif

### 3. Organisation Administrative

#### `production_basins` - Bassins de production

- **id** : Identifiant unique
- **name** : Nom du bassin
- **code** : Code unique
- **description** : Description
- **location_ids** : IDs des localisations couvertes (JSON)
- **metadata** : Métadonnées JSON
- **is_active** : Statut actif/inactif

#### `user_production_basins` - Affectation utilisateurs-bassins

- **user_id** : Référence vers users
- **production_basin_id** : Référence vers production_basins

#### `campaigns` - Campagnes de commercialisation

- **id** : Identifiant unique
- **name** : Nom de la campagne
- **year** : Année (ex: "2024-2025")
- **description** : Description
- **start_date**, **end_date** : Dates de début/fin
- **status** : Statut (draft, active, closed)
- **is_current** : Campagne courante (une seule à la fois)
- **metadata** : Métadonnées JSON

### 4. Acteurs de la Filière

#### `actors` - Acteurs (Producteurs, OPA, Acheteurs, etc.)

- **id** : Identifiant unique
- **name** : Nom de l'acteur
- **code** : Code généré automatiquement
- **type** : Type (producer, opa, buyer, exporter, transformer)
- **status** : Statut (draft, pending, validated, rejected, inactive)
- **email**, **phone** : Coordonnées
- **address** : Adresse textuelle
- **location_id** : Référence vers locations
- **latitude**, **longitude** : Coordonnées GPS
- **metadata** : Métadonnées dynamiques JSON
- **created_by**, **validated_by** : Références vers users
- **validated_at** : Date de validation
- **validation_notes** : Notes de validation
- **campaign_id** : Référence vers campaigns

### 5. Infrastructure

#### `stores` - Magasins/Entrepôts

- **id** : Identifiant unique
- **name** : Nom du magasin
- **code** : Code généré automatiquement
- **description** : Description
- **location_id** : Référence vers locations
- **address** : Adresse textuelle
- **latitude**, **longitude** : Coordonnées GPS
- **capacity** : Capacité en tonnes
- **type** : Type (warehouse, storage, processing, other)
- **facilities** : Équipements disponibles (JSON)
- **owner_id** : Référence vers actors (propriétaire)
- **manager_name**, **manager_phone** : Gestionnaire
- **campaign_id** : Référence vers campaigns
- **status** : Statut (active, inactive, maintenance)
- **metadata** : Métadonnées JSON

### 6. Gestion Documentaire

#### `documents` - Documents/Fichiers

- **id** : Identifiant unique
- **name** : Nom du fichier
- **original_name** : Nom original
- **mime_type** : Type MIME
- **size** : Taille en bytes
- **path** : Chemin dans Minio
- **bucket** : Bucket Minio
- **category** : Catégorie de document
- **description** : Description
- **metadata** : Métadonnées JSON
- **documentable_type**, **documentable_id** : Relation polymorphe
- **is_public** : Accès public
- **access_permissions** : Permissions d'accès (JSON)
- **uploaded_by** : Référence vers users

### 7. Audit et Traçabilité

#### `audit_logs` - Historique des modifications

- **id** : Identifiant unique
- **action** : Action (create, update, delete, validate, reject, etc.)
- **description** : Description de l'action
- **auditable_type**, **auditable_id** : Entité concernée (polymorphe)
- **user_id** : Utilisateur ayant effectué l'action
- **user_name** : Nom de l'utilisateur au moment de l'action
- **old_values**, **new_values** : Valeurs avant/après (JSON)
- **ip_address** : Adresse IP
- **user_agent** : User agent
- **metadata** : Métadonnées supplémentaires (JSON)
- **created_at** : Date de l'action

## Relations Principales

### Hiérarchie Géographique

```
Région → Département → Arrondissement → Village
```

### Workflow de Validation des Acteurs

```
Draft → Pending → Validated/Rejected
```

### Affectation des Utilisateurs

```
User ←→ Role (many-to-many)
User ←→ ProductionBasin (many-to-many)
```

### Propriété des Magasins

```
Actor → Store (one-to-many)
Campaign → Store (one-to-many)
```

## Index et Performances

### Index Principaux

- **actors** : (type, status), (location_id), (campaign_id), (created_by)
- **locations** : (parent_id, type), (type, is_active)
- **stores** : (owner_id), (campaign_id), (location_id)
- **documents** : (documentable_type, documentable_id), (uploaded_by)
- **audit_logs** : (auditable_type, auditable_id), (user_id), (created_at)

## Données de Base (Seeders)

### Rôles Système

1. **admin_national** - Administrateur National
2. **bassin_admin** - Administrateur de Bassin
3. **agent_terrain** - Agent de Terrain
4. **gestionnaire_opa** - Gestionnaire OPA
5. **gestionnaire_acheteur** - Gestionnaire Acheteur
6. **gestionnaire_exportateur** - Gestionnaire Exportateur
7. **gestionnaire_transformateur** - Gestionnaire Transformateur

### Régions du Cameroun

1. **Centre** (CE) - Principal bassin de production de cacao
2. **Sud** (SU) - Important bassin de production de cacao
3. **Est** (ES) - Production de cacao et café
4. **Littoral** (LT) - Zone de transformation et export
5. **Sud-Ouest** (SW) - Important bassin de production
6. **Ouest** (OU) - Principal bassin de production de café

## Contraintes et Validations

### Contraintes Métier

- Une seule campagne peut être "courante" (`is_current = true`)
- Les codes d'acteurs et magasins sont générés automatiquement
- Les relations hiérarchiques des localisations sont maintenues
- L'audit trail est automatique pour les actions importantes

### Contraintes Techniques

- Clés étrangères avec CASCADE DELETE approprié
- Index uniques sur les codes et emails
- Validation des types énumérés
- Sérialisation JSON pour les métadonnées

## Commandes Utiles

### Migrations

```bash
# Exécuter les migrations
npm run migration:run

# Rollback des migrations
npm run migration:rollback

# Statut des migrations
node ace migration:status
```

### Seeders

```bash
# Exécuter tous les seeders
node ace db:seed

# Exécuter un seeder spécifique
node ace db:seed --files="database/seeders/role_seeder.ts"
```

### Base de Données

```bash
# Accéder à PostgreSQL
docker exec -it sifc_postgres_dev psql -U sifc_user -d sifc_db

# Lister les tables
docker exec sifc_postgres_dev psql -U sifc_user -d sifc_db -c "\dt"

# Vérifier les données
docker exec sifc_postgres_dev psql -U sifc_user -d sifc_db -c "SELECT * FROM roles;"
```

## Évolutions Futures

### Phase 2

- Table `parcels` pour les parcelles de producteurs
- Table `transactions` pour les opérations commerciales
- Table `quality_controls` pour les contrôles qualité

### Phase 3

- Tables de reporting et statistiques
- Intégrations avec systèmes externes
- Fonctionnalités de cartographie avancées
