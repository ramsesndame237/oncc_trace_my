import { Exception } from '@adonisjs/core/exceptions'
import { ParcelErrorCodes, ParcelErrorMessages } from '#types/errors/parcel'

/**
 * Exception personnalisée pour les erreurs liées aux parcelles
 */
export default class ParcelException extends Exception {
  static create(code: ParcelErrorCodes, status: number = 400): ParcelException {
    const message = ParcelErrorMessages[code]
    const exception = new ParcelException(message, { status, code })
    exception.code = code
    return exception
  }

  /**
   * Erreur: Parcelle non trouvée
   */
  static notFound(): ParcelException {
    return this.create(ParcelErrorCodes.PARCEL_NOT_FOUND, 404)
  }

  /**
   * Erreur: ID ONCC déjà existant
   */
  static onccIdExists(): ParcelException {
    return this.create(ParcelErrorCodes.PARCEL_ONCC_ID_EXISTS, 409)
  }

  /**
   * Erreur: ID d'identification déjà existant
   */
  static identificationIdExists(): ParcelException {
    return this.create(ParcelErrorCodes.PARCEL_IDENTIFICATION_ID_EXISTS, 409)
  }

  /**
   * Erreur: Producteur non trouvé
   */
  static producerNotFound(): ParcelException {
    return this.create(ParcelErrorCodes.PARCEL_PRODUCER_NOT_FOUND, 404)
  }

  /**
   * Erreur: Producteur invalide
   */
  static producerInvalid(): ParcelException {
    return this.create(ParcelErrorCodes.PARCEL_PRODUCER_INVALID, 400)
  }

  /**
   * Erreur: Création de parcelle échouée
   */
  static creationFailed(): ParcelException {
    return this.create(ParcelErrorCodes.PARCEL_CREATION_FAILED, 500)
  }

  /**
   * Erreur: Mise à jour de parcelle échouée
   */
  static updateFailed(): ParcelException {
    return this.create(ParcelErrorCodes.PARCEL_UPDATE_FAILED, 500)
  }

  /**
   * Erreur: Suppression de parcelle échouée
   */
  static deletionFailed(): ParcelException {
    return this.create(ParcelErrorCodes.PARCEL_DELETION_FAILED, 500)
  }

  /**
   * Erreur: Coordonnées invalides
   */
  static coordinatesInvalid(): ParcelException {
    return this.create(ParcelErrorCodes.PARCEL_COORDINATES_INVALID, 400)
  }

  /**
   * Erreur: Gestion des coordonnées échouée
   */
  static coordinatesFailed(): ParcelException {
    return this.create(ParcelErrorCodes.PARCEL_COORDINATES_FAILED, 500)
  }
}
