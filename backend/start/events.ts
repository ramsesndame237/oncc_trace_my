/*
|--------------------------------------------------------------------------
| Events configuration
|--------------------------------------------------------------------------
|
| Ce fichier configure les listeners d'événements de l'application
| Tous les événements s'exécutent de manière asynchrone en arrière-plan
|
*/

import emitter from '@adonisjs/core/services/emitter'
import app from '@adonisjs/core/services/app'

// Import des types d'événements - Campaign
import type { BuyerConventionsStatusPayload } from '#events/campaign/buyer_conventions_status'
import type { CampaignActivatedPayload } from '#events/campaign/campaign_activated'
import type { OpaConventionsStatusPayload } from '#events/campaign/opa_conventions_status'
import type { StoresStatusPayload } from '#events/campaign/stores_status'

// Import des types d'événements - Convention
import type { ConventionAssociatedToCampaignPayload } from '#events/convention/convention_associated_to_campaign'
import type { ConventionCreatedPayload } from '#events/convention/convention_created'
import type { ConventionDissociatedFromCampaignPayload } from '#events/convention/convention_dissociated_from_campaign'
import type { ConventionUpdatedPayload } from '#events/convention/convention_updated'

// Import des types d'événements - Calendar
import type { MarketCalendarCreatedPayload } from '#events/calendar/market_calendar_created'
import type { MarketCalendarUpdatedPayload } from '#events/calendar/market_calendar_updated'
import type { MarketCalendarCancelledPayload } from '#events/calendar/market_calendar_cancelled'
import type { PickupCalendarCreatedPayload } from '#events/calendar/pickup_calendar_created'
import type { PickupCalendarUpdatedPayload } from '#events/calendar/pickup_calendar_updated'
import type { PickupCalendarCancelledPayload } from '#events/calendar/pickup_calendar_cancelled'

// Import des types d'événements - Product Transfer
import type { GroupageTransferCreatedPayload } from '#events/product_transfer/groupage_transfer_created'
import type { GroupageTransferCancelledPayload } from '#events/product_transfer/groupage_transfer_cancelled'
import type { StandardTransferCreatedPayload } from '#events/product_transfer/standard_transfer_created'
import type { StandardTransferCancelledPayload } from '#events/product_transfer/standard_transfer_cancelled'

// Import des types d'événements - Transaction
import type { TransactionValidatedPayload } from '#events/transaction/transaction_validated'
import type { TransactionCancelledPayload } from '#events/transaction/transaction_cancelled'

// Import des types d'événements - Stores
import type { StoreActivatedPayload } from '#events/stores/store_activated'
import type { StoreDeactivatedPayload } from '#events/stores/store_deactivated'
import type { OccupantAssignedPayload } from '#events/stores/occupant_assigned'
import type { OccupantUnassignedPayload } from '#events/stores/occupant_unassigned'

// Import des types d'événements - Authentification
import type { AccountInitializationEmailPayload } from '#events/auth/account_initialization_email'
import type { OtpEmailPayload } from '#events/auth/otp_email'
import type { PasswordChangeEmailPayload } from '#events/auth/password_change_email'
import type { PasswordResetLinkEmailPayload } from '#events/auth/password_reset_link_email'
import type { UsernameRecoveryEmailPayload } from '#events/auth/username_recovery_email'

// Import des types d'événements - Actor
import type { ActorActivatedPayload } from '#events/actor/actor_activated'
import type { ActorDeactivatedPayload } from '#events/actor/actor_deactivated'
import type { ProducerAddedToOpaPayload } from '#events/actor/producer_added_to_opa'
import type { ProducerRemovedFromOpaPayload } from '#events/actor/producer_removed_from_opa'
import type { BuyerAddedToExporterPayload } from '#events/actor/buyer_added_to_exporter'
import type { BuyerRemovedFromExporterPayload } from '#events/actor/buyer_removed_from_exporter'
import type { BuyerAssignedAsMandatairePayload } from '#events/actor/buyer_assigned_as_mandataire'
import type { BuyerUnassignedAsMandatairePayload } from '#events/actor/buyer_unassigned_as_mandataire'

// Import des types d'événements - User
import type { AccountActivatedPayload } from '#events/user/account_activated'
import type { AccountDeactivatedPayload } from '#events/user/account_deactivated'
import type { ActorManagerWelcomePayload } from '#events/user/actor_manager_welcome'
import type { AdminPasswordResetPayload } from '#events/user/admin_password_reset'
import type { WelcomePayload } from '#events/user/welcome'

// Import des listeners - Campaign
import SendBuyerConventionsStatusNotifications from '#listeners/campaign/send_buyer_conventions_status_notifications'
import SendCampaignNotificationEmails from '#listeners/campaign/send_campaign_notification_emails'
import SendOpaConventionsStatusNotifications from '#listeners/campaign/send_opa_conventions_status_notifications'
import SendStoresStatusNotifications from '#listeners/campaign/send_stores_status_notifications'

