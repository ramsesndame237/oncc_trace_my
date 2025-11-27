/**
 * Conteneur d'injection de dépendances central
 * Configuration de tous les services de l'application
 */

import "reflect-metadata";
import { container } from "tsyringe";

// Import des tokens
import { DI_TOKENS } from "./tokens";

// Import des types core
import type { ISyncHandler } from "@/core/domain/sync.types";

// Import des interfaces
import type { IActorRepository } from "@/features/actor/domain/IActorRepository";
import type { IAuditLogRepository } from "@/features/auditLog/domain/IAuditLogRepository";
import type { IAuthRepository } from "@/features/auth/domain/IAuthRepository";
import type { ICalendarRepository } from "@/features/calendar/domain/ICalendarRepository";
import type { ICampaignRepository } from "@/features/campaign/domain/ICampaignRepository";
import type { IConventionRepository } from "@/features/convention/domain/IConventionRepository";
import type { IDocumentRepository } from "@/features/document/domain/IDocumentRepository";
import type { ILocationRepository } from "@/features/location/domain/ILocationRepository";
import type { IParcelRepository } from "@/features/parcel/domain/IParcelRepository";
import type { IProductionBasinRepository } from "@/features/production-basin/domain/IProductionBasinRepository";
import type { IProductTransferRepository } from "@/features/product-transfer/domain/IProductTransferRepository";
import type { IStoreRepository } from "@/features/store/domain/IStoreRepository";
import type { ITransactionRepository } from "@/features/transaction/domain/ITransactionRepository";
import type { IUserRepository } from "@/features/user/domain/IUserRepository";

// Sync offline Service
import { PollingService } from "@/core/infrastructure/services/pollingService";
import { SyncService } from "@/core/infrastructure/services/syncService";

// AuditLog - Imports
import { GetAuditLogsUseCase } from "@/features/auditLog/application/useCases/getAuditLogsUseCase";
import { AuditLogRepository } from "@/features/auditLog/infrastructure/repositories/auditLogRepository";
import { AuditLogService } from "@/features/auditLog/infrastructure/services/auditLogService";

// Document - Imports
import { GetDocumentsUseCase } from "@/features/document/application/useCases/getDocumentsUseCase";
import { UploadDocumentFromBase64UseCase } from "@/features/document/application/useCases/uploadDocumentFromBase64UseCase";
import { DocumentRepository } from "@/features/document/infrastructure/repositories/documentRepository";
import { DocumentService } from "@/features/document/infrastructure/services/documentService";

// Auth - Imports
import { ForgotPasswordUseCase } from "@/features/auth/application/useCases/forgotPasswordUseCase";
import { ForgotUsernameUseCase } from "@/features/auth/application/useCases/forgotUsernameUseCase";
import { GetSecurityQuestionsByTokenUseCase } from "@/features/auth/application/useCases/getSecurityQuestionsByTokenUseCase";
import { InitializeAccountUseCase } from "@/features/auth/application/useCases/initializeAccountUseCase";
import { LoginUseCase } from "@/features/auth/application/useCases/loginUseCase";
import { ResendOtpUseCase } from "@/features/auth/application/useCases/resendOtpUseCase";
import { ResetPasswordWithSecurityUseCase } from "@/features/auth/application/useCases/resetPasswordWithSecurityUseCase";
import { VerifyOtpUseCase } from "@/features/auth/application/useCases/verifyOtpUseCase";
import { VerifySecurityAnswersUseCase } from "@/features/auth/application/useCases/verifySecurityAnswersUseCase";
import { AuthRepository } from "@/features/auth/infrastructure/repositories/authRepository";

// Production Basins - Imports
import { GetProductionBasinByIdUseCase } from "@/features/production-basin/application/useCases";
import { AddProductionBasinUseCase } from "@/features/production-basin/application/useCases/addProductionBasinUseCase";
import { GetProductionBasinsUseCase } from "@/features/production-basin/application/useCases/getProductionBasinsUseCase";
import { UpdateProductionBasinUseCase } from "@/features/production-basin/application/useCases/updateProductionBasinUseCase";
import { ProductionBasinRepository } from "@/features/production-basin/infrastructure/repositories/productionBasinRepository";

