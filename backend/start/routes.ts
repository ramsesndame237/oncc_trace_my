/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')

// Routes publiques (sans authentification)
router
  .group(() => {
    // Authentification
    router.post('/login', [AuthController, 'login'])
    router.post('/verify-otp', [AuthController, 'verifyOtp'])
    router.post('/resend-otp', [AuthController, 'resendOtp'])
    router.post('/forgot-username', [AuthController, 'forgotUsername'])
    router.post('/forgot-password', [AuthController, 'forgotPassword'])
    router.post('/get-security-questions', [AuthController, 'getSecurityQuestions'])
    router.post('/verify-security-answers', [AuthController, 'verifySecurityQuestionsAnswers'])
    router.post('/reset-password', [AuthController, 'resetPassword'])
    router.post('/initialize-account', [AuthController, 'initializeAccount'])

    // Gestion des localisations
    const LocationsController = () => import('#controllers/locations_controller')
    router.get('/locations', [LocationsController, 'index'])
    router.get('/locations/hierarchy', [LocationsController, 'hierarchy'])
    router.get('/locations/:code/children', [LocationsController, 'children'])

    // Health check
    router.get('/health', async ({ response }) => {
      return response.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'SIFC API',
      })
    })

    // Téléchargement de documents (accès public)
    const DocumentsController = () => import('#controllers/documents_controller')
    router.get('/documents/:id/download', [DocumentsController, 'download'])
  })
  .prefix('/api/v1')