// Import des listeners - Convention
import SendConventionAssociatedNotifications from '#listeners/convention/send_convention_associated_notifications'
import SendConventionCreatedNotifications from '#listeners/convention/send_convention_created_notifications'
import SendConventionDissociatedNotifications from '#listeners/convention/send_convention_dissociated_notifications'
import SendConventionUpdatedNotifications from '#listeners/convention/send_convention_updated_notifications'

// Import des listeners - Calendar
import SendMarketCalendarCreatedNotifications from '#listeners/calendar/send_market_calendar_created_notifications'
import SendMarketCalendarUpdatedNotifications from '#listeners/calendar/send_market_calendar_updated_notifications'
import SendMarketCalendarCancelledNotifications from '#listeners/calendar/send_market_calendar_cancelled_notifications'
import SendPickupCalendarCreatedNotifications from '#listeners/calendar/send_pickup_calendar_created_notifications'
import SendPickupCalendarUpdatedNotifications from '#listeners/calendar/send_pickup_calendar_updated_notifications'
import SendPickupCalendarCancelledNotifications from '#listeners/calendar/send_pickup_calendar_cancelled_notifications'

// Import des listeners - Product Transfer
import SendGroupageTransferCreatedNotification from '#listeners/product_transfer/send_groupage_transfer_created_notification'
import SendGroupageTransferCancelledNotification from '#listeners/product_transfer/send_groupage_transfer_cancelled_notification'
import SendStandardTransferCreatedNotification from '#listeners/product_transfer/send_standard_transfer_created_notification'
import SendStandardTransferCancelledNotification from '#listeners/product_transfer/send_standard_transfer_cancelled_notification'

// Import des listeners - Transaction
import SendTransactionValidatedNotifications from '#listeners/transaction/send_transaction_validated_notifications'
import SendTransactionCancelledNotification from '#listeners/transaction/send_transaction_cancelled_notification'

// Import des listeners - Stores
import SendStoreActivatedNotifications from '#listeners/stores/send_store_activated_notifications'
import SendStoreDeactivatedNotifications from '#listeners/stores/send_store_deactivated_notifications'
import SendOccupantAssignedNotifications from '#listeners/stores/send_occupant_assigned_notifications'
import SendOccupantUnassignedNotifications from '#listeners/stores/send_occupant_unassigned_notifications'

// Import des listeners - Actor
import SendActorActivatedEmail from '#listeners/actor/send_actor_activated_email'
import SendActorDeactivatedEmail from '#listeners/actor/send_actor_deactivated_email'
import SendProducerAddedEmail from '#listeners/actor/send_producer_added_email'
import SendProducerRemovedEmail from '#listeners/actor/send_producer_removed_email'
import SendBuyerAddedToExporterEmail from '#listeners/actor/send_buyer_added_to_exporter_email'
import SendBuyerRemovedFromExporterEmail from '#listeners/actor/send_buyer_removed_from_exporter_email'
import SendBuyerAssignedAsMandataireEmail from '#listeners/actor/send_buyer_assigned_as_mandataire_email'
import SendBuyerUnassignedAsMandataireEmail from '#listeners/actor/send_buyer_unassigned_as_mandataire_email'

// Import des listeners - Authentification
import SendAccountInitializationEmail from '#listeners/auth/send_account_initialization_email'
import SendOtpEmail from '#listeners/auth/send_otp_email'
import SendPasswordChangeEmail from '#listeners/auth/send_password_change_email'
import SendPasswordResetLinkEmail from '#listeners/auth/send_password_reset_link_email'
import SendUsernameRecoveryEmail from '#listeners/auth/send_username_recovery_email'

// Import des listeners - User
import SendAccountActivatedEmail from '#listeners/user/send_account_activated_email'
import SendAccountDeactivatedEmail from '#listeners/user/send_account_deactivated_email'
import SendActorManagerWelcomeEmail from '#listeners/user/send_actor_manager_welcome_email'
import SendAdminPasswordResetEmail from '#listeners/user/send_admin_password_reset_email'
import SendWelcomeEmail from '#listeners/user/send_welcome_email'

/**
 * Déclaration des types d'événements pour TypeScript
 */
declare module '@adonisjs/core/types' {
  interface EventsList {
    // Événements de campagne
    'campaign:activated': CampaignActivatedPayload
    'campaign:stores-status': StoresStatusPayload
    'campaign:opa-conventions-status': OpaConventionsStatusPayload
    'campaign:buyer-conventions-status': BuyerConventionsStatusPayload

    // Événements de convention
    'convention:created': ConventionCreatedPayload
    'convention:updated': ConventionUpdatedPayload
    'convention:associated-to-campaign': ConventionAssociatedToCampaignPayload
    'convention:dissociated-from-campaign': ConventionDissociatedFromCampaignPayload

