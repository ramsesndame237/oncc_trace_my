# 🚀 Plan de Migration : Conventions & Calendriers en Tables Séparées

**Date** : Janvier 2025
**Version** : 1.0
**Auteur** : Équipe Technique ONCC-V1

---

## 📋 Vue d'Ensemble de la Migration

### Objectif
Migrer conventions et calendriers de `actors` (imbriqués) vers des tables séparées tout en maintenant la compatibilité avec le système de synchronisation existant.

### Durée Estimée
**3-4 jours** (développement + tests)

### Stratégie
Migration progressive avec flag de feature pour rollback facile.

### Priorité
🔥 **CRITIQUE** - Les formulaires du Quick Menu dépendent de cette migration pour avoir des performances acceptables.

---

## 🏗️ Architecture Cible

### Frontend (IndexedDB)

```typescript
// AVANT (Version 2)
actors: "id, localId, actorType, familyName, givenName, locationCode, status, syncedAt, [actorType+status], onccId"
// conventions et calendars imbriqués dans actors

// APRÈS (Version 3)
actors: "id, localId, actorType, familyName, givenName, locationCode, status, syncedAt, [actorType+status], onccId"
conventions: "id, localId, code, opaId, buyerExporterId, signatureDate, status, syncedAt, [opaId+status], [buyerExporterId+status]"
calendars: "id, localId, code, type, opaId, conventionId, locationCode, startDate, endDate, eventTime, status, syncedAt, [startDate+endDate], [opaId+type+status]"
```

### Backend (PostgreSQL)

```sql
-- Nouvelles tables
CREATE TABLE conventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  opa_id UUID NOT NULL REFERENCES actors(id),
  buyer_exporter_id UUID NOT NULL REFERENCES actors(id),
  signature_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

CREATE TABLE calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'MARCHE' | 'ENLEVEMENT'
  opa_id UUID NOT NULL REFERENCES actors(id),
  convention_id UUID NULL REFERENCES conventions(id),
  location_code VARCHAR(20) REFERENCES locations(code),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  event_time TIME NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);
```

---

## 📅 Plan de Migration (6 Phases)

### **Phase 0 : Préparation** (0.5 jour)

#### ✅ Checklist Préparation
- [ ] Backup complet de la base de données production
- [ ] Backup des données IndexedDB (export JSON)
- [ ] Créer une branche Git dédiée : `feature/conventions-calendars-migration`
- [ ] Documenter l'état actuel (nombre d'actors, conventions, calendars)
- [ ] Créer un flag de feature : `ENABLE_SEPARATE_CONVENTIONS_CALENDARS`

#### Commandes

```bash
# Backend - Backup PostgreSQL
docker exec -it sifc_postgres_dev pg_dump -U oncc sifc_db > backup-pre-migration-$(date +%Y%m%d).sql

# Git
git checkout -b feature/conventions-calendars-migration
git push -u origin feature/conventions-calendars-migration

# Frontend - Export IndexedDB (via console navigateur)
const actors = await db.actors.toArray();
const conventionsCount = actors.reduce((sum, a) => sum + (a.conventions?.length || 0), 0);
const calendarsCount = actors.reduce((sum, a) => sum + (a.calendars?.length || 0), 0);
console.log(`${actors.length} actors, ${conventionsCount} conventions, ${calendarsCount} calendars`);
```

---

### **Phase 1 : Backend - Nouvelles Tables** (1 jour)

#### 📝 **1.1 Migrations Database**

**Fichier** : `backend/database/migrations/XXXX_create_conventions_table.ts`

```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conventions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.string('code', 50).unique().notNullable()

      // Foreign keys
      table.uuid('opa_id').notNullable()
        .references('id').inTable('actors')
        .onDelete('CASCADE')

      table.uuid('buyer_exporter_id').notNullable()
        .references('id').inTable('actors')
        .onDelete('CASCADE')

      // Attributs
      table.timestamp('signature_date').notNullable()
      table.string('status', 20).defaultTo('active')

      // Timestamps
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.timestamp('deleted_at').nullable()

      // Index
      table.index(['opa_id', 'status'])
      table.index(['buyer_exporter_id', 'status'])
      table.index('code')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

**Fichier** : `backend/database/migrations/XXXX_create_calendars_table.ts`

```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'calendars'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.string('code', 50).unique().notNullable()

      // Foreign keys
      table.uuid('opa_id').notNullable()
        .references('id').inTable('actors')
        .onDelete('CASCADE')

      table.uuid('convention_id').nullable()
        .references('id').inTable('conventions')
        .onDelete('SET NULL')

      table.string('location_code', 20).nullable()
        .references('code').inTable('locations')
        .onDelete('SET NULL')

      // Attributs
      table.string('type', 20).notNullable() // 'MARCHE' | 'ENLEVEMENT'
      table.timestamp('start_date').notNullable()
      table.timestamp('end_date').notNullable()
      table.time('event_time').nullable()
      table.string('status', 20).defaultTo('active')

      // Timestamps
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.timestamp('deleted_at').nullable()

      // Index composés pour performance
      table.index(['start_date', 'end_date'])
      table.index(['opa_id', 'type', 'status'])
      table.index('convention_id')
      table.index('code')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

#### 📝 **1.2 Migration des Données Existantes**

**Fichier** : `backend/database/migrations/XXXX_migrate_conventions_calendars_data.ts`

```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Cette migration extrait les conventions et calendriers des JSONB
    // et les insère dans les nouvelles tables

    const actors = await this.db.from('actors').select('*')

    for (const actor of actors) {
      // Migrer les conventions
      if (actor.conventions && Array.isArray(actor.conventions)) {
        for (const conv of actor.conventions) {
          await this.db.table('conventions').insert({
            id: conv.id,
            code: conv.code,
            opa_id: conv.opaId,
            buyer_exporter_id: conv.buyerExporterId,
            signature_date: conv.signatureDate,
            status: conv.status || 'active',
            created_at: this.now(),
            updated_at: this.now(),
          })
        }
      }

      // Migrer les calendriers
      if (actor.calendars && Array.isArray(actor.calendars)) {
        for (const cal of actor.calendars) {
          await this.db.table('calendars').insert({
            id: cal.id,
            code: cal.code,
            type: cal.type,
            opa_id: actor.id, // Le calendrier appartient à l'acteur
            convention_id: cal.convention?.id || null,
            location_code: cal.locationCode,
            start_date: cal.startDate,
            end_date: cal.endDate,
            event_time: cal.eventTime,
            status: cal.status || 'active',
            created_at: this.now(),
            updated_at: this.now(),
          })
        }
      }
    }
  }

  async down() {
    await this.db.from('conventions').delete()
    await this.db.from('calendars').delete()
  }
}
```

