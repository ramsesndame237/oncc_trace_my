// Types de requête
export type {
  GetActorsRequest,
  GetActorsByTypeRequest,
  GetActorRequest,
  CreateActorRequest,
  UpdateActorRequest,
  UpdateActorStatusRequest,
} from './request';

// Types de réponse
export type {
  ActorResponse,
  PaginatedActorsResponse,
  GetActorsResponse,
  GetActorsByTypeResponse,
  GetActorResponse,
} from './response';

// Codes d'erreur et de succès
export {
  ActorErrorCodes,
  ActorSuccessCodes,
} from './codes';
export type {
  ActorErrorCode,
  ActorSuccessCode,
} from './codes';