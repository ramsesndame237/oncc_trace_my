import Actor from '#models/actor'
import ActorProductQuantity from '#models/actor_product_quantity'
import AuditLog from '#models/audit_log'
import Campaign from '#models/campaign'
import ProductTransfer from '#models/product_transfer'
import Store from '#models/store'
import StoreProductQuantity from '#models/store_product_quantity'
import { ProductTransferErrorCodes } from '#types/errors/product_transfer'
import type {
  CreateProductTransferData,
  UpdateProductTransferData,
  UpdateTransferStatusData,
} from '#types/product_transfer_types'
import { Exception } from '@adonisjs/core/exceptions'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { DateTime } from 'luxon'

export default class ProductTransferService {
  /**
   * Génère un code unique pour un nouveau transfert
   * Format: GRP-YYYY-XXXXX (pour GROUPAGE) ou TRP-YYYY-XXXXX (pour STANDARD)
   * @param transferType Type de transfert (GROUPAGE ou STANDARD)
   * @returns Le code généré
   */
  private async generateUniqueCode(transferType: string): Promise<string> {
    const currentYear = new Date().getFullYear()
    const prefix = transferType === 'GROUPAGE' ? 'GRP' : 'TRP'

    // Trouver le dernier code généré cette année pour ce type
    const lastTransfer = await ProductTransfer.query()
      .where('code', 'like', `${prefix}-${currentYear}-%`)
      .orderBy('code', 'desc')
      .first()

    let nextNumber = 1

    if (lastTransfer?.code) {
      // Extraire le numéro séquentiel du dernier code
      const lastNumber = Number.parseInt(lastTransfer.code.split('-').pop() || '0')
      nextNumber = lastNumber + 1
    }

    // Générer le nouveau code avec padding à 5 chiffres
    const paddedNumber = nextNumber.toString().padStart(5, '0')
    const newCode = `${prefix}-${currentYear}-${paddedNumber}`

    // Vérifier l'unicité (sécurité supplémentaire)
    const existingTransfer = await ProductTransfer.findBy('code', newCode)
    if (existingTransfer) {
      // Si par hasard le code existe déjà, essayer le suivant (récursif)
      return this.generateUniqueCode(transferType)
    }

    return newCode
  }

  /**
   * Calculer la différence entre deux listes de produits
   * @param oldProducts - Anciens produits
   * @param newProducts - Nouveaux produits
   * @returns Les produits à ajouter et à soustraire
   */
  private calculateProductDifferences(
    oldProducts: Array<{ quality: string; weight: number; numberOfBags: number }> | null,
    newProducts: Array<{ quality: string; weight: number; numberOfBags: number }> | null
  ): {
    toAdd: Array<{ quality: string; weight: number; numberOfBags: number }>
    toSubtract: Array<{ quality: string; weight: number; numberOfBags: number }>
  } {
    const toAdd: Array<{ quality: string; weight: number; numberOfBags: number }> = []
    const toSubtract: Array<{ quality: string; weight: number; numberOfBags: number }> = []

    // Créer des maps pour faciliter la comparaison
    const oldProductsMap = new Map<
      string,
      { quality: string; weight: number; numberOfBags: number }
    >()
    const newProductsMap = new Map<
      string,
      { quality: string; weight: number; numberOfBags: number }
    >()

    // Remplir les maps
    if (oldProducts) {
      for (const product of oldProducts) {
        oldProductsMap.set(product.quality, product)
      }
    }

    if (newProducts) {
      for (const product of newProducts) {
        newProductsMap.set(product.quality, product)
      }
    }

    // Identifier les produits modifiés ou ajoutés
    for (const [quality, newProduct] of newProductsMap) {
      const oldProduct = oldProductsMap.get(quality)

      if (!oldProduct) {
        // Nouveau produit : ajouter
        toAdd.push(newProduct)
      } else {
        // Produit existant : calculer la différence
        const weightDiff = newProduct.weight - oldProduct.weight
        const bagsDiff = newProduct.numberOfBags - oldProduct.numberOfBags

        if (weightDiff > 0 || bagsDiff > 0) {
          // Augmentation : ajouter la différence
          toAdd.push({
            quality,
            weight: Math.abs(weightDiff),
            numberOfBags: Math.abs(bagsDiff),
          })
        } else if (weightDiff < 0 || bagsDiff < 0) {
          // Diminution : soustraire la différence
          toSubtract.push({
            quality,
            weight: Math.abs(weightDiff),
            numberOfBags: Math.abs(bagsDiff),
          })
        }
        // Si égaux, pas de changement
      }
    }

    // Identifier les produits supprimés
    for (const [quality, oldProduct] of oldProductsMap) {
      if (!newProductsMap.has(quality)) {
        // Produit supprimé : soustraire
        toSubtract.push(oldProduct)
      }
    }

    return { toAdd, toSubtract }
  }