// Location - Imports
import { GetLocationsUseCase } from "@/features/location/application/useCases/getLocationsUseCase";
import { SyncLocationsUseCase } from "@/features/location/application/useCases/syncLocationsUseCase";
import { LocationRepository } from "@/features/location/infrastructure/repositories/locationRepository";

// Campaign - Imports
import { ActivateCampaignUseCase } from "@/features/campaign/application/useCases/activateCampaignUseCase";
import { CreateCampaignUseCase } from "@/features/campaign/application/useCases/createCampaignUseCase";
import { DeactivateCampaignUseCase } from "@/features/campaign/application/useCases/deactivateCampaignUseCase";
import { GetCampaignByIdUseCase } from "@/features/campaign/application/useCases/getCampaignByIdUseCase";
import { GetCampaignsUseCase } from "@/features/campaign/application/useCases/getCampaignsUseCase";
import { UpdateCampaignUseCase } from "@/features/campaign/application/useCases/updateCampaignUseCase";
import { CampaignRepository } from "@/features/campaign/infrastructure/repositories/campaignRepository";

// User - Imports
import { CreateUserUseCase } from "@/features/user/application/useCases/createUserUseCase";
import { GetUserByIdUseCase } from "@/features/user/application/useCases/getUserByIdUseCase";
import { GetUsersUseCase } from "@/features/user/application/useCases/getUsersUseCase";
import { ResetUserPasswordUseCase } from "@/features/user/application/useCases/resetUserPasswordUseCase";
import { UpdateSelfUseCase } from "@/features/user/application/useCases/updateSelfUseCase";
import { UpdateUserStatusUseCase } from "@/features/user/application/useCases/updateUserStatusUseCase";
import { UpdateUserUseCase } from "@/features/user/application/useCases/updateUserUseCase";
import { UserRepository } from "@/features/user/infrastructure/repositories/userRepository";

// Store - Imports
import { ActivateStoreUseCase } from "@/features/store/application/useCases/activateStoreUseCase";
import { AddOccupantUseCase } from "@/features/store/application/useCases/addOccupantUseCase";
import { CreateStoreUseCase } from "@/features/store/application/useCases/createStoreUseCase";
import { DeactivateStoreUseCase } from "@/features/store/application/useCases/deactivateStoreUseCase";
import { GetOccupantsUseCase } from "@/features/store/application/useCases/getOccupantsUseCase";
import { GetStoreByIdUseCase } from "@/features/store/application/useCases/getStoreByIdUseCase";
import { GetStoresUseCase } from "@/features/store/application/useCases/getStoresUseCase";
import { RemoveOccupantUseCase } from "@/features/store/application/useCases/removeOccupantUseCase";
import { UpdateStoreUseCase } from "@/features/store/application/useCases/updateStoreUseCase";
import { StoreRepository } from "@/features/store/infrastructure/repositories/storeRepository";

// Actor - Imports
import { CreateActorUseCase } from "@/features/actor/application/useCases/createActorUseCase";
import { GetActorByIdUseCase } from "@/features/actor/application/useCases/getActorByIdUseCase";
import { GetActorsUseCase } from "@/features/actor/application/useCases/getActorsUseCase";
import { GetOpaProducersUseCase } from "@/features/actor/application/useCases/GetOpaProducersUseCase";
import { GetProducerOpasUseCase } from "@/features/actor/application/useCases/GetProducerOpasUseCase";
import { AddProducersToOpaBulkUseCase } from "@/features/actor/application/useCases/AddProducersToOpaBulkUseCase";
import { RemoveProducerFromOpaUseCase } from "@/features/actor/application/useCases/RemoveProducerFromOpaUseCase";
import { ActorRepository } from "@/features/actor/infrastructure/repositories/ActorRepository";