#### 📝 **1.3 Models**

**Fichier** : `backend/app/models/convention.ts`

```typescript
import Actor from '#models/actor'
import Calendar from '#models/calendar'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Convention extends BaseModel {
  static table = 'conventions'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code: string

  @column({ columnName: 'opa_id' })
  declare opaId: string

  @column({ columnName: 'buyer_exporter_id' })
  declare buyerExporterId: string

  @column.dateTime({ columnName: 'signature_date' })
  declare signatureDate: DateTime

  @column()
  declare status: 'active' | 'inactive'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  // Relations
  @belongsTo(() => Actor, {
    foreignKey: 'opaId',
  })
  declare opa: BelongsTo<typeof Actor>

  @belongsTo(() => Actor, {
    foreignKey: 'buyerExporterId',
  })
  declare buyerExporter: BelongsTo<typeof Actor>

  @hasMany(() => Calendar, {
    foreignKey: 'conventionId',
  })
  declare calendars: HasMany<typeof Calendar>

  // Méthodes utilitaires
  public isActive(): boolean {
    return this.status === 'active'
  }
}
```

**Fichier** : `backend/app/models/calendar.ts`

```typescript
import Actor from '#models/actor'
import Convention from '#models/convention'
import Location from '#models/location'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Calendar extends BaseModel {
  static table = 'calendars'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code: string

  @column()
  declare type: 'MARCHE' | 'ENLEVEMENT'

  @column({ columnName: 'opa_id' })
  declare opaId: string

  @column({ columnName: 'convention_id' })
  declare conventionId: string | null

  @column({ columnName: 'location_code' })
  declare locationCode: string | null

  @column.dateTime({ columnName: 'start_date' })
  declare startDate: DateTime

  @column.dateTime({ columnName: 'end_date' })
  declare endDate: DateTime

  @column.dateTime({ columnName: 'event_time' })
  declare eventTime: DateTime | null

  @column()
  declare status: 'active' | 'inactive'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  // Relations
  @belongsTo(() => Actor, {
    foreignKey: 'opaId',
  })
  declare opa: BelongsTo<typeof Actor>

  @belongsTo(() => Convention, {
    foreignKey: 'conventionId',
  })
  declare convention: BelongsTo<typeof Convention>

  @belongsTo(() => Location, {
    foreignKey: 'locationCode',
    localKey: 'code',
  })
  declare location: BelongsTo<typeof Location>

  // Méthodes utilitaires
  public isActive(): boolean {
    return this.status === 'active'
  }

  public isInPeriod(date: DateTime = DateTime.now()): boolean {
    return date >= this.startDate && date <= this.endDate
  }
}
```

#### 📝 **1.4 Services**

**Fichier** : `backend/app/services/convention_service.ts`

```typescript
import Convention from '#models/convention'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class ConventionService {
  async list(filters: any) {
    let query = Convention.query()
      .preload('opa')
      .preload('buyerExporter')
      .whereNull('deletedAt')

    if (filters.opaId) {
      query = query.where('opaId', filters.opaId)
    }

    if (filters.buyerExporterId) {
      query = query.where('buyerExporterId', filters.buyerExporterId)
    }

    if (filters.status) {
      query = query.where('status', filters.status)
    }

    if (filters.search) {
      query = query.whereILike('code', `%${filters.search}%`)
    }

    return await query.orderBy('createdAt', 'desc').paginate(filters.page, filters.limit)
  }

  async findById(id: string) {
    return await Convention.query()
      .where('id', id)
      .whereNull('deletedAt')
      .preload('opa')
      .preload('buyerExporter')
      .preload('calendars')
      .firstOrFail()
  }

  async create(data: any, auditContext: any) {
    return await db.transaction(async (trx) => {
      const convention = await Convention.create({
        code: data.code,
        opaId: data.opaId,
        buyerExporterId: data.buyerExporterId,
        signatureDate: data.signatureDate,
        status: data.status || 'active',
      }, { client: trx })

      // Charger les relations
      await convention.load('opa')
      await convention.load('buyerExporter')

      // TODO: Audit log

      return convention
    })
  }

  async update(id: string, data: any, auditContext: any) {
    return await db.transaction(async (trx) => {
      const convention = await Convention.query({ client: trx })
        .where('id', id)
        .whereNull('deletedAt')
        .firstOrFail()

      convention.merge({
        code: data.code,
        opaId: data.opaId,
        buyerExporterId: data.buyerExporterId,
        signatureDate: data.signatureDate,
        status: data.status,
      })

      await convention.save()

      // TODO: Audit log

      return convention
    })
  }

  async delete(id: string, auditContext: any) {
    return await db.transaction(async (trx) => {
      const convention = await Convention.query({ client: trx })
        .where('id', id)
        .whereNull('deletedAt')
        .firstOrFail()

      convention.deletedAt = DateTime.now()
      await convention.save()

      // TODO: Audit log
    })
  }
}
```

**Fichier similaire** : `backend/app/services/calendar_service.ts`

#### 📝 **1.5 Controllers**

**Fichier** : `backend/app/controllers/conventions_controller.ts`