    // Événements de calendrier
    'calendar:market-created': MarketCalendarCreatedPayload
    'calendar:market-updated': MarketCalendarUpdatedPayload
    'calendar:market-cancelled': MarketCalendarCancelledPayload
    'calendar:pickup-created': PickupCalendarCreatedPayload
    'calendar:pickup-updated': PickupCalendarUpdatedPayload
    'calendar:pickup-cancelled': PickupCalendarCancelledPayload

    // Événements de transferts de produits
    'product-transfer:groupage-created': GroupageTransferCreatedPayload
    'product-transfer:groupage-cancelled': GroupageTransferCancelledPayload
    'product-transfer:standard-created': StandardTransferCreatedPayload
    'product-transfer:standard-cancelled': StandardTransferCancelledPayload

    // Événements de transactions
    'transaction:validated': TransactionValidatedPayload
    'transaction:cancelled': TransactionCancelledPayload

    // Événements de magasins
    'store:activated': StoreActivatedPayload
    'store:deactivated': StoreDeactivatedPayload
    'occupant:assigned': OccupantAssignedPayload
    'occupant:unassigned': OccupantUnassignedPayload

    // Événements d'authentification
    'auth:otp': OtpEmailPayload
    'auth:account-initialization': AccountInitializationEmailPayload
    'auth:password-change': PasswordChangeEmailPayload
    'auth:username-recovery': UsernameRecoveryEmailPayload
    'auth:password-reset-link': PasswordResetLinkEmailPayload

    // Événements de gestion des acteurs
    'actor:activated': ActorActivatedPayload
    'actor:deactivated': ActorDeactivatedPayload
    'actor:producer-added-to-opa': ProducerAddedToOpaPayload
    'actor:producer-removed-from-opa': ProducerRemovedFromOpaPayload
    'actor:buyer-added-to-exporter': BuyerAddedToExporterPayload
    'actor:buyer-removed-from-exporter': BuyerRemovedFromExporterPayload
    'actor:buyer-assigned-as-mandataire': BuyerAssignedAsMandatairePayload
    'actor:buyer-unassigned-as-mandataire': BuyerUnassignedAsMandatairePayload

    // Événements de gestion des utilisateurs
    'user:welcome': WelcomePayload
    'user:account-activated': AccountActivatedPayload
    'user:account-deactivated': AccountDeactivatedPayload
    'user:admin-password-reset': AdminPasswordResetPayload
    'user:actor-manager-welcome': ActorManagerWelcomePayload
  }
}

/**
 * Enregistrement des listeners d'événements
 */

// ====================================
// Événements de campagne
// ====================================

emitter.on('campaign:activated', async (payload) => {
  const listener = new SendCampaignNotificationEmails()
  await listener.handle(payload)
})

emitter.on('campaign:stores-status', async (payload) => {
  const listener = new SendStoresStatusNotifications()
  await listener.handle(payload)
})

emitter.on('campaign:opa-conventions-status', async (payload) => {
  const listener = new SendOpaConventionsStatusNotifications()
  await listener.handle(payload)
})

emitter.on('campaign:buyer-conventions-status', async (payload) => {
  const listener = new SendBuyerConventionsStatusNotifications()
  await listener.handle(payload)
})

// ====================================
// Événements de convention
// ====================================

emitter.on('convention:created', async (payload) => {
  const listener = new SendConventionCreatedNotifications()
  await listener.handle(payload)
})

emitter.on('convention:updated', async (payload) => {
  const listener = new SendConventionUpdatedNotifications()
  await listener.handle(payload)
})

emitter.on('convention:associated-to-campaign', async (payload) => {
  const listener = new SendConventionAssociatedNotifications()
  await listener.handle(payload)
})

emitter.on('convention:dissociated-from-campaign', async (payload) => {
  const listener = new SendConventionDissociatedNotifications()
  await listener.handle(payload)
})

// ====================================
// Événements de calendrier
// ====================================

emitter.on('calendar:market-created', async (payload) => {
  const listener = await app.container.make(SendMarketCalendarCreatedNotifications)
  await listener.handle(payload)
})

emitter.on('calendar:market-updated', async (payload) => {
  const listener = await app.container.make(SendMarketCalendarUpdatedNotifications)
  await listener.handle(payload)
})

emitter.on('calendar:market-cancelled', async (payload) => {
  const listener = await app.container.make(SendMarketCalendarCancelledNotifications)
  await listener.handle(payload)
})

emitter.on('calendar:pickup-created', async (payload) => {
  const listener = new SendPickupCalendarCreatedNotifications()
  await listener.handle(payload)
})

emitter.on('calendar:pickup-updated', async (payload) => {
  const listener = new SendPickupCalendarUpdatedNotifications()
  await listener.handle(payload)
})