// Parcel - Imports
import { CreateParcelsBulkUseCase } from "@/features/parcel/application/useCases/createParcelsBulkUseCase";
import { GetParcelByIdUseCase } from "@/features/parcel/application/useCases/getParcelByIdUseCase";
import { GetProducerParcelsUseCase } from "@/features/parcel/application/useCases/getProducerParcelsUseCase";
import { UpdateParcelStatusUseCase } from "@/features/parcel/application/useCases/updateParcelStatusUseCase";
import { UpdateParcelUseCase } from "@/features/parcel/application/useCases/updateParcelUseCase";
import { ParcelRepository } from "@/features/parcel/infrastructure/repositories/parcelRepository";
import { ParcelService } from "@/features/parcel/infrastructure/services/parcelService";

// Convention - Imports
import {
  CreateConventionUseCase,
  GetConventionByIdUseCase,
  GetConventionsUseCase,
  UpdateConventionUseCase,
} from "@/features/convention/application/useCases";
import { ConventionRepository } from "@/features/convention/infrastructure/repositories/ConventionRepository";

// Product Transfer - Imports
import {
  CreateProductTransferUseCase,
  DeleteProductTransferUseCase,
  GetProductTransferByIdUseCase,
  GetProductTransfersUseCase,
  UpdateProductTransferUseCase,
} from "@/features/product-transfer/application/useCases";
import { ProductTransferRepository } from "@/features/product-transfer/infrastructure/repositories/ProductTransferRepository";

// Calendar - Imports
import { GetCalendarsUseCase } from "@/features/calendar/application/useCases/getCalendarsUseCase";
import { GetCalendarByIdUseCase } from "@/features/calendar/application/useCases/getCalendarByIdUseCase";
import { CreateCalendarUseCase } from "@/features/calendar/application/useCases/createCalendarUseCase";
import { UpdateCalendarUseCase } from "@/features/calendar/application/useCases/updateCalendarUseCase";
import { UpdateCalendarStatusUseCase } from "@/features/calendar/application/useCases/updateCalendarStatusUseCase";
import { UpdateExpectedSalesCountUseCase } from "@/features/calendar/application/useCases/updateExpectedSalesCountUseCase";
import { CalendarRepository } from "@/features/calendar/infrastructure/repositories/CalendarRepository";

// Transaction - Imports
import { GetTransactionsUseCase } from "@/features/transaction/application/useCases/getTransactionsUseCase";
import { UpdateTransactionProductsUseCase } from "@/features/transaction/application/useCases/UpdateTransactionProductsUseCase";
import { TransactionRepository } from "@/features/transaction/infrastructure/repositories/TransactionRepository";

// Outbox - Imports
import { OutboxSyncHandler } from "@/features/outbox/infrastructure/services/outboxSyncHandler";

// Flag pour s'assurer que la configuration n'est appelée qu'une seule fois
let isConfigured = false;

/**
 * Configuration du conteneur DI
 * Enregistre toutes les dépendances de l'application
 */