```typescript
import ConventionService from '#services/convention_service'
import { ErrorCodes, SuccessCodes } from '#types/error_codes'
import { ApiResponse } from '#utils/api_response'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ConventionsController {
  constructor(protected conventionService: ConventionService) {}

  async index({ request, response }: HttpContext) {
    try {
      const filters = {
        page: request.input('page', 1),
        limit: request.input('limit', 20),
        opaId: request.input('opaId'),
        buyerExporterId: request.input('buyerExporterId'),
        status: request.input('status'),
        search: request.input('search'),
      }

      const conventions = await this.conventionService.list(filters)

      return ApiResponse.success(
        response,
        SuccessCodes.CONVENTION_LIST_SUCCESS,
        conventions.serialize()
      )
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_LIST_FAILED)
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const convention = await this.conventionService.findById(params.id)

      return ApiResponse.success(
        response,
        SuccessCodes.CONVENTION_FETCH_SUCCESS,
        convention.serialize({
          relations: {
            opa: { fields: ['id', 'familyName', 'givenName', 'onccId'] },
            buyerExporter: { fields: ['id', 'familyName', 'givenName', 'onccId'] },
          }
        })
      )
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_NOT_FOUND)
    }
  }

  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const convention = await this.conventionService.create(
        request.all(),
        {
          userId: user.id,
          userRole: user.role,
          ipAddress: request.ip(),
          userAgent: request.header('user-agent'),
        }
      )

      return ApiResponse.created(
        response,
        SuccessCodes.CONVENTION_CREATED,
        convention.serialize()
      )
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_CREATION_FAILED)
    }
  }

  async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      const convention = await this.conventionService.update(
        params.id,
        request.all(),
        {
          userId: user.id,
          userRole: user.role,
          ipAddress: request.ip(),
          userAgent: request.header('user-agent'),
        }
      )

      return ApiResponse.success(
        response,
        SuccessCodes.CONVENTION_UPDATED,
        convention.serialize()
      )
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_UPDATE_FAILED)
    }
  }

  async destroy({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      await this.conventionService.delete(params.id, {
        userId: user.id,
        userRole: user.role,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      })

      return ApiResponse.success(response, SuccessCodes.CONVENTION_DELETED)
    } catch (error) {
      return ApiResponse.fromException(response, error, ErrorCodes.CONVENTION_DELETION_FAILED)
    }
  }
}
```

**Fichier similaire** : `backend/app/controllers/calendars_controller.ts`

#### 📝 **1.6 Routes**

**Fichier** : `backend/start/routes.ts`

```typescript
// Ajouter les nouvelles routes
const ConventionsController = () => import('#controllers/conventions_controller')
const CalendarsController = () => import('#controllers/calendars_controller')

router.group(() => {
  // Conventions
  router.resource('conventions', ConventionsController).apiOnly()

  // Calendriers
  router.resource('calendars', CalendarsController).apiOnly()

  // Routes custom pour filtrage avancé
  router.get('conventions/by-opa/:opaId', [ConventionsController, 'byOpa'])
  router.get('calendars/active', [CalendarsController, 'active'])
  router.get('calendars/by-period', [CalendarsController, 'byPeriod'])
}).middleware(['auth'])
```

#### 📝 **1.7 Tests Backend**

```bash
# 1. Exécuter les migrations
cd backend
docker exec -it sifc_api_dev node ace migration:run

# 2. Vérifier les tables créées
docker exec -it sifc_postgres_dev psql -U oncc -d sifc_db -c "\dt"

# 3. Vérifier les données migrées
docker exec -it sifc_postgres_dev psql -U oncc -d sifc_db -c "SELECT COUNT(*) FROM conventions;"
docker exec -it sifc_postgres_dev psql -U oncc -d sifc_db -c "SELECT COUNT(*) FROM calendars;"

# 4. Tester les endpoints API
curl http://localhost:3333/conventions
curl http://localhost:3333/calendars
curl http://localhost:3333/conventions/by-opa/{opaId}
curl http://localhost:3333/calendars/active
```

---

### **Phase 2 : Frontend - Nouvelle Structure IndexedDB** (0.5 jour)

#### 📝 **2.1 Migration Dexie (Version 3)**

**Fichier** : `frontend/src/core/infrastructure/database/db.ts`

```typescript
export interface OfflineConventionData {
  id?: string;          // UUID serveur (présent = synced)
  localId?: string;     // UUID local (présent = offline)
  code: string;
  opaId: string;
  buyerExporterId: string;
  signatureDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  syncedAt: number;     // Timestamp de la dernière synchronisation
}

export interface OfflineCalendarData {
  id?: string;
  localId?: string;
  code: string;
  type: 'MARCHE' | 'ENLEVEMENT';
  opaId: string;
  conventionId?: string | null;
  locationCode?: string | null;
  startDate: string;
  endDate: string;
  eventTime?: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  syncedAt: number;
}

export class SifcDatabase extends Dexie {
  // Tables existantes
  pins!: EntityTable<OfflinePinData, "id">;
  pendingOperations!: EntityTable<PendingOperation, "id">;
  locations!: EntityTable<OfflineLocationData, "id">;
  settings!: EntityTable<OfflineSettingsData, "id">;
  actors!: EntityTable<OfflineActorData, "id">;
  idMappings!: EntityTable<IdMapping, "id">;
  transactions!: EntityTable<OfflineTransactionData, "id">;

  // NOUVELLES TABLES
  conventions!: EntityTable<OfflineConventionData, "id">;
  calendars!: EntityTable<OfflineCalendarData, "id">;

  constructor() {
    super("SifcDatabase");

    // Version 1 et 2 (existantes)
    this.version(1).stores({ /* ... */ });
    this.version(2).stores({ /* ... */ });

    // 🔥 VERSION 3 : Ajout conventions et calendars
    this.version(3)
      .stores({
        // Conserver toutes les tables existantes
        pins: "id, userId, createdAt, lastUsed, isLocked",
        pendingOperations: "++id, entityId, entityType, timestamp, userId, [entityType+operation], [userId+entityType]",
        locations: "++id, code, name, type, status, parentCode, syncedAt, [type+name], isInProductionBasin",
        settings: "++id, key, updatedAt",

        // Actors SIMPLIFIÉ (sans conventions/calendars imbriqués)
        actors: "id, localId, actorType, familyName, givenName, locationCode, status, syncedAt, [actorType+status], onccId",

        idMappings: "++id, localId, serverId, entityType, createdAt, syncedAt, [localId+entityType]",
        transactions: "id, localId, type, sellerId, buyerId, calendarId, conventionId, transactionDate",

        // 🔥 NOUVELLES TABLES
        conventions: "id, localId, code, opaId, buyerExporterId, status, syncedAt, [opaId+status], [buyerExporterId+status]",
        calendars: "id, localId, code, type, opaId, conventionId, startDate, endDate, status, syncedAt, [startDate+endDate], [opaId+type+status]",
      })
      .upgrade(async (trans) => {
        // 🔥 MIGRATION DES DONNÉES EXISTANTES
        console.log('🔄 Migration IndexedDB v2 → v3...')
        const actors = await trans.table('actors').toArray();

        let conventionsMigrated = 0;
        let calendarsMigrated = 0;

        for (const actor of actors) {
          // Migrer les conventions
          if (actor.conventions && Array.isArray(actor.conventions)) {
            for (const conv of actor.conventions) {
              await trans.table('conventions').add({
                id: conv.id,
                localId: conv.localId,
                code: conv.code,
                opaId: conv.opaId,
                buyerExporterId: conv.buyerExporterId,
                signatureDate: conv.signatureDate,
                status: conv.status || 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                syncedAt: Date.now(),
              });
              conventionsMigrated++;
            }
          }

          // Migrer les calendriers
          if (actor.calendars && Array.isArray(actor.calendars)) {
            for (const cal of actor.calendars) {
              await trans.table('calendars').add({
                id: cal.id,
                localId: cal.localId,
                code: cal.code,
                type: cal.type,
                opaId: actor.id,
                conventionId: cal.convention?.id || cal.convention?.localId || null,
                locationCode: cal.locationCode,
                startDate: cal.startDate,
                endDate: cal.endDate,
                eventTime: cal.eventTime,
                status: cal.status || 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                syncedAt: Date.now(),
              });
              calendarsMigrated++;
            }
          }

          // Supprimer conventions et calendars de l'acteur
          delete actor.conventions;
          delete actor.calendars;

          // Mettre à jour l'acteur
          await trans.table('actors').put(actor);
        }

        console.log(`✅ Migration terminée: ${conventionsMigrated} conventions, ${calendarsMigrated} calendars`);
      });
  }
}
```

