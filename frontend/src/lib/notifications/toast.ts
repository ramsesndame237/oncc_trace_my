import { toast } from "sonner";

/**
 * Options de configuration pour les toasts
 */
type ToastOptions = {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

/**
 * Affiche une notification de succès
 * @param title Titre du toast
 * @param options Options de configuration
 */
export const showSuccess = (title: string, options?: ToastOptions) => {
  toast.success(title, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  });
};

/**
 * Affiche une notification d'erreur
 * @param title Titre du toast
 * @param options Options de configuration
 */
export const showError = (title: string, options?: ToastOptions) => {
  toast.error(title, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  });
};

/**
 * Affiche une notification d'information
 * @param title Titre du toast
 * @param options Options de configuration
 */
export const showInfo = (title: string, options?: ToastOptions) => {
  toast.info(title, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  });
};

/**
 * Affiche une notification d'avertissement
 * @param title Titre du toast
 * @param options Options de configuration
 */
export const showWarning = (title: string, options?: ToastOptions) => {
  toast.warning(title, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  });
};

/**
 * @description Ce fichier est une couche d'abstraction sur la librairie Sonner.
 * Il ne doit jamais être utilisé directement par les features.
 * Les features doivent utiliser le hook useNotification du module shared/notifications.
 */