export function configureDI(): void {
  // Éviter la double configuration
  if (isConfigured) {
    return;
  }

  try {
    // Services centraux
    container.registerSingleton<SyncService>(
      DI_TOKENS.SyncService,
      SyncService
    );

    container.registerSingleton<PollingService>(
      DI_TOKENS.PollingService,
      PollingService
    );

    // Repositories - Enregistrement avec Symbol
    container.registerSingleton<IAuditLogRepository>(
      DI_TOKENS.IAuditLogRepository,
      AuditLogRepository
    );

    container.registerSingleton<IDocumentRepository>(
      DI_TOKENS.IDocumentRepository,
      DocumentRepository
    );

    container.registerSingleton<IAuthRepository>(
      DI_TOKENS.IAuthRepository,
      AuthRepository
    );

    container.registerSingleton<IProductionBasinRepository>(
      DI_TOKENS.IProductionBasinRepository,
      ProductionBasinRepository
    );

    container.registerSingleton<ILocationRepository>(
      DI_TOKENS.ILocationRepository,
      LocationRepository
    );

    container.registerSingleton<ICampaignRepository>(
      DI_TOKENS.ICampaignRepository,
      CampaignRepository
    );

    container.registerSingleton<IUserRepository>(
      DI_TOKENS.IUserRepository,
      UserRepository
    );

    container.registerSingleton<IStoreRepository>(
      DI_TOKENS.IStoreRepository,
      StoreRepository
    );

    container.registerSingleton<IActorRepository>(
      DI_TOKENS.IActorRepository,
      ActorRepository
    );

    container.registerSingleton<IParcelRepository>(
      DI_TOKENS.IParcelRepository,
      ParcelRepository
    );

    container.registerSingleton<IConventionRepository>(
      DI_TOKENS.IConventionRepository,
      ConventionRepository
    );

    container.registerSingleton<IProductTransferRepository>(
      DI_TOKENS.IProductTransferRepository,
      ProductTransferRepository
    );

    container.registerSingleton<ICalendarRepository>(
      DI_TOKENS.ICalendarRepository,
      CalendarRepository
    );

    container.registerSingleton<ITransactionRepository>(
      DI_TOKENS.ITransactionRepository,
      TransactionRepository
    );

    // AuditLog Use Cases
    container.registerSingleton(GetAuditLogsUseCase);
    container.registerSingleton(AuditLogService);

    // Document Use Cases
    container.registerSingleton(GetDocumentsUseCase);
    container.registerSingleton(UploadDocumentFromBase64UseCase);
    container.registerSingleton(DocumentService);

    // Auth Use Cases
    container.registerSingleton(LoginUseCase);
    container.registerSingleton(VerifyOtpUseCase);
    container.registerSingleton(ResendOtpUseCase);
    container.registerSingleton(InitializeAccountUseCase);
    container.registerSingleton(GetSecurityQuestionsByTokenUseCase);
    container.registerSingleton(ForgotPasswordUseCase);
    container.registerSingleton(ForgotUsernameUseCase);
    container.registerSingleton(ResetPasswordWithSecurityUseCase);
    container.registerSingleton(VerifySecurityAnswersUseCase);

    // Production Basins Use Cases
    container.registerSingleton(GetProductionBasinsUseCase);
    container.registerSingleton(GetProductionBasinByIdUseCase);
    container.registerSingleton(AddProductionBasinUseCase);
    container.registerSingleton(UpdateProductionBasinUseCase);

    // Location Use Cases
    container.registerSingleton(GetLocationsUseCase);
    container.registerSingleton(SyncLocationsUseCase);

    // Campaign Use Cases
    container.registerSingleton(GetCampaignsUseCase);
    container.registerSingleton(GetCampaignByIdUseCase);
    container.registerSingleton(CreateCampaignUseCase);
    container.registerSingleton(UpdateCampaignUseCase);
    container.registerSingleton(ActivateCampaignUseCase);
    container.registerSingleton(DeactivateCampaignUseCase);

    // User Use Cases
    container.registerSingleton(GetUsersUseCase);
    container.registerSingleton(GetUserByIdUseCase);
    container.registerSingleton(CreateUserUseCase);
    container.registerSingleton(UpdateUserUseCase);
    container.registerSingleton(UpdateSelfUseCase);
    container.registerSingleton(UpdateUserStatusUseCase);
    container.registerSingleton(ResetUserPasswordUseCase);

    // Store Use Cases
    container.registerSingleton(ActivateStoreUseCase);
    container.registerSingleton(AddOccupantUseCase);
    container.registerSingleton(CreateStoreUseCase);
    container.registerSingleton(DeactivateStoreUseCase);
    container.registerSingleton(GetOccupantsUseCase);
    container.registerSingleton(GetStoreByIdUseCase);
    container.registerSingleton(GetStoresUseCase);
    container.registerSingleton(RemoveOccupantUseCase);
    container.registerSingleton(UpdateStoreUseCase);

    // Actor Use Cases
    container.registerSingleton(GetActorsUseCase);
    container.registerSingleton(GetActorByIdUseCase);
    container.registerSingleton(CreateActorUseCase);
    container.registerSingleton(GetProducerOpasUseCase);
    container.registerSingleton(GetOpaProducersUseCase);
    container.registerSingleton(AddProducersToOpaBulkUseCase);
    container.registerSingleton(RemoveProducerFromOpaUseCase);

    // Parcel Use Cases
    container.registerSingleton(GetProducerParcelsUseCase);
    container.registerSingleton(GetParcelByIdUseCase);
    container.registerSingleton(CreateParcelsBulkUseCase);
    container.registerSingleton(UpdateParcelUseCase);
    container.registerSingleton(UpdateParcelStatusUseCase);
    container.registerSingleton(ParcelService);

    // Convention Use Cases
    container.registerSingleton(GetConventionsUseCase);
    container.registerSingleton(GetConventionByIdUseCase);
    container.registerSingleton(CreateConventionUseCase);
    container.registerSingleton(UpdateConventionUseCase);

    // Product Transfer Use Cases
    container.registerSingleton(GetProductTransfersUseCase);
    container.registerSingleton(GetProductTransferByIdUseCase);
    container.registerSingleton(CreateProductTransferUseCase);
    container.registerSingleton(UpdateProductTransferUseCase);
    container.registerSingleton(DeleteProductTransferUseCase);

    // Calendar Use Cases
    container.registerSingleton(GetCalendarsUseCase);
    container.registerSingleton(GetCalendarByIdUseCase);
    container.registerSingleton(CreateCalendarUseCase);
    container.registerSingleton(UpdateCalendarUseCase);
    container.registerSingleton(UpdateCalendarStatusUseCase);
    container.registerSingleton(UpdateExpectedSalesCountUseCase);

    // Transaction Use Cases
    container.registerSingleton(GetTransactionsUseCase);
    container.registerSingleton(UpdateTransactionProductsUseCase);

    // Récupération des repositories
    const productionBasinRepo = container.resolve<IProductionBasinRepository>(
      DI_TOKENS.IProductionBasinRepository
    );
    const locationRepo = container.resolve<ILocationRepository>(
      DI_TOKENS.ILocationRepository
    );
    const campaignRepo = container.resolve<ICampaignRepository>(
      DI_TOKENS.ICampaignRepository
    );
    const userRepo = container.resolve<IUserRepository>(
      DI_TOKENS.IUserRepository
    );
    const storeRepo = container.resolve<IStoreRepository>(
      DI_TOKENS.IStoreRepository
    );
    const actorRepo = container.resolve<IActorRepository>(
      DI_TOKENS.IActorRepository
    );
    const parcelRepo = container.resolve<IParcelRepository>(
      DI_TOKENS.IParcelRepository
    );
    const conventionRepo = container.resolve<IConventionRepository>(
      DI_TOKENS.IConventionRepository
    );

    const productTransferRepo = container.resolve<IProductTransferRepository>(
      DI_TOKENS.IProductTransferRepository
    );
    const calendarRepo = container.resolve<ICalendarRepository>(
      DI_TOKENS.ICalendarRepository
    );
    const transactionRepo = container.resolve<ITransactionRepository>(
      DI_TOKENS.ITransactionRepository
    );

    // Configuration des handlers de synchronisation
    const syncService = container.resolve<SyncService>(DI_TOKENS.SyncService);

    // Enregistrer les repositories comme handlers de synchronisation
    syncService.registerHandler(productionBasinRepo);
    syncService.registerHandler(locationRepo);
    syncService.registerHandler(campaignRepo);
    syncService.registerHandler(userRepo);
    syncService.registerHandler(storeRepo);
    syncService.registerHandler(actorRepo); // ⭐ Avec syncOnLogin() et vérification de rôle
    syncService.registerHandler(parcelRepo);
    syncService.registerHandler(conventionRepo);
    syncService.registerHandler(productTransferRepo);
    syncService.registerHandler(calendarRepo);
    syncService.registerHandler(transactionRepo as unknown as ISyncHandler);

    // Enregistrer le handler outbox pour rafraîchissement automatique
    const outboxHandler = new OutboxSyncHandler();
    syncService.registerHandler(outboxHandler);

    // Démarrer le service de synchronisation
    syncService.start();

    isConfigured = true;
  } catch (error) {
    console.error("❌ Erreur lors de la configuration du conteneur DI:", error);
    throw error;
  }
}

/**
 * S'assure que le conteneur DI est configuré avant utilisation
 */
export function ensureDIConfigured(): void {
  if (!isConfigured) {
    configureDI();
  }
}

/**
 * Export du conteneur pour les cas avancés
 */
export { container };