  /**
   * Appliquer les différences de produits aux quantités des acteurs
   * @param transfer - Le transfert de produit
   * @param productsToAdd - Produits à ajouter
   * @param productsToSubtract - Produits à soustraire
   */
  private async applyProductDifferences(
    transfer: ProductTransfer,
    productsToAdd: Array<{ quality: string; weight: number; numberOfBags: number }>,
    productsToSubtract: Array<{ quality: string; weight: number; numberOfBags: number }>
  ): Promise<void> {
    const actorId = transfer.senderActorId
    const opaId = transfer.receiverActorId
    const campaignId = transfer.campaignId

    // Ajouter les quantités pour les produits en augmentation/ajout
    for (const product of productsToAdd) {
      const { quality, weight, numberOfBags } = product

      const existingQuantity = await ActorProductQuantity.query()
        .where('actor_id', actorId)
        .where('campaign_id', campaignId)
        .where('opa_id', opaId)
        .where('quality', quality)
        .whereNull('parcel_id')
        .first()

      if (existingQuantity) {
        existingQuantity.totalWeight += weight
        existingQuantity.totalBags += numberOfBags
        await existingQuantity.save()
      } else {
        await ActorProductQuantity.create({
          actorId,
          campaignId,
          opaId,
          quality,
          parcelId: null,
          totalWeight: weight,
          totalBags: numberOfBags,
        })
      }
    }

    // Soustraire les quantités pour les produits en diminution/suppression
    for (const product of productsToSubtract) {
      const { quality, weight, numberOfBags } = product

      const existingQuantity = await ActorProductQuantity.query()
        .where('actor_id', actorId)
        .where('campaign_id', campaignId)
        .where('opa_id', opaId)
        .where('quality', quality)
        .whereNull('parcel_id')
        .first()

      if (existingQuantity) {
        existingQuantity.totalWeight -= weight
        existingQuantity.totalBags -= numberOfBags

        // Vérifier que les quantités ne deviennent pas négatives
        if (existingQuantity.totalWeight < 0) existingQuantity.totalWeight = 0
        if (existingQuantity.totalBags < 0) existingQuantity.totalBags = 0

        await existingQuantity.save()
      }
    }
  }

  /**
   * Appliquer les différences de produits aux quantités des magasins (STANDARD)
   * @param transfer - Le transfert de produit
   * @param productsToAdd - Produits à ajouter
   * @param productsToSubtract - Produits à soustraire
   */
  private async applyStoreProductDifferences(
    transfer: ProductTransfer,
    productsToAdd: Array<{ quality: string; weight: number; numberOfBags: number }>,
    productsToSubtract: Array<{ quality: string; weight: number; numberOfBags: number }>
  ): Promise<void> {
    const senderStoreId = transfer.senderStoreId
    const receiverStoreId = transfer.receiverStoreId
    const senderActorId = transfer.senderActorId
    const receiverActorId = transfer.receiverActorId
    const campaignId = transfer.campaignId

    // Ajouter les quantités pour les produits en augmentation/ajout
    for (const product of productsToAdd) {
      const { quality, weight, numberOfBags } = product

      // Soustraire du magasin d'envoi
      const senderQuantity = await StoreProductQuantity.query()
        .where('store_id', senderStoreId || '')
        .where('actor_id', senderActorId || '')
        .where('campaign_id', campaignId)
        .where('quality', quality)
        .first()

      if (senderQuantity) {
        senderQuantity.totalWeight -= weight
        senderQuantity.totalBags -= numberOfBags
        if (senderQuantity.totalWeight < 0) senderQuantity.totalWeight = 0
        if (senderQuantity.totalBags < 0) senderQuantity.totalBags = 0
        await senderQuantity.save()
      }

      // Ajouter au magasin de réception
      const receiverQuantity = await StoreProductQuantity.query()
        .where('store_id', receiverStoreId || '')
        .where('actor_id', receiverActorId || '')
        .where('campaign_id', campaignId)
        .where('quality', quality)
        .first()

      if (receiverQuantity) {
        receiverQuantity.totalWeight += weight
        receiverQuantity.totalBags += numberOfBags
        await receiverQuantity.save()
      } else {
        await StoreProductQuantity.create({
          storeId: receiverStoreId,
          actorId: receiverActorId,
          campaignId,
          quality,
          totalWeight: weight,
          totalBags: numberOfBags,
        })
      }
    }

    // Soustraire les quantités pour les produits en diminution/suppression
    for (const product of productsToSubtract) {
      const { quality, weight, numberOfBags } = product

      // Ajouter au magasin d'envoi (annulation)
      const senderQuantity = await StoreProductQuantity.query()
        .where('store_id', senderStoreId || '')
        .where('actor_id', senderActorId || '')
        .where('campaign_id', campaignId)
        .where('quality', quality)
        .first()

      if (senderQuantity) {
        senderQuantity.totalWeight += weight
        senderQuantity.totalBags += numberOfBags
        await senderQuantity.save()
      } else {
        await StoreProductQuantity.create({
          storeId: senderStoreId || undefined,
          actorId: senderActorId || undefined,
          campaignId,
          quality,
          totalWeight: weight,
          totalBags: numberOfBags,
        })
      }

      // Soustraire du magasin de réception (annulation)
      const receiverQuantity = await StoreProductQuantity.query()
        .where('store_id', receiverStoreId || '')
        .where('actor_id', receiverActorId || '')
        .where('campaign_id', campaignId)
        .where('quality', quality)
        .first()

      if (receiverQuantity) {
        receiverQuantity.totalWeight -= weight
        receiverQuantity.totalBags -= numberOfBags
        if (receiverQuantity.totalWeight < 0) receiverQuantity.totalWeight = 0
        if (receiverQuantity.totalBags < 0) receiverQuantity.totalBags = 0
        await receiverQuantity.save()
      }
    }
  }