// Routes protégées (avec authentification uniquement)
router
  .group(() => {
    // Profil utilisateur
    router.get('/me', [AuthController, 'me'])
    router.patch('/me', [AuthController, 'updateSelf'])
    router.post('/logout', [AuthController, 'logout'])
    router.post('/change-password', [AuthController, 'changePassword'])

    // Gestion des utilisateurs (permissions gérées côté frontend)
    const UsersController = () => import('#controllers/users_controller')
    router.get('/users', [UsersController, 'index'])
    router.post('/users', [UsersController, 'store'])
    router.get('/users/stats', [UsersController, 'stats'])
    router.get('/users/:id', [UsersController, 'show'])
    router.put('/users/:id', [UsersController, 'update'])
    router.patch('/users/:id/status', [UsersController, 'updateStatus'])
    router.post('/users/:id/admin-reset-password', [UsersController, 'adminResetPassword'])
    router.delete('/users/:id', [UsersController, 'destroy'])

    // Gestion des bassins de production
    const ProductionBasinsController = () => import('#controllers/production_basins_controller')
    router.get('/production-basins', [ProductionBasinsController, 'index'])
    router.post('/production-basins', [ProductionBasinsController, 'store'])
    router.get('/production-basins/stats', [ProductionBasinsController, 'stats'])
    router.get('/production-basins/:id', [ProductionBasinsController, 'show'])
    router.put('/production-basins/:id', [ProductionBasinsController, 'update'])
    router.delete('/production-basins/:id', [ProductionBasinsController, 'destroy'])
    router.post('/production-basins/:id/assign-users', [ProductionBasinsController, 'assignUsers'])
    router.post('/production-basins/:id/unassign-users', [
      ProductionBasinsController,
      'unassignUsers',
    ])

    // Gestion des campagnes
    const CampaignsController = () => import('#controllers/campaigns_controller')
    router.get('/campaigns', [CampaignsController, 'index'])
    router.get('/campaigns/active', [CampaignsController, 'getActive'])
    router.get('/campaigns/count', [CampaignsController, 'count'])
    router.post('/campaigns', [CampaignsController, 'store'])
    router.get('/campaigns/:id', [CampaignsController, 'show'])
    router.put('/campaigns/:id', [CampaignsController, 'update'])
    router.patch('/campaigns/:id/activate', [CampaignsController, 'activate'])
    router.patch('/campaigns/:id/deactivate', [CampaignsController, 'deactivate'])

    // Gestion des magasins
    const StoresController = () => import('#controllers/stores_controller')
    router.get('/stores', [StoresController, 'index'])
    router.post('/stores', [StoresController, 'store'])
    router.get('/stores/stats', [StoresController, 'stats'])
    router.get('/stores/:id', [StoresController, 'show'])
    router.put('/stores/:id', [StoresController, 'update'])
    router.patch('/stores/:id/activate', [StoresController, 'activate'])
    router.patch('/stores/:id/deactivate', [StoresController, 'deactivate'])

    // Gestion des occupants d'un magasin
    router.get('/stores/:id/occupants', [StoresController, 'getOccupants'])
    router.post('/stores/:id/occupants', [StoresController, 'addOccupant'])
    router.delete('/stores/:id/occupants/:actorId', [StoresController, 'removeOccupant'])

    // Synchronisation
    const SyncController = () => import('#controllers/sync_controller')
    router.get('/sync/check-updates', [SyncController, 'checkUpdates'])

    // Gestion des logs d'audit
    const AuditLogsController = () => import('#controllers/audit_logs_controller')
    router.get('/audit-logs', [AuditLogsController, 'index'])
    router.get('/audit-logs/stats', [AuditLogsController, 'stats'])
    router.get('/audit-logs/:id', [AuditLogsController, 'show'])

    // Gestion des acteurs
    const ActorsController = () => import('#controllers/actors_controller')
    router.get('/actors', [ActorsController, 'index'])
    router.post('/actors', [ActorsController, 'store'])
    router.get('/actors/type/:type', [ActorsController, 'getByType'])

    // Routes de synchronisation pour clients offline (basin_admin et field_agent)
    router.get('/actors/sync/all', [ActorsController, 'syncAll'])
    router.get('/actors/sync/updates', [ActorsController, 'syncUpdates'])

    // Routes spécifiques des relations (AVANT /actors/:id pour éviter les conflits)
    // Récupérer les OPA d'un producteur
    router.get('/producers/:producerId/opas', [ActorsController, 'getProducerOpas'])

    // Récupérer les productions d'un producteur
    router.get('/producers/:producerId/productions', [ActorsController, 'getProducerProductions'])

    // Récupérer les collectes d'un OPA
    router.get('/opas/:opaId/collections', [ActorsController, 'getOpaCollections'])

    // Récupérer les producteurs d'un OPA
    router.get('/opas/:opaId/producers', [ActorsController, 'getOpaProducers'])

    // Récupérer les exportateurs d'un acheteur (campagne active)
    router.get('/buyers/:buyerId/exporters', [ActorsController, 'getBuyerExporters'])

    // Récupérer les acheteurs mandataires d'un exportateur (campagne active)
    router.get('/exporters/:exporterId/buyers', [ActorsController, 'getExporterBuyers'])

    // Gestion des producteurs dans un OPA
    router.post('/actors/:opaId/producers/:producerId?', [ActorsController, 'addProducer'])
    router.delete('/actors/:opaId/producers/:producerId', [ActorsController, 'removeProducer'])

    // Gestion des acheteurs mandataires d'un exportateur
    router.post('/actors/:exporterId/buyers/:buyerId', [ActorsController, 'addBuyer'])
    router.delete('/actors/:exporterId/buyers/:buyerId', [ActorsController, 'removeBuyer'])

    // Routes génériques des acteurs (APRÈS les routes spécifiques)
    router.get('/actors/:id', [ActorsController, 'show'])
    router.put('/actors/:id', [ActorsController, 'update'])
    router.patch('/actors/:id/status', [ActorsController, 'updateStatus'])
    router.delete('/actors/:id', [ActorsController, 'destroy'])

    // Gestion des parcelles
    const ParcelsController = () => import('#controllers/parcels_controller')
    router.get('/parcels', [ParcelsController, 'index'])
    router.post('/parcels', [ParcelsController, 'store'])
    router.get('/parcels/stats', [ParcelsController, 'stats'])
    router.get('/parcels/:id', [ParcelsController, 'show'])
    router.put('/parcels/:id', [ParcelsController, 'update'])
    router.delete('/parcels/:id', [ParcelsController, 'destroy'])

    // Routes spécifiques aux producteurs
    router.get('/producers/:producerId/parcels', [ParcelsController, 'getByProducer'])
    router.post('/producers/:producerId/parcels/bulk', [ParcelsController, 'bulkStore'])

    // Activation/Désactivation des parcelles
    router.patch('/parcels/:id/status', [ParcelsController, 'updateStatus'])

    // Gestion des documents
    const DocumentsController = () => import('#controllers/documents_controller')
    router.get('/documents', [DocumentsController, 'index'])
    router.post('/documents', [DocumentsController, 'store'])
    router.post('/documents/sync', [DocumentsController, 'sync'])
    router.get('/documents/:id', [DocumentsController, 'show'])
    router.get('/documents/:id/preview', [DocumentsController, 'preview'])
    router.delete('/documents/:id', [DocumentsController, 'destroy'])

    // Gestion des conventions
    const ConventionsController = () => import('#controllers/conventions_controller')
    router.get('/conventions', [ConventionsController, 'index'])
    router.post('/conventions', [ConventionsController, 'store'])

    // Routes de synchronisation pour clients offline
    router.get('/conventions/sync/all', [ConventionsController, 'syncAll'])
    router.get('/conventions/sync/updates', [ConventionsController, 'syncUpdates'])

    router.get('/conventions/:id', [ConventionsController, 'show'])
    router.put('/conventions/:id', [ConventionsController, 'update'])
    router.post('/conventions/:id/campaigns', [ConventionsController, 'associateCampaign'])
    router.delete('/conventions/:id/campaigns', [ConventionsController, 'dissociateCampaign'])
    router.post('/conventions/:id/activate-to-campaign', [
      ConventionsController,
      'associateCampaign',
    ])
    router.delete('/conventions/:id', [ConventionsController, 'destroy'])

    // Gestion des transferts de produits
    const ProductTransfersController = () => import('#controllers/product_transfers_controller')
    router.get('/product-transfers', [ProductTransfersController, 'index'])
    router.post('/product-transfers', [ProductTransfersController, 'store'])
    router.get('/product-transfers/:id', [ProductTransfersController, 'show'])
    router.put('/product-transfers/:id', [ProductTransfersController, 'update'])
    router.patch('/product-transfers/:id/status', [ProductTransfersController, 'updateStatus'])
    router.delete('/product-transfers/:id', [ProductTransfersController, 'destroy'])

    // Gestion des calendriers
    const CalendarsController = () => import('#controllers/calendars_controller')
    router.get('/calendars', [CalendarsController, 'index'])
    router.post('/calendars', [CalendarsController, 'store'])

    // Routes de synchronisation pour clients offline
    router.get('/calendars/sync/all', [CalendarsController, 'syncAll'])
    router.get('/calendars/sync/updates', [CalendarsController, 'syncUpdates'])

    router.get('/calendars/:id', [CalendarsController, 'show'])
    router.put('/calendars/:id', [CalendarsController, 'update'])
    router.patch('/calendars/:id/status', [CalendarsController, 'updateStatus'])
    router.patch('/calendars/:id/expected-sales-count', [
      CalendarsController,
      'updateExpectedSalesCount',
    ])
    router.delete('/calendars/:id', [CalendarsController, 'destroy'])

    // Gestion des transactions
    const TransactionsController = () => import('#controllers/transactions_controller')
    router.get('/transactions', [TransactionsController, 'index'])
    router.post('/transactions', [TransactionsController, 'store'])
    router.get('/transactions/:id', [TransactionsController, 'show'])
    router.put('/transactions/:id', [TransactionsController, 'update'])
    router.put('/transactions/:id/products', [TransactionsController, 'updateProducts'])
    router.post('/transactions/:id/confirm', [TransactionsController, 'confirm'])
    router.post('/transactions/:id/cancel', [TransactionsController, 'cancel'])
    router.get('/transactions/:id/complementary', [TransactionsController, 'complementary'])
    router.delete('/transactions/:id', [TransactionsController, 'destroy'])

    // TODO: Ajouter les autres routes protégées ici
    // - Rapports et statistiques
    // etc.

    // Les permissions seront gérées côté frontend selon le rôle de l'utilisateur
  })
  .prefix('/api/v1')
  .use(middleware.auth())

// Route par défaut
router.get('/', async () => {
  return {
    hello: 'world',
    message: 'SIFC API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }
})