---

### **Phase 3 : Frontend - Repositories & Stores** (1 jour)

#### 📝 **3.1 Types Domain**

**Fichier** : `frontend/src/features/convention/domain/convention.types.ts`

```typescript
export interface Convention {
  id: string;
  code: string;
  opaId: string;
  buyerExporterId: string;
  signatureDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateConventionData {
  code: string;
  opaId: string;
  buyerExporterId: string;
  signatureDate: string;
  userId: string;
}
```

**Fichier similaire** : `frontend/src/features/calendar/domain/calendar.types.ts`

#### 📝 **3.2 Convention Repository**

**Fichier** : `frontend/src/features/convention/infrastructure/repositories/ConventionRepository.ts`

```typescript
import { db } from '@/core/infrastructure/database/db'
import type { IConventionRepository } from '../../domain/IConventionRepository'
import type { Convention, CreateConventionData } from '../../domain/convention.types'

export class ConventionRepository implements IConventionRepository {
  async findAll(filters?: { opaId?: string; status?: string }): Promise<Convention[]> {
    let query = db.conventions.toCollection()

    if (filters?.opaId) {
      query = db.conventions.where('opaId').equals(filters.opaId)
    }

    if (filters?.status) {
      query = query.and(c => c.status === filters.status)
    }

    const conventions = await query.sortBy('createdAt')

    return conventions.map(this.mapToConvention)
  }

  async findById(id: string): Promise<Convention | null> {
    const convention = await db.conventions
      .where('id').equals(id)
      .or('localId').equals(id)
      .first()

    return convention ? this.mapToConvention(convention) : null
  }

  async create(data: CreateConventionData): Promise<Convention> {
    const localId = crypto.randomUUID()

    const convention = {
      localId,
      code: data.code,
      opaId: data.opaId,
      buyerExporterId: data.buyerExporterId,
      signatureDate: data.signatureDate,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedAt: Date.now(),
    }

    await db.conventions.add(convention)

    // Ajouter à la queue de synchronisation
    await db.pendingOperations.add({
      entityId: localId,
      entityType: 'convention',
      operation: 'create',
      payload: convention,
      timestamp: Date.now(),
      retries: 0,
      userId: data.userId,
    })

    return this.mapToConvention(convention)
  }

  async update(id: string, data: Partial<CreateConventionData>): Promise<Convention> {
    const convention = await db.conventions.get({ id })

    if (!convention) {
      throw new Error('Convention not found')
    }

    const updated = {
      ...convention,
      ...data,
      updatedAt: new Date().toISOString(),
    }

    await db.conventions.put(updated)

    // Ajouter à la queue de synchronisation
    await db.pendingOperations.add({
      entityId: convention.id || convention.localId!,
      entityType: 'convention',
      operation: 'update',
      payload: updated,
      timestamp: Date.now(),
      retries: 0,
      userId: data.userId!,
    })

    return this.mapToConvention(updated)
  }

  private mapToConvention(data: any): Convention {
    return {
      id: data.id || data.localId,
      code: data.code,
      opaId: data.opaId,
      buyerExporterId: data.buyerExporterId,
      signatureDate: data.signatureDate,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }
}
```

**Fichier similaire** : `frontend/src/features/calendar/infrastructure/repositories/CalendarRepository.ts`

#### 📝 **3.3 Convention Store Zustand**

**Fichier** : `frontend/src/features/convention/infrastructure/store/conventionStore.ts`

