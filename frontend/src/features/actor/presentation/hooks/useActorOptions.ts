/**
 * Hook pour obtenir les options de formulaire pour les acteurs
 */

import {
  buyerDocuments,
  complementDocument,
  complementDocument2,
  landProveMentData,
  landProveMentData2,
  opaDocuments,
  pictureData,
} from "@/features/document/domain";
import { useTranslation } from "react-i18next";
import {
  actorStatusOptions,
  actorTypes as actorTypesConst,
  genderOptions,
  parcelTypeOptions,
} from "../../domain/constants";

export const useActorOptions = () => {
  const { t } = useTranslation("actor");

  return {
    // Types de documents pour les producteurs - utilise documentTypes.ts comme source de vérité unique
    pictureProducerDocuments: pictureData.map((doc) => ({
      value: doc.value,
      label: t(`${doc.label}` as never), // doc.label contient la clé complète avec namespace (document:types.xxx)
    })),

    // Documents complémentaires - utilise documentTypes.ts comme source de vérité unique
    complementDocuments: complementDocument.map((doc) => ({
      value: doc.value,
      label: t(doc.label as never), // doc.label contient la clé complète avec namespace (document:types.xxx)
    })),

    complement2Documents: complementDocument2.map((doc) => ({
      value: doc.value,
      label: t(doc.label as never), // doc.label contient la clé complète avec namespace (document:types.xxx)
    })),

    // Types de preuves foncières - utilise documentTypes.ts comme source de vérité unique
    landProducerDocuments: landProveMentData.map((doc) => ({
      value: doc.value,
      label: t(doc.label as never), // doc.label contient la clé complète avec namespace (document:types.xxx)
    })),

    landOPADocuments: landProveMentData2.map((doc) => ({
      value: doc.value,
      label: t(doc.label as never), // doc.label contient la clé complète avec namespace (document:types.xxx)
    })),

    opaDocuments: opaDocuments.map((doc) => ({
      value: doc.value,
      label: t(doc.label as never), // doc.label contient la clé complète avec namespace (document:types.xxx)
    })),

    // Types de parcelles - utilise constants.ts comme source de vérité
    parcelTypes: parcelTypeOptions.map((option) => ({
      value: option.value,
      label: t(`options.parcelTypes.${option.value}` as never),
    })),

    // Genres - utilise constants.ts comme source de vérité
    genders: genderOptions.map((option) => ({
      value: option.value,
      label: t(`options.genders.${option.value}` as never),
    })),

    // Types d'acteurs - utilise constants.ts comme source de vérité
    actorTypes: actorTypesConst.map((option) => ({
      value: option.value,
      label: t(`options.actorTypes.${option.value}` as never),
    })),

    // Status des acteurs - utilise constants.ts comme source de vérité
    actorStatus: actorStatusOptions.map((option) => ({
      value: option.value,
      label: t(`options.actorStatus.${option.value}` as never),
    })),
  };
};

// Hook spécialisé pour les options de producteur
export const useProducerOptions = () => {
  const {
    pictureProducerDocuments,
    complementDocuments,
    landProducerDocuments,
    parcelTypes,
    genders,
  } = useActorOptions();

  return {
    pictureProducerDocuments,
    complementDocuments,
    landProducerDocuments,
    parcelTypes,
    genders,
  };
};

// Hook spécialisé pour les options OPA
export const useOPAOptions = () => {
  const { opaDocuments, complementDocuments, landOPADocuments } =
    useActorOptions();

  return {
    // Documents OPA obligatoires
    opaDocuments,
    landOPADocuments,
    // Documents complémentaires optionnels
    complementDocuments,
  };
};

// Hook spécialisé pour les options Buyer
export const useBuyerOptions = () => {
  const { t } = useTranslation("actor");

  return {
    // Documents acheteur obligatoires (RCCM, Attestation de conformité, Agrément commercial)
    buyerDocuments: buyerDocuments.map((doc) => ({
      value: doc.value,
      label: t(doc.label as never),
    })),
    // Documents complémentaires optionnels
    complementDocuments: complementDocument2.map((doc) => ({
      value: doc.value,
      label: t(doc.label as never),
    })),
  };
};

export const useExporterOptions = () => {
  const { t } = useTranslation("actor");

  return {
    exporterDocuments: buyerDocuments.map((doc) => ({
      value: doc.value,
      label: t(doc.label as never),
    })),
  };
};

export const useTransformerOptions = () => {
  const { t } = useTranslation("actor");

  return {
    transformerDocuments: buyerDocuments.map((doc) => ({
      value: doc.value,
      label: t(doc.label as never),
    })),
    // Documents complémentaires optionnels
    complementDocuments: complementDocument2.map((doc) => ({
      value: doc.value,
      label: t(doc.label as never),
    })),
  };
};
