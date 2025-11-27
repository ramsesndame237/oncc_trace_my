/**
 * Service Provider pour l'injection de dépendances
 * Fournit un accès typé aux services et use cases
 */

import { ActorServiceProvider } from "@/features/actor/infrastructure/di/actorServiceProvider";
import { AuditLogServiceProvider } from "@/features/auditLog/infrastructure/di/auditLogServiceProvider";
import { AuthServiceProvider } from "@/features/auth/infrastructure/di/AuthServiceProvider";
import { CalendarServiceProvider } from "@/features/calendar/infrastructure/di/calendarServiceProvider";
import { CampaignServiceProvider } from "@/features/campaign/infrastructure/di/campaignServiceProvider";
import { ConventionServiceProvider } from "@/features/convention/infrastructure/di/conventionServiceProvider";
import { DocumentServiceProvider } from "@/features/document/infrastructure/di/documentServiceProvider";
import { LocationServiceProvider } from "@/features/location/infrastructure/di/locationServiceProvider";
import { ParcelServiceProvider } from "@/features/parcel/infrastructure/di/parcelServiceProvider";
import { ProductionBasinServiceProvider } from "@/features/production-basin/infrastructure/di/productionBasinServiceProvider";
import { ProductTransferServiceProvider } from "@/features/product-transfer/infrastructure/di/productTransferServiceProvider";
import { StoreServiceProvider } from "@/features/store/infrastructure/di/storeServiceProvider";
import { UserServiceProvider } from "@/features/user/infrastructure/di/userServiceProvider";
import { SyncServiceProvider } from "./syncServiceProvider";

/**
 * Service Provider principal
 * Point d'entrée unique pour tous les services
 */
export class ServiceProvider {
  static get Actor() {
    return ActorServiceProvider;
  }

  static get AuditLog() {
    return AuditLogServiceProvider;
  }

  static get Auth() {
    return AuthServiceProvider;
  }

  static get Calendar() {
    return CalendarServiceProvider;
  }

  static get Campaign() {
    return CampaignServiceProvider;
  }

  static get Convention() {
    return ConventionServiceProvider;
  }

  static get Document() {
    return DocumentServiceProvider;
  }

  static get Location() {
    return LocationServiceProvider;
  }

  static get Parcel() {
    return ParcelServiceProvider;
  }

  static get ProductionBasin() {
    return ProductionBasinServiceProvider;
  }

  static get ProductTransfer() {
    return ProductTransferServiceProvider;
  }

  static get Store() {
    return StoreServiceProvider;
  }

  static get Sync() {
    return SyncServiceProvider;
  }

  static get User() {
    return UserServiceProvider;
  }
}