  /**
   * Mettre à jour les quantités de produits dans les magasins (pour transferts STANDARD)
   * @param transfer - Le transfert de produit
   * @param operation - 'add' pour ajouter (validated) ou 'subtract' pour soustraire (cancelled)
   */
  private async updateStoreProductQuantities(
    transfer: ProductTransfer,
    operation: 'add' | 'subtract'
  ): Promise<void> {
    // Ne traiter que les transferts de type STANDARD avec des produits
    if (
      transfer.transferType !== 'STANDARD' ||
      !transfer.products ||
      transfer.products.length === 0
    ) {
      return
    }

    const senderStoreId = transfer.senderStoreId
    const receiverStoreId = transfer.receiverStoreId
    const senderActorId = transfer.senderActorId
    const receiverActorId = transfer.receiverActorId
    const campaignId = transfer.campaignId

    // Parcourir chaque produit du transfert
    for (const product of transfer.products) {
      const { quality, weight, numberOfBags } = product

      // Calculer le delta selon l'opération
      const weightDelta = operation === 'add' ? weight : -weight
      const bagsDelta = operation === 'add' ? numberOfBags : -numberOfBags

      // Mettre à jour le magasin expéditeur (soustraire si add, ajouter si subtract)
      const senderQuantity = await StoreProductQuantity.query()
        .where('store_id', senderStoreId || '')
        .where('campaign_id', campaignId)
        .where('actor_id', senderActorId || '')
        .where('quality', quality)
        .first()

      if (senderQuantity) {
        senderQuantity.totalWeight -= weightDelta
        senderQuantity.totalBags -= bagsDelta

        // Vérifier que les quantités ne deviennent pas négatives
        if (senderQuantity.totalWeight < 0) senderQuantity.totalWeight = 0
        if (senderQuantity.totalBags < 0) senderQuantity.totalBags = 0

        await senderQuantity.save()
      } else if (operation === 'subtract') {
        // Si on soustrait et que la quantité n'existe pas, la créer avec les valeurs soustraites
        await StoreProductQuantity.create({
          storeId: senderStoreId || undefined,
          campaignId,
          actorId: senderActorId || undefined,
          quality,
          totalWeight: Math.abs(weightDelta),
          totalBags: Math.abs(bagsDelta),
        })
      }

      // Mettre à jour le magasin destinataire (ajouter si add, soustraire si subtract)
      const receiverQuantity = await StoreProductQuantity.query()
        .where('store_id', receiverStoreId || '')
        .where('campaign_id', campaignId)
        .where('actor_id', receiverActorId || '')
        .where('quality', quality)
        .first()

      if (receiverQuantity) {
        receiverQuantity.totalWeight += weightDelta
        receiverQuantity.totalBags += bagsDelta

        // Vérifier que les quantités ne deviennent pas négatives
        if (receiverQuantity.totalWeight < 0) receiverQuantity.totalWeight = 0
        if (receiverQuantity.totalBags < 0) receiverQuantity.totalBags = 0

        await receiverQuantity.save()
      } else if (operation === 'add') {
        // Si on ajoute et que la quantité n'existe pas, la créer
        await StoreProductQuantity.create({
          storeId: receiverStoreId,
          campaignId,
          actorId: receiverActorId,
          quality,
          totalWeight: weight,
          totalBags: numberOfBags,
        })
      }
    }
  }