```typescript
import { create } from 'zustand'
import { container } from 'tsyringe'
import type { IConventionRepository } from '../../domain/IConventionRepository'
import { DI_TOKENS } from '@/core/infrastructure/di/tokens'
import type { Convention } from '../../domain/convention.types'

interface ConventionStoreState {
  conventions: Convention[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchConventions: (filters?: { opaId?: string; status?: string }) => Promise<void>
  getConventionById: (id: string) => Promise<Convention | null>
  createConvention: (data: any) => Promise<Convention>
  updateConvention: (id: string, data: any) => Promise<Convention>
  clearError: () => void
}

export const useConventionStore = create<ConventionStoreState>((set, get) => {
  const repository = container.resolve<IConventionRepository>(DI_TOKENS.ConventionRepository)

  return {
    conventions: [],
    isLoading: false,
    error: null,

    fetchConventions: async (filters) => {
      set({ isLoading: true, error: null })
      try {
        const conventions = await repository.findAll(filters)
        set({ conventions, isLoading: false })
      } catch (error: any) {
        set({ error: error.message, isLoading: false })
      }
    },

    getConventionById: async (id) => {
      set({ isLoading: true, error: null })
      try {
        const convention = await repository.findById(id)
        set({ isLoading: false })
        return convention
      } catch (error: any) {
        set({ error: error.message, isLoading: false })
        return null
      }
    },

    createConvention: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const convention = await repository.create(data)
        set((state) => ({
          conventions: [...state.conventions, convention],
          isLoading: false,
        }))
        return convention
      } catch (error: any) {
        set({ error: error.message, isLoading: false })
        throw error
      }
    },

    updateConvention: async (id, data) => {
      set({ isLoading: true, error: null })
      try {
        const convention = await repository.update(id, data)
        set((state) => ({
          conventions: state.conventions.map((c) =>
            c.id === id ? convention : c
          ),
          isLoading: false,
        }))
        return convention
      } catch (error: any) {
        set({ error: error.message, isLoading: false })
        throw error
      }
    },

    clearError: () => set({ error: null }),
  }
})
```

**Fichier similaire** : `frontend/src/features/calendar/infrastructure/store/calendarStore.ts`

#### 📝 **3.4 DI Configuration**

**Fichier** : `frontend/src/core/infrastructure/di/tokens.ts`

```typescript
export const DI_TOKENS = {
  // ... existants
  ConventionRepository: Symbol.for('ConventionRepository'),
  CalendarRepository: Symbol.for('CalendarRepository'),
}
```

**Fichier** : `frontend/src/core/infrastructure/di/container.ts`

```typescript
import { ConventionRepository } from '@/features/convention/infrastructure/repositories/ConventionRepository'
import { CalendarRepository } from '@/features/calendar/infrastructure/repositories/CalendarRepository'

container.registerSingleton(DI_TOKENS.ConventionRepository, ConventionRepository)
container.registerSingleton(DI_TOKENS.CalendarRepository, CalendarRepository)
```

---

### **Phase 4 : Synchronisation** (1 jour)

#### 📝 **4.1 Service de Synchronisation Frontend**

**Fichier** : `frontend/src/core/infrastructure/services/syncService.ts`

