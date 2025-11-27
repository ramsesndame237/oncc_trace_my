import { type ReactNode } from "react";

export interface ModalAction {
  label: string;
  onClick?: () => void | Promise<void>;
  variant?: "default" | "destructive" | "success" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  key?: string;
  form?: string;
  type?: "button" | "submit" | "reset";
}

export interface ModalProps {
  title?: string;
  description?: ReactNode;
  content: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "default" | "destructive" | "success";
  showCloseButton?: boolean;
  closable?: boolean;
  footer?: ReactNode;
  className?: string;
}

export interface ModalActions {
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
}

export interface WrapperModalProps extends ModalProps, ModalActions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contextProvider?: React.ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contextData?: Record<string, any>;
}

// Nouvelles interfaces pour le Factory Pattern
export interface ModalConfig {
  title?: string;
  content?: ReactNode;
  footer?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive" | "success";
  size?: "sm" | "md" | "lg" | "xl" | "full";

  // Nouveaux flags de détection
  needsCommunication?: boolean;
  contextType?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contextData?: Record<string, any>;
}
