import { SystemErrorCodes } from "@/core/domain/error-codes";
import type { ApiResponse } from "@/core/infrastructure/types/api.type";
import { AuthErrorCodes } from "@/features/auth/domain/types/auth-codes";
import type { Session } from "next-auth";
import { getSession } from "next-auth/react";
import type { LocationConflict, RegionConflict, DepartmentConflict } from "@/features/outbox/domain/outbox.types";

/**
 * Configuration de l'API
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api/v1";

/**
 * Classe d'erreur API personnalisée
 */
export class ApiError extends Error {
  constructor(
    public errorCode: string,
    message: string,
    public validationErrors?: Array<{
      field: string;
      message: string;
      value?: unknown;
    }>,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }

  /**
   * Récupère les conflicts depuis details si présents
   */
  get conflicts(): LocationConflict[] | undefined {
    return this.details?.conflicts as LocationConflict[] | undefined;
  }

  /**
   * Récupère les conflits hiérarchiques de régions depuis details si présents
   */
  get regionConflicts(): RegionConflict[] | undefined {
    return this.details?.regionConflicts as RegionConflict[] | undefined;
  }

  /**
   * Récupère les conflits hiérarchiques de départements depuis details si présents
   */
  get departmentConflicts(): DepartmentConflict[] | undefined {
    return this.details?.departmentConflicts as DepartmentConflict[] | undefined;
  }

  /**
   * Retourne les erreurs de validation organisées par champ
   */
  getFieldErrors(): Record<string, string> {
    if (!this.validationErrors) return {};

    const errors: Record<string, string> = {};
    this.validationErrors.forEach((error) => {
      errors[error.field] = error.message;
    });
    return errors;
  }

  /**
   * Vérifie si l'erreur nécessite une redirection
   */
  requiresRedirect(): { shouldRedirect: boolean; path?: string } {
    switch (this.errorCode) {
      case AuthErrorCodes.TOKEN_EXPIRED:
      case AuthErrorCodes.SESSION_EXPIRED:
      case SystemErrorCodes.UNAUTHORIZED:
        return { shouldRedirect: true, path: "/auth/login" };

      case AuthErrorCodes.LOGIN_DEFAULT_PASSWORD:
        return { shouldRedirect: true, path: "/auth/security-setup" };

      default:
        return { shouldRedirect: false };
    }
  }
}

/**
 * Configuration des headers par défaut
 */
const getDefaultHeaders = (token?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Client API principal pour l'application ONCC
 */
export class ONGCApiClient {
  private token: string | null = null;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialise le client API avec la session actuelle
   * Cette méthode doit être appelée une seule fois au démarrage de l'application
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      // Récupérer la session actuelle
      const session: Session | null = await getSession();
      this.handleSessionUpdate(session);
      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation du client API:", error);
      // Même en cas d'erreur, on marque comme initialisé pour éviter les boucles
      this.isInitialized = true;
    }
  }

  /**
   * Met à jour le token à partir d'une session NextAuth
   */
  handleSessionUpdate(session: Session | null): void {
    const newToken: string | null = session?.accessToken ?? null;

    if (this.token !== newToken) {
      this.token = newToken;
    }
  }

  /**
   * Définit le token d'authentification
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Récupère le token d'authentification
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Vérifie si le client a un token valide
   */
  hasValidToken(): boolean {
    return !!this.token && this.token.trim().length > 0;
  }

  /**
   * Vérifie si le client est initialisé
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Force la vérification du token et affiche des informations de débogage
   */
  debugTokenStatus(): void {
    // console.log("🔍 Debug Token Status:", {
    //   isInitialized: this.isInitialized,
    //   hasToken: !!this.token,
    //   tokenLength: this.token?.length || 0,
    //   tokenPreview: this.token ? this.token.substring(0, 30) + "..." : "null",
    //   isValidToken: this.hasValidToken(),
    // });
  }

  /**
   * Assure que le client est initialisé avant d'effectuer une requête
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Effectue une requête API avec gestion des erreurs standardisée
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // S'assurer que le client est initialisé
    await this.ensureInitialized();

    const url = `${API_BASE_URL}${endpoint}`;
    const headers = getDefaultHeaders(this.token);

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();

      // Vérification du succès de la réponse
      if (data.success) {
        return data;
      } else {
        // Lancer une erreur avec les détails de l'API (details contient tout ce qui vient du backend)
        throw new ApiError(data.errorCode, data.message, data.validationErrors, (data as unknown as Record<string, unknown>).details as Record<string, unknown>);
      }
    } catch (error) {
      // Si ce n'est pas une ApiError, on en crée une générique
      if (!(error instanceof ApiError)) {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          error instanceof Error ? error.message : "Erreur réseau inconnue"
        );
      }
      throw error;
    }
  }

  /**
   * Méthode GET
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: "GET" });
  }

  /**
   * Méthode POST
   */
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Méthode PUT
   */
  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Méthode PATCH
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Méthode DELETE
   */
  async delete<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Méthode POST pour FormData (upload de fichiers)
   */
  async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    await this.ensureInitialized();

    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      Authorization: `Bearer ${this.token}`,
      // Ne pas définir Content-Type pour FormData, le navigateur le fait automatiquement
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      const data: ApiResponse<T> = await response.json();

      if (data.success) {
        return data;
      } else {
        throw new ApiError(data.errorCode, data.message, data.validationErrors, (data as unknown as Record<string, unknown>).details as Record<string, unknown>);
      }
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw new ApiError(
          SystemErrorCodes.INTERNAL_ERROR,
          error instanceof Error ? error.message : "Erreur réseau inconnue"
        );
      }
      throw error;
    }
  }
}

/**
 * Instance globale du client API
 */
export const apiClient = new ONGCApiClient();