```typescript
export class SyncService {
  // ... code existant

  async syncConventions(userId: string): Promise<SyncResult> {
    console.log('🔄 Synchronisation des conventions...')

    try {
      // 1. Récupérer les conventions du serveur
      const response = await fetch(`${API_URL}/conventions`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const serverConventions = await response.json()

      // 2. Récupérer les conventions locales
      const localConventions = await db.conventions.toArray()

      // 3. Détecter les nouvelles conventions serveur
      const newFromServer = serverConventions.filter((sc: any) =>
        !localConventions.some((lc) => lc.id === sc.id)
      )

      // 4. Sauvegarder localement
      for (const conv of newFromServer) {
        await db.conventions.put({
          id: conv.id,
          code: conv.code,
          opaId: conv.opaId,
          buyerExporterId: conv.buyerExporterId,
          signatureDate: conv.signatureDate,
          status: conv.status,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          syncedAt: Date.now(),
        })
      }

      // 5. Envoyer les conventions locales non synchronisées
      const toSync = localConventions.filter((lc) => lc.localId && !lc.id)

      for (const conv of toSync) {
        const synced = await this.syncConventionToServer(conv)

        if (synced) {
          // Mettre à jour le mapping local → serveur
          await db.idMappings.add({
            localId: conv.localId!,
            serverId: synced.id,
            entityType: 'convention',
            createdAt: Date.now(),
            syncedAt: Date.now(),
          })

          // Supprimer localId et ajouter id
          await db.conventions.update(conv.localId!, {
            id: synced.id,
            localId: undefined,
            syncedAt: Date.now(),
          })
        }
      }

      console.log(`✅ ${newFromServer.length} conventions synchronisées depuis le serveur`)
      console.log(`✅ ${toSync.length} conventions envoyées au serveur`)

      return {
        success: true,
        downloaded: newFromServer.length,
        uploaded: toSync.length,
      }
    } catch (error) {
      console.error('❌ Erreur synchronisation conventions:', error)
      return { success: false, error }
    }
  }

  private async syncConventionToServer(convention: any) {
    try {
      const response = await fetch(`${API_URL}/conventions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: convention.code,
          opaId: convention.opaId,
          buyerExporterId: convention.buyerExporterId,
          signatureDate: convention.signatureDate,
          status: convention.status,
        }),
      })

      if (!response.ok) throw new Error('Sync failed')

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur sync convention vers serveur:', error)
      return null
    }
  }

  // Méthode similaire pour calendriers
  async syncCalendars(userId: string): Promise<SyncResult> {
    // ... même logique
  }
}
```

#### 📝 **4.2 Hook de Synchronisation**

**Fichier** : `frontend/src/core/infrastructure/hooks/useSync.ts`

```typescript
export function useSync() {
  const { user } = useAuth()
  const syncService = useMemo(() => new SyncService(), [])

  // Synchronisation complète à la connexion
  const syncAll = useCallback(async () => {
    if (!user) return

    console.log('🔄 Synchronisation complète...')

    await syncService.syncLocations()
    await syncService.syncActors(user.id)

    // 🔥 NOUVELLES SYNCHRONISATIONS
    await syncService.syncConventions(user.id)
    await syncService.syncCalendars(user.id)

    await syncService.syncTransactions(user.id)
    await syncService.processPendingOperations(user.id)

    console.log('✅ Synchronisation complète terminée')
  }, [user, syncService])

  // Polling toutes les 30 secondes
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      await syncAll()
    }, 30000) // 30 secondes

    return () => clearInterval(interval)
  }, [user, syncAll])

  return { syncAll }
}
```

#### 📝 **4.3 Mise à Jour du Mapping dans Transactions**

**Fichier** : `frontend/src/features/transaction/infrastructure/repositories/TransactionRepository.ts`

```typescript
async create(data: CreateTransactionData): Promise<Transaction> {
  const localId = crypto.randomUUID()

  // 🔥 MAPPING des IDs locaux → serveur
  let conventionId = data.conventionId
  let calendarId = data.calendarId

  // Si conventionId est un localId, trouver le serverId
  if (conventionId) {
    const mapping = await db.idMappings
      .where('[localId+entityType]')
      .equals([conventionId, 'convention'])
      .first()

    if (mapping && mapping.serverId) {
      conventionId = mapping.serverId
    }
  }

  // Si calendarId est un localId, trouver le serverId
  if (calendarId) {
    const mapping = await db.idMappings
      .where('[localId+entityType]')
      .equals([calendarId, 'calendar'])
      .first()

    if (mapping && mapping.serverId) {
      calendarId = mapping.serverId
    }
  }

  const transaction = {
    localId,
    code: data.code,
    transactionType: data.transactionType,
    locationType: data.locationType,
    sellerId: data.sellerId,
    buyerId: data.buyerId,
    conventionId, // ✅ ID mappé
    calendarId,   // ✅ ID mappé
    products: data.products,
    transactionDate: data.transactionDate,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await db.transactions.add(transaction)

  // Ajouter à la queue
  await db.pendingOperations.add({
    entityId: localId,
    entityType: 'transaction',
    operation: 'create',
    payload: transaction,
    timestamp: Date.now(),
    retries: 0,
    userId: data.userId,
  })

  return this.mapToTransaction(transaction)
}
```

---

### **Phase 5 : Formulaires du Quick Menu** (1 jour)

#### 📝 **5.1 Formulaire Convention**

**Fichier** : `frontend/src/features/convention/presentation/components/ConventionForm.tsx`

```typescript
"use client";

import { useConventionStore } from '../../infrastructure/store/conventionStore'
import { useActorStore } from '@/features/actor/infrastructure/store/actorStore'
import { FormInput } from '@/components/form/FormInput'
import { FormDatePicker } from '@/components/form/FormDatePicker'
import { FormSelect } from '@/components/form/FormSelect'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'

export function ConventionForm() {
  const form = useForm()
  const router = useRouter()
  const { user } = useAuth()
  const { createConvention } = useConventionStore()
  const { actors } = useActorStore()

  // 🔥 Filtrer les OPAs et les acheteurs/exportateurs
  const opas = actors.filter(a => a.actorType === 'PRODUCERS')
  const buyersExporters = actors.filter(a =>
    ['BUYER', 'EXPORTER'].includes(a.actorType)
  )

  const onSubmit = async (data: any) => {
    await createConvention({
      code: data.code,
      opaId: data.opaId,
      buyerExporterId: data.buyerExporterId,
      signatureDate: data.signatureDate,
      userId: user!.id,
    })

    router.push('/conventions')
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormInput
        form={form}
        name="code"
        label="Code Convention"
        required
      />

      <FormSelect
        form={form}
        name="opaId"
        label="OPA"
        options={opas.map(o => ({
          value: o.id,
          label: `${o.familyName} (${o.onccId})`
        }))}
        required
      />

      <FormSelect
        form={form}
        name="buyerExporterId"
        label="Acheteur / Exportateur"
        options={buyersExporters.map(b => ({
          value: b.id,
          label: `${b.familyName} (${b.onccId})`
        }))}
        required
      />

      <FormDatePicker
        form={form}
        name="signatureDate"
        label="Date de signature"
        required
      />

      <Button type="submit">Créer la convention</Button>
    </form>
  )
}
```

#### 📝 **5.2 Formulaire Calendrier**

**Fichier** : `frontend/src/features/calendar/presentation/components/CalendarForm.tsx`

```typescript
export function CalendarForm({ type }: { type: 'MARCHE' | 'ENLEVEMENT' }) {
  const form = useForm()
  const router = useRouter()
  const { user } = useAuth()
  const { createCalendar } = useCalendarStore()
  const { conventions } = useConventionStore()
  const { actors } = useActorStore()

  // 🔥 Pour type ENLEVEMENT, charger les conventions actives
  const activeConventions = conventions.filter(c => c.status === 'active')
  const opas = actors.filter(a => a.actorType === 'PRODUCERS')

  const onSubmit = async (data: any) => {
    await createCalendar({
      code: data.code,
      type,
      opaId: data.opaId,
      conventionId: data.conventionId,
      locationCode: data.locationCode,
      startDate: data.startDate,
      endDate: data.endDate,
      eventTime: data.eventTime,
      userId: user!.id,
    })

    router.push('/calendars')
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormInput
        form={form}
        name="code"
        label="Code Calendrier"
        required
      />

      <FormSelect
        form={form}
        name="opaId"
        label="OPA"
        options={opas.map(o => ({
          value: o.id,
          label: `${o.familyName} (${o.onccId})`
        }))}
        required
      />

      {type === 'ENLEVEMENT' && (
        <FormSelect
          form={form}
          name="conventionId"
          label="Convention"
          options={activeConventions.map(c => ({
            value: c.id,
            label: `${c.code}`
          }))}
          required
        />
      )}

      <LocationSelectorForm
        form={form}
        name="locationCode"
        label="Localisation"
        level="district"
        required
      />

      <FormDatePicker
        form={form}
        name="startDate"
        label="Date de début"
        required
      />

      <FormDatePicker
        form={form}
        name="endDate"
        label="Date de fin"
        required
      />

      <FormInput
        form={form}
        name="eventTime"
        label="Heure"
        type="time"
      />

      <Button type="submit">Créer le calendrier</Button>
    </form>
  )
}
```

#### 📝 **5.3 Mise à Jour Formulaire Transaction**

**Fichier** : `frontend/src/features/transaction/presentation/components/TransactionForm.tsx`

```typescript
export function TransactionForm({ type }: { type: 'SALE' | 'PURCHASE' }) {
  const form = useForm()
  const router = useRouter()
  const { user } = useAuth()
  const { createTransaction } = useTransactionStore()
  const { calendars } = useCalendarStore()
  const { conventions } = useConventionStore()

  // 🔥 Charger les calendriers actifs (dans la période en cours)
  const now = new Date()
  const activeCalendars = calendars.filter(c =>
    c.status === 'active' &&
    new Date(c.startDate) <= now &&
    new Date(c.endDate) >= now
  )

  const activeConventions = conventions.filter(c => c.status === 'active')

  const onSubmit = async (data: any) => {
    await createTransaction({
      transactionType: type,
      locationType: data.locationType,
      calendarId: data.calendarId,
      conventionId: data.conventionId,
      sellerId: data.sellerId,
      buyerId: data.buyerId,
      products: data.products,
      transactionDate: data.transactionDate,
      userId: user!.id,
    })

    router.push('/transactions')
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormSelect
        form={form}
        name="locationType"
        label="Type de localisation"
        options={[
          { value: 'MARKET', label: 'Marché' },
          { value: 'CONVENTION', label: 'Convention' },
          { value: 'OUTSIDE_MARKET', label: 'Hors marché' },
        ]}
        required
      />

      {form.watch('locationType') === 'MARKET' && (
        <FormSelect
          form={form}
          name="calendarId"
          label="Calendrier de marché"
          options={activeCalendars
            .filter(c => c.type === 'MARCHE')
            .map(c => ({
              value: c.id,
              label: `${c.code}`
            }))}
          required
        />
      )}

      {form.watch('locationType') === 'CONVENTION' && (
        <>
          <FormSelect
            form={form}
            name="conventionId"
            label="Convention"
            options={activeConventions.map(c => ({
              value: c.id,
              label: `${c.code}`
            }))}
            required
          />

          <FormSelect
            form={form}
            name="calendarId"
            label="Calendrier d'enlèvement"
            options={activeCalendars
              .filter(c => c.type === 'ENLEVEMENT')
              .map(c => ({
                value: c.id,
                label: `${c.code}`
              }))}
          />
        </>
      )}

      {/* ... autres champs */}

      <Button type="submit">Créer la transaction</Button>
    </form>
  )
}
```

---

### **Phase 6 : Tests & Validation** (1 jour)

#### 📝 **6.1 Tests Backend**

```bash
# 1. Tester les migrations
cd backend
docker exec -it sifc_api_dev node ace migration:run

# 2. Vérifier les tables créées
docker exec -it sifc_postgres_dev psql -U oncc -d sifc_db -c "\dt"

# 3. Vérifier les données migrées
docker exec -it sifc_postgres_dev psql -U oncc -d sifc_db -c "SELECT COUNT(*) FROM conventions;"
docker exec -it sifc_postgres_dev psql -U oncc -d sifc_db -c "SELECT COUNT(*) FROM calendars;"

# 4. Vérifier les index
docker exec -it sifc_postgres_dev psql -U oncc -d sifc_db -c "\di conventions*"
docker exec -it sifc_postgres_dev psql -U oncc -d sifc_db -c "\di calendars*"

# 5. Tester les endpoints API
curl http://localhost:3333/conventions
curl http://localhost:3333/calendars
curl http://localhost:3333/conventions?opaId=xxx
curl http://localhost:3333/calendars/active
```

#### 📝 **6.2 Tests Frontend (Console Navigateur)**

```typescript
// Test de la migration IndexedDB
async function testMigration() {
  // 1. Vérifier la version
  console.log('Version DB:', db.verno) // Doit être 3

  // 2. Vérifier les tables
  const conventionsCount = await db.conventions.count()
  const calendarsCount = await db.calendars.count()
  console.log(`${conventionsCount} conventions, ${calendarsCount} calendars`)

  // 3. Vérifier que actors n'a plus conventions/calendars imbriqués
  const actor = await db.actors.limit(1).first()
  console.log('Actor has conventions field?', 'conventions' in actor) // false
  console.log('Actor has calendars field?', 'calendars' in actor) // false

  // 4. Vérifier les index
  const activeConventions = await db.conventions
    .where('status').equals('active')
    .toArray()
  console.log(`${activeConventions.length} conventions actives`)

  // 5. Vérifier la recherche par période
  const now = new Date()
  const activeCalendars = await db.calendars
    .where('[startDate+endDate]')
    .between([now.toISOString(), now.toISOString()], [now.toISOString(), '2099-12-31'])
    .toArray()
  console.log(`${activeCalendars.length} calendriers actifs`)
}

// Exécuter le test
testMigration()
```

#### 📝 **6.3 Tests de Synchronisation**

```typescript
// Test synchronisation conventions
async function testConventionSync() {
  // 1. Créer une convention offline
  const convention = await db.conventions.add({
    localId: crypto.randomUUID(),
    code: 'CONV-TEST-001',
    opaId: 'opa-id',
    buyerExporterId: 'buyer-id',
    signatureDate: new Date().toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncedAt: Date.now(),
  })

  console.log('Convention créée offline:', convention)

  // 2. Synchroniser
  const syncService = new SyncService()
  await syncService.syncConventions(userId)

  // 3. Vérifier le mapping
  const mapping = await db.idMappings
    .where('[localId+entityType]')
    .equals([convention.localId!, 'convention'])
    .first()

  console.log('Mapping:', mapping) // Doit avoir serverId

  // 4. Vérifier la convention mise à jour
  const synced = await db.conventions.get(convention.localId!)
  console.log('Convention synced:', synced) // Doit avoir id et pas localId
}

// Exécuter le test
testConventionSync()
```

#### 📝 **6.4 Tests de Performance**

```typescript
// Test de performance : Recherche conventions
async function benchmarkConventionSearch() {
  // Scénario : Rechercher toutes les conventions actives d'une OPA

  const opaId = 'xxx'

  console.time('Search conventions by OPA')
  const conventions = await db.conventions
    .where('opaId').equals(opaId)
    .and(c => c.status === 'active')
    .toArray()
  console.timeEnd('Search conventions by OPA')

  console.log(`${conventions.length} conventions trouvées`)
}

// Test de performance : Recherche calendriers par période
async function benchmarkCalendarSearch() {
  const now = new Date()

  console.time('Search active calendars')
  const calendars = await db.calendars
    .where('[startDate+endDate]')
    .between([now.toISOString(), now.toISOString()], [now.toISOString(), '2099-12-31'])
    .and(c => c.status === 'active')
    .toArray()
  console.timeEnd('Search active calendars')

  console.log(`${calendars.length} calendriers trouvés`)
}

// Exécuter les benchmarks
benchmarkConventionSearch()
benchmarkCalendarSearch()
```

---

## 📊 Checklist Finale de Migration

### ✅ Backend
- [ ] Migrations créées et testées (`conventions`, `calendars`)
- [ ] Migration des données existantes exécutée
- [ ] Models créés (`Convention`, `Calendar`)
- [ ] Services créés (`ConventionService`, `CalendarService`)
- [ ] Controllers créés (`ConventionsController`, `CalendarsController`)
- [ ] Routes ajoutées et testées
- [ ] Sérialisation des relations testée
- [ ] Endpoints testés avec Postman/cURL
- [ ] Index database vérifiés
- [ ] Performance testée (queries rapides)

### ✅ Frontend
- [ ] Migration Dexie version 3 créée
- [ ] Script de migration des données testé
- [ ] Vérification : actors sans conventions/calendars imbriqués
- [ ] Types domain créés
- [ ] Repositories créés (`ConventionRepository`, `CalendarRepository`)
- [ ] Stores Zustand créés (`conventionStore`, `calendarStore`)
- [ ] DI configurée (tsyringe)
- [ ] Synchronisation implémentée (`syncConventions`, `syncCalendars`)
- [ ] Polling mis à jour pour inclure conventions/calendars
- [ ] Mapping localId → serverId géré dans les transactions
- [ ] Index IndexedDB testés (recherche rapide)

### ✅ Formulaires Quick Menu
- [ ] Formulaire Convention créé
- [ ] Formulaire Calendrier Marché créé
- [ ] Formulaire Calendrier Enlèvement créé
- [ ] Formulaire Transaction mis à jour (sélection calendrier/convention)
- [ ] Navigation testée depuis Quick Menu
- [ ] Validation testée (champs requis)
- [ ] Création offline testée
- [ ] Synchronisation testée

### ✅ Tests
- [ ] Test migration backend (données conservées)
- [ ] Test migration frontend (IndexedDB v2 → v3)
- [ ] Test création convention offline
- [ ] Test création calendrier offline
- [ ] Test synchronisation à la connexion
- [ ] Test polling (30 secondes)
- [ ] Test création transaction avec convention/calendrier
- [ ] Test mapping IDs locaux → serveur
- [ ] Tests de performance (benchmarks)
- [ ] Tests avec 100+ acteurs

---

## 🔄 Stratégie de Rollback

### Si Problème en Production

#### Backend

```bash
# 1. Rollback migrations
docker exec -it sifc_api_dev node ace migration:rollback --batch=X

# 2. Restaurer backup
docker exec -it sifc_postgres_dev pg_restore -U oncc -d sifc_db /backup/backup-pre-migration-YYYYMMDD.sql

# 3. Redémarrer le serveur
docker restart sifc_api_dev
```

#### Frontend

```typescript
// 1. Revenir à la version 2 de Dexie
// Dans db.ts, commenter la version 3 et décommenter la version 2

// 2. Forcer la réinitialisation de la DB
await db.delete()
await db.open()

// 3. Resynchroniser
const syncService = new SyncService()
await syncService.syncAll()
```

#### Vérification Post-Rollback

```bash
# Backend
docker exec -it sifc_postgres_dev psql -U oncc -d sifc_db -c "SELECT COUNT(*) FROM actors;"

# Frontend (console navigateur)
console.log('DB version:', db.verno) // Doit être 2
const actor = await db.actors.limit(1).first()
console.log('Actor has conventions?', 'conventions' in actor) // true
```

---

## 🎯 Avantages Post-Migration

### Performance
- ✅ **10-100x plus rapide** pour chercher conventions/calendars
- ✅ Index utilisés au lieu de scans complets
- ✅ Formulaires chargent instantanément
- ✅ Recherche par période optimisée

### Évolutivité
- ✅ Passe à l'échelle (10,000+ entités)
- ✅ Facile d'ajouter de nouvelles fonctionnalités
- ✅ Relations normalisées

### Maintenabilité
- ✅ Code plus propre et modulaire
- ✅ Séparation des responsabilités
- ✅ Tests plus faciles
- ✅ Debugging simplifié

### Expérience Utilisateur
- ✅ Formulaires Quick Menu rapides
- ✅ Recherche instantanée
- ✅ Pas de freeze de l'interface
- ✅ Synchronisation efficace

---

## 📈 Métriques de Succès

### Avant Migration
- ⏱️ Recherche conventions : **500-2000ms** (scan complet)
- ⏱️ Recherche calendriers par période : **1000-3000ms** (scan + filter JS)
- 💾 Taille moyenne d'un actor : **50-200KB** (avec imbrications)
- ❌ Impossible de filtrer efficacement

### Après Migration
- ⚡ Recherche conventions : **5-20ms** (index direct)
- ⚡ Recherche calendriers par période : **10-30ms** (index composé)
- 💾 Taille moyenne d'un actor : **5-10KB** (sans imbrications)
- ✅ Filtrage rapide et flexible

---

## 📞 Support

En cas de problème pendant la migration :

1. **Vérifier les logs** :
   - Backend : `docker logs sifc_api_dev -f`
   - Frontend : Console navigateur (F12)

2. **Consulter cette documentation** :
   - Section Rollback
   - Section Tests

3. **Contacter l'équipe technique** avec :
   - Version de la DB (frontend + backend)
   - Logs d'erreur
   - Étape où le problème survient

---

**Date de création** : Janvier 2025
**Dernière mise à jour** : Janvier 2025
**Version** : 1.0
