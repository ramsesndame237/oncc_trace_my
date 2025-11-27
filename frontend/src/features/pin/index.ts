/**
 * Exports publics de la feature PIN
 * Gestion des codes PIN pour la sécurité de l'application
 */

// Configuration
export {
  DEFAULT_PIN_CONFIG,
  PIN_CONFIG,
  PinConfigUtils,
  type PinConfig,
} from "./infrastructure/config";

// Services
export {
  PinSessionService,
  PinStorageService,
  PinValidationService,
  containsDatePattern,
  containsKnownSequence,
  hasRepeatingDigits,
  isSequentialAscending,
  isSequentialDescending,
  validatePin,
  validatePinWithDetails,
  type PinValidationResult,
} from "./infrastructure/services";

// Composants
export { CreatePinForm } from "./presentation/components/CreatePinForm";
export { default as PinForm } from "./presentation/components/PinForm";
export { PinGuard } from "./presentation/components/PinGuard";
export { PinVerificationForm } from "./presentation/components/PinVerificationForm";

// Hooks
export {
  usePinAuth,
  type UsePinAuthReturn,
} from "./presentation/hooks/usePinAuth";

// Schémas
export {
  createPinSchema,
  type CreatePinFormData,
} from "./presentation/schemas";