emitter.on('calendar:pickup-cancelled', async (payload) => {
  const listener = new SendPickupCalendarCancelledNotifications()
  await listener.handle(payload)
})

// ====================================
// Événements de transferts de produits
// ====================================

emitter.on('product-transfer:groupage-created', async (payload) => {
  const listener = new SendGroupageTransferCreatedNotification()
  await listener.handle(payload)
})

emitter.on('product-transfer:groupage-cancelled', async (payload) => {
  const listener = new SendGroupageTransferCancelledNotification()
  await listener.handle(payload)
})

emitter.on('product-transfer:standard-created', async (payload) => {
  const listener = new SendStandardTransferCreatedNotification()
  await listener.handle(payload)
})

emitter.on('product-transfer:standard-cancelled', async (payload) => {
  const listener = new SendStandardTransferCancelledNotification()
  await listener.handle(payload)
})

// ====================================
// Événements de transactions
// ====================================

emitter.on('transaction:validated', async (payload) => {
  const listener = new SendTransactionValidatedNotifications()
  await listener.handle(payload)
})

emitter.on('transaction:cancelled', async (payload) => {
  const listener = new SendTransactionCancelledNotification()
  await listener.handle(payload)
})

// ====================================
// Événements de magasins
// ====================================

emitter.on('store:activated', async (payload) => {
  const listener = new SendStoreActivatedNotifications()
  await listener.handle(payload)
})

emitter.on('store:deactivated', async (payload) => {
  const listener = new SendStoreDeactivatedNotifications()
  await listener.handle(payload)
})

emitter.on('occupant:assigned', async (payload) => {
  const listener = new SendOccupantAssignedNotifications()
  await listener.handle(payload)
})

emitter.on('occupant:unassigned', async (payload) => {
  const listener = new SendOccupantUnassignedNotifications()
  await listener.handle(payload)
})

// ====================================
// Événements d'authentification
// ====================================

emitter.on('auth:otp', async (payload) => {
  const listener = new SendOtpEmail()
  await listener.handle(payload)
})

emitter.on('auth:account-initialization', async (payload) => {
  const listener = new SendAccountInitializationEmail()
  await listener.handle(payload)
})

emitter.on('auth:password-change', async (payload) => {
  const listener = new SendPasswordChangeEmail()
  await listener.handle(payload)
})

emitter.on('auth:username-recovery', async (payload) => {
  const listener = new SendUsernameRecoveryEmail()
  await listener.handle(payload)
})

emitter.on('auth:password-reset-link', async (payload) => {
  const listener = new SendPasswordResetLinkEmail()
  await listener.handle(payload)
})

// ====================================
// Événements de gestion des utilisateurs
// ====================================

emitter.on('user:welcome', async (payload) => {
  const listener = new SendWelcomeEmail()
  await listener.handle(payload)
})

emitter.on('user:account-activated', async (payload) => {
  const listener = new SendAccountActivatedEmail()
  await listener.handle(payload)
})

emitter.on('user:account-deactivated', async (payload) => {
  const listener = new SendAccountDeactivatedEmail()
  await listener.handle(payload)
})

emitter.on('user:admin-password-reset', async (payload) => {
  const listener = new SendAdminPasswordResetEmail()
  await listener.handle(payload)
})

emitter.on('user:actor-manager-welcome', async (payload) => {
  const listener = new SendActorManagerWelcomeEmail()
  await listener.handle(payload)
})

// ====================================
// Événements de gestion des acteurs
// ====================================

emitter.on('actor:activated', async (payload) => {
  const listener = new SendActorActivatedEmail()
  await listener.handle(payload)
})

emitter.on('actor:deactivated', async (payload) => {
  const listener = new SendActorDeactivatedEmail()
  await listener.handle(payload)
})

emitter.on('actor:producer-added-to-opa', async (payload) => {
  const listener = new SendProducerAddedEmail()
  await listener.handle(payload)
})

emitter.on('actor:producer-removed-from-opa', async (payload) => {
  const listener = new SendProducerRemovedEmail()
  await listener.handle(payload)
})

emitter.on('actor:buyer-added-to-exporter', async (payload) => {
  const listener = new SendBuyerAddedToExporterEmail()
  await listener.handle(payload)
})

emitter.on('actor:buyer-removed-from-exporter', async (payload) => {
  const listener = new SendBuyerRemovedFromExporterEmail()
  await listener.handle(payload)
})

emitter.on('actor:buyer-assigned-as-mandataire', async (payload) => {
  const listener = new SendBuyerAssignedAsMandataireEmail()
  await listener.handle(payload)
})

emitter.on('actor:buyer-unassigned-as-mandataire', async (payload) => {
  const listener = new SendBuyerUnassignedAsMandataireEmail()
  await listener.handle(payload)
})
