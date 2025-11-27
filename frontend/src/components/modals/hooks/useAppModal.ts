"use client";

import { useModal } from "@ebay/nice-modal-react";
import WrapperModal from "../WrapperModal";
import { getContextProvider } from "../contexts/ContextRegistry";
import { type ModalConfig } from "../helpers/modal-types";

// Logique de détection des besoins de contexte
const detectContextNeed = (config: ModalConfig): boolean => {
  // Détection explicite
  if (config.needsCommunication) return true;

  // Détection automatique : Content + Footer séparés = communication probable
  if (config.content && config.footer) {
    return true;
  }

  // Détection par type de contexte
  if (config.contextType) return true;

  return false;
};

export const useAppModal = () => {
  const modal = useModal(WrapperModal);

  const showModal = (config: ModalConfig) => {
    const needsContext = detectContextNeed(config);

    if (needsContext) {
      return showWithAutoContext(config);
    }

    return showSimpleModal(config);
  };

  const showWithAutoContext = (config: ModalConfig) => {
    const contextType = config.contextType || "generic";
    const ContextProvider = getContextProvider(contextType);

    // ✅ Passer le provider et les données au WrapperModal
    return modal.show({
      title: config.title,
      description: config.description,
      variant: config.variant,
      size: config.size || "md",
      content: config.content,
      footer: config.footer,
      contextProvider: ContextProvider,
      contextData: config.contextData,
    });
  };

  const showSimpleModal = (config: ModalConfig) => {
    // Modal classique sans contexte
    return modal.show({
      title: config.title,
      description: config.description,
      variant: config.variant,
      size: config.size || "md",
      content: config.content,
      footer: config.footer,
    });
  };

  const hideModal = () => {
    modal.remove();
  };

  return {
    show: showModal,
    hide: hideModal,
    visible: modal.visible,
    // Exposer le modal brut pour des usages avancés
    modal,
  };
};