  /**
   * Mettre à jour les quantités de produits des acteurs (pour transferts GROUPAGE)
   * @param transfer - Le transfert de produit
   * @param operation - 'add' pour ajouter (validated) ou 'subtract' pour soustraire (cancelled)
   */
  private async updateActorProductQuantities(
    transfer: ProductTransfer,
    operation: 'add' | 'subtract'
  ): Promise<void> {
    // Ne traiter que les transferts de type GROUPAGE avec des produits
    if (
      transfer.transferType !== 'GROUPAGE' ||
      !transfer.products ||
      transfer.products.length === 0
    ) {
      return
    }

    const actorId = transfer.senderActorId // L'expéditeur
    const opaId = transfer.receiverActorId // Le destinataire (OPA)
    const campaignId = transfer.campaignId

    // Parcourir chaque produit du transfert
    for (const product of transfer.products) {
      const { quality, weight, numberOfBags } = product

      // Calculer le poids et le nombre de sacs selon l'opération
      const weightDelta = operation === 'add' ? weight : -weight
      const bagsDelta = operation === 'add' ? numberOfBags : -numberOfBags

      // Rechercher l'enregistrement existant
      const existingQuantity = await ActorProductQuantity.query()
        .where('actor_id', actorId)
        .where('campaign_id', campaignId)
        .where('opa_id', opaId)
        .where('quality', quality)
        .first()

      if (existingQuantity) {
        // Mettre à jour l'enregistrement existant
        existingQuantity.totalWeight += weightDelta
        existingQuantity.totalBags += bagsDelta

        // Vérifier que les quantités ne deviennent pas négatives
        if (existingQuantity.totalWeight < 0) existingQuantity.totalWeight = 0
        if (existingQuantity.totalBags < 0) existingQuantity.totalBags = 0

        await existingQuantity.save()
      } else if (operation === 'add') {
        // Créer un nouvel enregistrement seulement pour l'addition
        await ActorProductQuantity.create({
          actorId,
          campaignId,
          opaId,
          quality,
          parcelId: null,
          totalWeight: weight,
          totalBags: numberOfBags,
        })
      }
    }
  }
  /**
   * Créer un nouveau transfert de produit avec audit log
   */
  async create(
    data: CreateProductTransferData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<ProductTransfer> {
    // Générer automatiquement le code du transfert selon le type
    const generatedCode = await this.generateUniqueCode(data.transferType)

    // Récupérer la campagne active si non fournie
    let campaignId = data.campaignId
    if (!campaignId) {
      const activeCampaign = await Campaign.getActiveCampaign()
      if (!activeCampaign) {
        throw new Exception('Aucune campagne active trouvée', {
          code: ProductTransferErrorCodes.PRODUCT_TRANSFER_NO_ACTIVE_CAMPAIGN,
          status: 400,
        })
      }
      campaignId = activeCampaign.id
    }

    // Vérifier que les acteurs existent
    const senderActor = await Actor.find(data.senderActorId)
    if (!senderActor) {
      throw new Exception('Acteur expéditeur non trouvé', {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_SENDER_ACTOR_NOT_FOUND,
        status: 400,
      })
    }

    const receiverActor = await Actor.find(data.receiverActorId)
    if (!receiverActor) {
      throw new Exception('Acteur destinataire non trouvé', {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_FOUND,
        status: 400,
      })
    }

    // Vérifier que l'acteur expéditeur est actif
    if (senderActor.status !== 'active') {
      throw new Exception("L'acteur expéditeur n'est pas actif", {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_SENDER_ACTOR_NOT_ACTIVE,
        status: 400,
      })
    }

    // Vérifier que l'acteur destinataire est actif
    if (receiverActor.status !== 'active') {
      throw new Exception("L'acteur destinataire n'est pas actif", {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_ACTIVE,
        status: 400,
      })
    }

    // Vérifier que les magasins existent
    // Pour GROUPAGE : senderStore est optionnel (producteur sans magasin)
    // Pour STANDARD : senderStore est requis
    let senderStore = null
    if (data.senderStoreId) {
      senderStore = await Store.find(data.senderStoreId)
      if (!senderStore) {
        throw new Exception('Magasin expéditeur non trouvé', {
          code: ProductTransferErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_NOT_FOUND,
          status: 400,
        })
      }

      // Vérifier que le magasin expéditeur est associé à la campagne
      await senderStore.load('campaigns')
      const isSenderStoreAssociatedWithCampaign = senderStore.campaigns.some(
        (campaign) => campaign.id === campaignId
      )

      if (!isSenderStoreAssociatedWithCampaign) {
        throw new Exception("Le magasin expéditeur n'est pas associé à la campagne en cours", {
          code: ProductTransferErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_NOT_ACTIVE,
          status: 400,
        })
      }
    } else if (data.transferType === 'STANDARD') {
      // Pour les transferts STANDARD, le senderStoreId est requis
      throw new Exception('Le magasin expéditeur est requis pour les transferts STANDARD', {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_REQUIRED,
        status: 400,
      })
    }

    const receiverStore = await Store.find(data.receiverStoreId)
    if (!receiverStore) {
      throw new Exception('Magasin destinataire non trouvé', {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_RECEIVER_STORE_NOT_FOUND,
        status: 400,
      })
    }

    // Vérifier que le magasin destinataire est associé à la campagne
    await receiverStore.load('campaigns')
    const isReceiverStoreAssociatedWithCampaign = receiverStore.campaigns.some(
      (campaign) => campaign.id === campaignId
    )

    if (!isReceiverStoreAssociatedWithCampaign) {
      throw new Exception("Le magasin destinataire n'est pas associé à la campagne en cours", {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_RECEIVER_STORE_NOT_ACTIVE,
        status: 400,
      })
    }

    // Vérifier que la campagne existe (si fournie explicitement)
    if (data.campaignId) {
      const campaign = await Campaign.find(campaignId)
      if (!campaign) {
        throw new Exception('Campagne non trouvée', {
          code: ProductTransferErrorCodes.PRODUCT_TRANSFER_CAMPAIGN_NOT_FOUND,
          status: 400,
        })
      }
    }

    // Valider que les produits sont fournis pour GROUPAGE et STANDARD
    if (!data.products || data.products.length === 0) {
      throw new Exception('Les produits sont requis', {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_PRODUCTS_REQUIRED,
        status: 400,
      })
    }

    // Créer le transfert
    const transfer = new ProductTransfer()
    transfer.code = generatedCode // Code généré automatiquement
    transfer.transferType = data.transferType
    transfer.senderActorId = data.senderActorId
    transfer.senderStoreId = data.senderStoreId ?? null
    transfer.receiverActorId = data.receiverActorId
    transfer.receiverStoreId = data.receiverStoreId
    transfer.campaignId = campaignId // Utilise la campagne récupérée ou fournie
    transfer.transferDate = DateTime.fromISO(data.transferDate)
    transfer.driverInfo = data.driverInfo ?? null
    transfer.products = data.products
    transfer.status = data.status || 'validated' // Statut validated par défaut

    await transfer.save()

    // Mettre à jour les quantités si le statut est validated
    if (transfer.status === 'validated') {
      await this.updateActorProductQuantities(transfer, 'add')
      await this.updateStoreProductQuantities(transfer, 'add')
    }

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        // Charger les relations pour obtenir les noms lisibles
        await transfer.load('senderActor')
        if (transfer.senderStoreId) {
          await transfer.load('senderStore')
        }
        await transfer.load('receiverActor')
        await transfer.load('receiverStore')
        await transfer.load('campaign')

        // Préparer les newValues avec gestion conditionnelle
        const newValues: Record<string, any> = {
          code: transfer.code,
          transferType: transfer.transferType,
          senderActor:
            `${transfer.senderActor.familyName} ${transfer.senderActor.givenName || ''} (${transfer.senderActor.onccId || transfer.senderActor.identifiantId})`.trim(),
          receiverActor:
            `${transfer.receiverActor.familyName} ${transfer.receiverActor.givenName || ''} (${transfer.receiverActor.onccId || transfer.receiverActor.identifiantId})`.trim(),
          receiverStore: `${transfer.receiverStore.name} (${transfer.receiverStore.code})`,
          campaign: `${transfer.campaign.code} (${transfer.campaign.startDate.toISODate()} - ${transfer.campaign.endDate.toISODate()})`,
          transferDate: transfer.transferDate.toISODate(),
          status: transfer.status,
          products: transfer.products.map((p) => ({
            quality: p.quality,
            weight: p.weight,
            numberOfBags: p.numberOfBags,
          })),
        }

        // Ajouter senderStore uniquement si présent (STANDARD)
        if (transfer.senderStore) {
          newValues.senderStore = `${transfer.senderStore.name} (${transfer.senderStore.code})`
        }

        // Ajouter driverInfo uniquement si présent
        if (transfer.driverInfo) {
          newValues.driverInfo_fullName = transfer.driverInfo.fullName
          newValues.driverInfo_vehicleRegistration = transfer.driverInfo.vehicleRegistration
          newValues.driverInfo_drivingLicenseNumber = transfer.driverInfo.drivingLicenseNumber
          newValues.driverInfo_routeSheetCode = transfer.driverInfo.routeSheetCode
        }

        await AuditLog.logAction({
          auditableType: 'product_transfer',
          auditableId: transfer.id,
          action: 'create',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: null,
          newValues,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (error) {
        console.error('Erreur lors de la création du log audit:', error)
      }
    }

    return transfer
  }

  /**
   * Mettre à jour un transfert de produit avec audit log
   */
  async update(
    transferId: string,
    data: UpdateProductTransferData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<ProductTransfer> {
    const transfer = await ProductTransfer.query()
      .where('id', transferId)
      .whereNull('deleted_at')
      .first()

    if (!transfer) {
      throw new Exception('Transfert de produit non trouvé', {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_NOT_FOUND,
        status: 404,
      })
    }

    // Ne pas permettre la modification d'un transfert annulé
    if (transfer.status === 'cancelled') {
      throw new Exception('Les transferts annulés ne peuvent pas être modifiés', {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_NOT_EDITABLE,
        status: 400,
      })
    }

    // Pour les transferts validés, on ne peut modifier que les produits (GROUPAGE uniquement)
    if (transfer.status === 'validated') {
      const hasOtherChanges =
        data.senderActorId ||
        data.senderStoreId ||
        data.receiverActorId ||
        data.receiverStoreId ||
        data.driverInfo

      if (hasOtherChanges) {
        throw new Exception(
          'Les transferts validés ne permettent que la modification des produits',
          {
            code: ProductTransferErrorCodes.PRODUCT_TRANSFER_VALIDATED_LIMITED_EDIT,
            status: 400,
          }
        )
      }
    }

    // Préparer les objets pour l'audit (seulement les champs modifiés)
    const oldValues: Record<string, any> = {}
    const newValues: Record<string, any> = {}

    // Note: Le code ne peut pas être modifié (généré automatiquement)
    // Mettre à jour les champs fournis (code, campaignId et transferType ne peuvent pas être modifiés)
    // transferDate peut être modifié pour les transferts GROUPAGE
    if (data.transferDate && data.transferDate !== transfer.transferDate.toISODate()) {
      oldValues.transferDate = transfer.transferDate.toISODate()
      newValues.transferDate = data.transferDate

      transfer.transferDate = DateTime.fromISO(data.transferDate)
    }

    if (data.senderActorId && data.senderActorId !== transfer.senderActorId) {
      // Charger l'ancien et le nouvel acteur pour obtenir les noms
      const oldSenderActor = await Actor.find(transfer.senderActorId)
      const newSenderActor = await Actor.find(data.senderActorId)

      if (!newSenderActor) {
        throw new Exception('Acteur expéditeur non trouvé', {
          code: ProductTransferErrorCodes.PRODUCT_TRANSFER_SENDER_ACTOR_NOT_FOUND,
          status: 400,
        })
      }

      oldValues.senderActor = oldSenderActor
        ? `${oldSenderActor.familyName} ${oldSenderActor.givenName || ''} (${oldSenderActor.onccId || oldSenderActor.identifiantId})`.trim()
        : transfer.senderActorId
      newValues.senderActor =
        `${newSenderActor.familyName} ${newSenderActor.givenName || ''} (${newSenderActor.onccId || newSenderActor.identifiantId})`.trim()

      transfer.senderActorId = data.senderActorId
    }

    if (data.senderStoreId && data.senderStoreId !== transfer.senderStoreId) {
      // Charger l'ancien et le nouveau magasin pour obtenir les noms
      const oldSenderStore = await Store.find(transfer.senderStoreId)
      const newSenderStore = await Store.find(data.senderStoreId)

      if (!newSenderStore) {
        throw new Exception('Magasin expéditeur non trouvé', {
          code: ProductTransferErrorCodes.PRODUCT_TRANSFER_SENDER_STORE_NOT_FOUND,
          status: 400,
        })
      }

      oldValues.senderStore = oldSenderStore
        ? `${oldSenderStore.name} (${oldSenderStore.code})`
        : transfer.senderStoreId
      newValues.senderStore = `${newSenderStore.name} (${newSenderStore.code})`

      transfer.senderStoreId = data.senderStoreId
    }

    if (data.receiverActorId && data.receiverActorId !== transfer.receiverActorId) {
      // Charger l'ancien et le nouvel acteur pour obtenir les noms
      const oldReceiverActor = await Actor.find(transfer.receiverActorId)
      const newReceiverActor = await Actor.find(data.receiverActorId)

      if (!newReceiverActor) {
        throw new Exception('Acteur destinataire non trouvé', {
          code: ProductTransferErrorCodes.PRODUCT_TRANSFER_RECEIVER_ACTOR_NOT_FOUND,
          status: 400,
        })
      }

      oldValues.receiverActor = oldReceiverActor
        ? `${oldReceiverActor.familyName} ${oldReceiverActor.givenName || ''} (${oldReceiverActor.onccId || oldReceiverActor.identifiantId})`.trim()
        : transfer.receiverActorId
      newValues.receiverActor =
        `${newReceiverActor.familyName} ${newReceiverActor.givenName || ''} (${newReceiverActor.onccId || newReceiverActor.identifiantId})`.trim()

      transfer.receiverActorId = data.receiverActorId
    }

    if (data.receiverStoreId && data.receiverStoreId !== transfer.receiverStoreId) {
      // Charger l'ancien et le nouveau magasin pour obtenir les noms
      const oldReceiverStore = await Store.find(transfer.receiverStoreId)
      const newReceiverStore = await Store.find(data.receiverStoreId)

      if (!newReceiverStore) {
        throw new Exception('Magasin destinataire non trouvé', {
          code: ProductTransferErrorCodes.PRODUCT_TRANSFER_RECEIVER_STORE_NOT_FOUND,
          status: 400,
        })
      }

      oldValues.receiverStore = oldReceiverStore
        ? `${oldReceiverStore.name} (${oldReceiverStore.code})`
        : transfer.receiverStoreId
      newValues.receiverStore = `${newReceiverStore.name} (${newReceiverStore.code})`

      transfer.receiverStoreId = data.receiverStoreId
    }

    // Gérer la mise à jour des informations du chauffeur
    if (data.driverInfo) {
      const oldDriverInfo = transfer.driverInfo

      if (oldDriverInfo) {
        const changedDriverFields: Record<string, any> = {}

        // Comparer chaque champ
        if (data.driverInfo.fullName !== oldDriverInfo.fullName) {
          oldValues.driverInfo_fullName = oldDriverInfo.fullName
          newValues.driverInfo_fullName = data.driverInfo.fullName
          changedDriverFields.fullName = {
            old: oldDriverInfo.fullName,
            new: data.driverInfo.fullName,
          }
        }

        if (data.driverInfo.vehicleRegistration !== oldDriverInfo.vehicleRegistration) {
          oldValues.driverInfo_vehicleRegistration = oldDriverInfo.vehicleRegistration
          newValues.driverInfo_vehicleRegistration = data.driverInfo.vehicleRegistration
          changedDriverFields.vehicleRegistration = {
            old: oldDriverInfo.vehicleRegistration,
            new: data.driverInfo.vehicleRegistration,
          }
        }

        if (data.driverInfo.drivingLicenseNumber !== oldDriverInfo.drivingLicenseNumber) {
          oldValues.driverInfo_drivingLicenseNumber = oldDriverInfo.drivingLicenseNumber
          newValues.driverInfo_drivingLicenseNumber = data.driverInfo.drivingLicenseNumber
          changedDriverFields.drivingLicenseNumber = {
            old: oldDriverInfo.drivingLicenseNumber,
            new: data.driverInfo.drivingLicenseNumber,
          }
        }

        if (data.driverInfo.routeSheetCode !== oldDriverInfo.routeSheetCode) {
          oldValues.driverInfo_routeSheetCode = oldDriverInfo.routeSheetCode
          newValues.driverInfo_routeSheetCode = data.driverInfo.routeSheetCode
          changedDriverFields.routeSheetCode = {
            old: oldDriverInfo.routeSheetCode,
            new: data.driverInfo.routeSheetCode,
          }
        }
      }

      transfer.driverInfo = data.driverInfo
    }

    // Gérer la mise à jour des produits et ajuster les quantités si nécessaire
    if (data.products !== undefined) {
      const oldProducts = transfer.products || []
      const newProducts = data.products || []

      // Détecter les changements dans les produits pour l'audit
      const productChanges: Array<{
        type: 'added' | 'removed' | 'modified'
        quality: string
        oldValues?: { weight: number; numberOfBags: number }
        newValues?: { weight: number; numberOfBags: number }
      }> = []

      // Créer des maps pour comparaison
      const oldProductsMap = new Map()
      const newProductsMap = new Map()

      for (const product of oldProducts) {
        oldProductsMap.set(product.quality, product)
      }

      for (const product of newProducts) {
        newProductsMap.set(product.quality, product)
      }

      // Identifier les produits modifiés ou ajoutés
      for (const [quality, newProduct] of newProductsMap) {
        const oldProduct = oldProductsMap.get(quality)

        if (!oldProduct) {
          // Nouveau produit
          productChanges.push({
            type: 'added',
            quality,
            newValues: {
              weight: newProduct.weight,
              numberOfBags: newProduct.numberOfBags,
            },
          })
        } else if (
          oldProduct.weight !== newProduct.weight ||
          oldProduct.numberOfBags !== newProduct.numberOfBags
        ) {
          // Produit modifié
          productChanges.push({
            type: 'modified',
            quality,
            oldValues: {
              weight: oldProduct.weight,
              numberOfBags: oldProduct.numberOfBags,
            },
            newValues: {
              weight: newProduct.weight,
              numberOfBags: newProduct.numberOfBags,
            },
          })
        }
      }

      // Identifier les produits supprimés
      for (const [quality, oldProduct] of oldProductsMap) {
        if (!newProductsMap.has(quality)) {
          productChanges.push({
            type: 'removed',
            quality,
            oldValues: {
              weight: oldProduct.weight,
              numberOfBags: oldProduct.numberOfBags,
            },
          })
        }
      }

      // Enregistrer les changements dans l'audit
      if (productChanges.length > 0) {
        oldValues.products = productChanges
          .filter((c) => c.type !== 'added')
          .map((c) => ({
            quality: c.quality,
            type: c.type,
            ...(c.oldValues && {
              weight: c.oldValues.weight,
              numberOfBags: c.oldValues.numberOfBags,
            }),
          }))

        newValues.products = productChanges
          .filter((c) => c.type !== 'removed')
          .map((c) => ({
            quality: c.quality,
            type: c.type,
            ...(c.newValues && {
              weight: c.newValues.weight,
              numberOfBags: c.newValues.numberOfBags,
            }),
          }))
      }

      // Calculer les différences pour les transferts validés
      if (transfer.status === 'validated') {
        const { toAdd, toSubtract } = this.calculateProductDifferences(
          transfer.products,
          data.products
        )

        // Appliquer les différences aux quantités
        if (toAdd.length > 0 || toSubtract.length > 0) {
          // Mettre à jour les produits du transfert pour avoir les bonnes références
          transfer.products = data.products

          // Appliquer selon le type de transfert
          if (transfer.transferType === 'GROUPAGE') {
            await this.applyProductDifferences(transfer, toAdd, toSubtract)
          } else if (transfer.transferType === 'STANDARD') {
            await this.applyStoreProductDifferences(transfer, toAdd, toSubtract)
          }
        } else {
          // Pas de changement dans les quantités, juste mettre à jour
          transfer.products = data.products
        }
      } else {
        // Pour les transferts non validés, simple mise à jour
        transfer.products = data.products
      }
    }

    await transfer.save()

    // Créer l'audit log si le contexte est fourni et qu'il y a des changements
    if (auditContext && Object.keys(newValues).length > 0) {
      try {
        await AuditLog.logAction({
          auditableType: 'product_transfer',
          auditableId: transfer.id,
          action: 'update',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues,
          newValues,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (error) {
        console.error('Erreur lors de la création du log audit:', error)
      }
    }

    return transfer
  }

  /**
   * Mettre à jour le statut d'un transfert avec audit log
   */
  async updateStatus(
    transferId: string,
    data: UpdateTransferStatusData,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<ProductTransfer> {
    const transfer = await ProductTransfer.query()
      .where('id', transferId)
      .whereNull('deleted_at')
      .first()

    if (!transfer) {
      throw new Exception('Transfert de produit non trouvé', {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_NOT_FOUND,
        status: 404,
      })
    }

    const oldStatus = transfer.status

    // Valider les transitions de statut
    // Un transfert validated peut seulement passer à cancelled (ou rester validated)
    if (oldStatus === 'validated' && data.status !== 'cancelled' && data.status !== 'validated') {
      throw new Exception('Transition de statut invalide', {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_INVALID_STATUS_TRANSITION,
        status: 400,
      })
    }

    // Un transfert cancelled peut repasser à validated
    // Toutes les autres transitions sont permises

    // Mettre à jour le statut
    transfer.status = data.status
    await transfer.save()

    // Gérer les quantités selon le changement de statut
    // Passage de pending à validated : ajouter les quantités
    if (oldStatus === 'pending' && data.status === 'validated') {
      await this.updateActorProductQuantities(transfer, 'add')
      await this.updateStoreProductQuantities(transfer, 'add')
    }
    // Passage de validated à cancelled : soustraire les quantités
    else if (oldStatus === 'validated' && data.status === 'cancelled') {
      await this.updateActorProductQuantities(transfer, 'subtract')
      await this.updateStoreProductQuantities(transfer, 'subtract')
    }
    // Passage de cancelled à validated : ré-ajouter les quantités
    else if (oldStatus === 'cancelled' && data.status === 'validated') {
      await this.updateActorProductQuantities(transfer, 'add')
      await this.updateStoreProductQuantities(transfer, 'add')
    }
    // Passage de pending à cancelled : pas d'action (quantités jamais ajoutées)
    else if (oldStatus === 'pending' && data.status === 'cancelled') {
      // Pas d'action car le transfert pending n'a pas encore affecté les quantités
    }

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        await AuditLog.logAction({
          auditableType: 'product_transfer',
          auditableId: transfer.id,
          action: 'update_status',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: { status: oldStatus },
          newValues: { status: transfer.status },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (error) {
        console.error('Erreur lors de la création du log audit:', error)
      }
    }

    return transfer
  }

  /**
   * Récupérer un transfert par ID avec ses relations
   */
  async findById(transferId: string): Promise<ProductTransfer | null> {
    const transfer = await ProductTransfer.query()
      .where('id', transferId)
      .whereNull('deleted_at')
      .preload('senderActor')
      .preload('receiverActor')
      .preload('receiverStore')
      .preload('campaign')
      .first()

    // Charger senderStore uniquement si présent (pas pour GROUPAGE)
    if (transfer && transfer.senderStoreId) {
      await transfer.load('senderStore')
    }

    return transfer
  }

  /**
   * Récupérer la liste des transferts avec filtres
   */
  async list(filters: {
    page?: number
    limit?: number
    transferType?: string
    status?: string
    senderActorId?: string
    receiverActorId?: string
    campaignId?: string
    startDate?: string
    endDate?: string
    period?: number
    search?: string
  }): Promise<{
    data: ProductTransfer[]
    meta: {
      total: number
      currentPage: number
      perPage: number
      lastPage: number
    }
  }> {
    const page = filters.page || 1
    const limit = filters.limit || 20

    // Récupérer la campagne active si campaignId n'est pas fourni
    let campaignId = filters.campaignId
    if (!campaignId) {
      const activeCampaign = await Campaign.getActiveCampaign()
      if (activeCampaign) {
        campaignId = activeCampaign.id
      }
    }

    let query: ModelQueryBuilderContract<typeof ProductTransfer> = ProductTransfer.query()
      .whereNull('deleted_at')
      .preload('senderActor')
      .preload('receiverActor')
      .preload('receiverStore')
      .preload('campaign')

    // Filtrer par campagne (active par défaut)
    if (campaignId) {
      query = query.where('campaign_id', campaignId)
    }

    // Appliquer les autres filtres
    if (filters.transferType) {
      query = query.where('transfer_type', filters.transferType)
    }

    if (filters.status) {
      query = query.where('status', filters.status)
    }

    if (filters.senderActorId) {
      query = query.where('sender_actor_id', filters.senderActorId)
    }

    if (filters.receiverActorId) {
      query = query.where('receiver_actor_id', filters.receiverActorId)
    }

    // Filtre par période (nombre de jours)
    if (filters.period) {
      const periodStartDate = DateTime.now().minus({ days: filters.period }).toISODate()
      query = query.where('created_at', '>=', periodStartDate)
    }

    // Filtre par plage de dates (prioritaire sur period)
    if (filters.startDate) {
      query = query.where('transfer_date', '>=', filters.startDate)
    }

    if (filters.endDate) {
      query = query.where('transfer_date', '<=', filters.endDate)
    }

    // Recherche par code de transfert ou identifiants des acteurs
    if (filters.search) {
      query = query.where((builder) => {
        builder
          .whereILike('code', `%${filters.search}%`)
          .orWhereHas('senderActor', (actorQuery) => {
            actorQuery
              .whereILike('family_name', `%${filters.search}%`)
              .orWhereILike('given_name', `%${filters.search}%`)
              .orWhereILike('oncc_id', `%${filters.search}%`)
          })
          .orWhereHas('receiverActor', (actorQuery) => {
            actorQuery
              .whereILike('family_name', `%${filters.search}%`)
              .orWhereILike('given_name', `%${filters.search}%`)
              .orWhereILike('oncc_id', `%${filters.search}%`)
          })
      })
    }

    // Exécuter la pagination
    const result = await query.orderBy('created_at', 'desc').paginate(page, limit)

    // Charger senderStore conditionnellement pour chaque transfert
    const transfers = result.all()
    for (const transfer of transfers) {
      if (transfer.senderStoreId) {
        await transfer.load('senderStore')
      }
    }

    return {
      data: transfers,
      meta: {
        total: result.total,
        currentPage: result.currentPage,
        perPage: result.perPage,
        lastPage: result.lastPage,
      },
    }
  }

  /**
   * Supprimer (soft delete) un transfert
   */
  async delete(
    transferId: string,
    auditContext?: {
      userId: string
      userRole: string
      ipAddress: string
      userAgent: string | undefined
    }
  ): Promise<void> {
    const transfer = await ProductTransfer.query()
      .where('id', transferId)
      .whereNull('deleted_at')
      .first()

    if (!transfer) {
      throw new Exception('Transfert de produit non trouvé', {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_NOT_FOUND,
        status: 404,
      })
    }

    // Ne pas permettre la suppression d'un transfert validé
    if (transfer.status === 'validated') {
      throw new Exception('Les transferts validés ne peuvent pas être supprimés', {
        code: ProductTransferErrorCodes.PRODUCT_TRANSFER_VALIDATED_NOT_DELETABLE,
        status: 400,
      })
    }

    transfer.deletedAt = DateTime.now()
    await transfer.save()

    // Créer l'audit log si le contexte est fourni
    if (auditContext) {
      try {
        await AuditLog.logAction({
          auditableType: 'product_transfer',
          auditableId: transfer.id,
          action: 'delete',
          userId: auditContext.userId,
          userRole: auditContext.userRole,
          oldValues: { code: transfer.code },
          newValues: null,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      } catch (error) {
        console.error('Erreur lors de la création du log audit:', error)
      }
    }
  }
}
