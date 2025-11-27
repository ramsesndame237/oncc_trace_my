# Exemples d'utilisation des codes d'erreur ONCC API

Ce document fournit des exemples pratiques pour intégrer le système de codes d'erreur standardisé dans votre application frontend.

## Types TypeScript

```typescript
interface ApiResponse<T = any> {
  success: boolean
  message: string
  errorCode?: string
  successCode?: string
  data?: T
  validationErrors?: ValidationError[]
  timestamp: string
  requestId: string
}

interface ValidationError {
  field: string
  message: string
  value?: any
}

interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
```

## Codes d'erreur et de succès

```typescript
export enum ErrorCodes {
  // Authentification
  AUTH_LOGIN_INVALID_CREDENTIALS = 'AUTH_LOGIN_INVALID_CREDENTIALS',
  AUTH_LOGIN_ACCOUNT_INACTIVE = 'AUTH_LOGIN_ACCOUNT_INACTIVE',
  AUTH_LOGIN_DEFAULT_PASSWORD = 'AUTH_LOGIN_DEFAULT_PASSWORD',
  AUTH_OTP_INVALID = 'AUTH_OTP_INVALID',
  AUTH_OTP_EXPIRED = 'AUTH_OTP_EXPIRED',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',

  // Utilisateurs
  USER_CREATE_EMAIL_EXISTS = 'USER_CREATE_EMAIL_EXISTS',
  USER_CREATE_PSEUDO_EXISTS = 'USER_CREATE_PSEUDO_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Validation
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_EMAIL = 'VALIDATION_INVALID_EMAIL',
  VALIDATION_INVALID_PASSWORD_FORMAT = 'VALIDATION_INVALID_PASSWORD_FORMAT',

  // Système
  SYSTEM_UNAUTHORIZED = 'SYSTEM_UNAUTHORIZED',
  SYSTEM_INTERNAL_ERROR = 'SYSTEM_INTERNAL_ERROR',
}

export enum SuccessCodes {
  AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_OTP_SENT = 'AUTH_LOGIN_OTP_SENT',
  USER_CREATED = 'USER_CREATED',
  USER_LIST_SUCCESS = 'USER_LIST_SUCCESS',
}
```

## Client API basique

```typescript
class ONGCApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string) {
    this.token = token
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()
    return data as ApiResponse<T>
  }

  // Méthodes d'authentification
  async login(pseudo: string, password: string) {
    const response = await this.makeRequest<{
      requiresOtp?: boolean
      requiresInitialization?: boolean
      sessionKey?: string
      user?: any
      token?: any
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ pseudo, password }),
    })

    if (response.success) {
      switch (response.successCode) {
        case SuccessCodes.AUTH_LOGIN_OTP_SENT:
          return {
            success: true,
            requiresOtp: response.data?.requiresOtp,
            requiresInitialization: response.data?.requiresInitialization,
            sessionKey: response.data?.sessionKey,
          }

        case SuccessCodes.AUTH_LOGIN_SUCCESS:
          if (response.data?.token?.value) {
            this.setToken(response.data.token.value)
          }
          return {
            success: true,
            user: response.data?.user,
            token: response.data?.token,
          }
      }
    } else {
      throw new ApiError(response.errorCode!, response.message)
    }

    return { success: false }
  }

  async verifyOtp(otp: string, sessionKey: string) {
    const response = await this.makeRequest<{
      user: any
      token: any
    }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp, sessionKey }),
    })

    if (response.success) {
      if (response.data?.token?.value) {
        this.setToken(response.data.token.value)
      }
      return {
        success: true,
        user: response.data?.user,
        token: response.data?.token,
      }
    } else {
      throw new ApiError(response.errorCode!, response.message)
    }
  }

  async createUser(userData: any) {
    const response = await this.makeRequest<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    if (response.success) {
      return {
        success: true,
        user: response.data,
      }
    } else {
      if (response.validationErrors) {
        throw new ValidationError('Données invalides', response.validationErrors)
      }
      throw new ApiError(response.errorCode!, response.message)
    }
  }
}
```

## Classes d'erreur personnalisées

```typescript
class ApiError extends Error {
  constructor(
    public errorCode: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ValidationError extends Error {
  constructor(
    message: string,
    public validationErrors: ValidationError[]
  ) {
    super(message)
    this.name = 'ValidationError'
  }

  getFieldErrors(): Record<string, string> {
    const errors: Record<string, string> = {}
    this.validationErrors.forEach((error) => {
      errors[error.field] = error.message
    })
    return errors
  }
}
```

## Gestion des erreurs par type

### 1. Erreurs d'authentification

```typescript
function handleAuthError(error: ApiError): void {
  switch (error.errorCode) {
    case ErrorCodes.AUTH_LOGIN_INVALID_CREDENTIALS:
      showFormError('Identifiants incorrects')
      break

    case ErrorCodes.AUTH_LOGIN_ACCOUNT_INACTIVE:
      showError('Votre compte est inactif. Contactez un administrateur.')
      break

    case ErrorCodes.AUTH_LOGIN_DEFAULT_PASSWORD:
      // Rediriger vers la page d'initialisation
      redirectTo('/auth/initialize')
      break

    case ErrorCodes.AUTH_OTP_INVALID:
      showFieldError('otp', 'Code de vérification incorrect')
      break

    case ErrorCodes.AUTH_OTP_EXPIRED:
      showError('Code de vérification expiré. Un nouveau code a été envoyé.')
      break

    case ErrorCodes.AUTH_TOKEN_EXPIRED:
      // Rediriger vers la page de connexion
      redirectTo('/login')
      break

    default:
      showError(error.message)
  }
}
```

### 2. Erreurs de validation

```typescript
function handleValidationError(error: ValidationError): void {
  const fieldErrors = error.getFieldErrors()

  // Afficher les erreurs sur les champs correspondants
  Object.entries(fieldErrors).forEach(([field, message]) => {
    showFieldError(field, message)
  })

  // Afficher un message général
  showError('Veuillez corriger les erreurs dans le formulaire')
}
```

### 3. Erreurs utilisateur

```typescript
function handleUserError(error: ApiError): void {
  switch (error.errorCode) {
    case ErrorCodes.USER_CREATE_EMAIL_EXISTS:
      showFieldError('email', 'Cette adresse email est déjà utilisée')
      break

    case ErrorCodes.USER_CREATE_PSEUDO_EXISTS:
      showFieldError('pseudo', 'Ce pseudo est déjà utilisé')
      break

    case ErrorCodes.USER_NOT_FOUND:
      showError('Utilisateur introuvable')
      // Optionnel: rediriger vers la liste
      redirectTo('/users')
      break

    default:
      showError(error.message)
  }
}
```

## Hook React générique

```typescript
import { useState, useCallback } from 'react'

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  fieldErrors: Record<string, string>
  execute: (...args: any[]) => Promise<T | null>
  clearErrors: () => void
}

function useApi<T>(apiCall: (...args: any[]) => Promise<T>): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const execute = useCallback(
    async (...args: any[]) => {
      setLoading(true)
      setError(null)
      setFieldErrors({})

      try {
        const result = await apiCall(...args)
        setData(result)
        return result
      } catch (err) {
        if (err instanceof ValidationError) {
          setFieldErrors(err.getFieldErrors())
          setError(err.message)
        } else if (err instanceof ApiError) {
          handleSpecificError(err)
          setError(err.message)
        } else {
          setError('Une erreur inattendue est survenue')
        }
        return null
      } finally {
        setLoading(false)
      }
    },
    [apiCall]
  )

  const clearErrors = useCallback(() => {
    setError(null)
    setFieldErrors({})
  }, [])

  return {
    data,
    loading,
    error,
    fieldErrors,
    execute,
    clearErrors,
  }
}

function handleSpecificError(error: ApiError): void {
  // Gestion des redirections automatiques
  if (error.errorCode === ErrorCodes.AUTH_TOKEN_EXPIRED) {
    redirectTo('/login')
  } else if (error.errorCode === ErrorCodes.AUTH_LOGIN_DEFAULT_PASSWORD) {
    redirectTo('/auth/initialize')
  }
}
```

## Exemples d'utilisation dans les composants

### Formulaire de connexion

```typescript
function LoginForm() {
  const [step, setStep] = useState<'login' | 'otp'>('login')
  const [sessionKey, setSessionKey] = useState('')

  const client = new ONGCApiClient('/api')

  const { loading, error, fieldErrors, execute: login } = useApi(
    (pseudo: string, password: string) => client.login(pseudo, password)
  )

  const handleLogin = async (formData: { pseudo: string; password: string }) => {
    const result = await login(formData.pseudo, formData.password)

    if (result?.requiresOtp) {
      setSessionKey(result.sessionKey)
      setStep('otp')
    } else if (result?.user) {
      // Connexion réussie
      redirectTo('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleLogin)}>
      {step === 'login' ? (
        <>
          <input
            name="pseudo"
            placeholder="Pseudo"
            className={fieldErrors.pseudo ? 'error' : ''}
          />
          {fieldErrors.pseudo && <span className="error">{fieldErrors.pseudo}</span>}

          <input
            name="password"
            type="password"
            placeholder="Mot de passe"
            className={fieldErrors.password ? 'error' : ''}
          />
          {fieldErrors.password && <span className="error">{fieldErrors.password}</span>}

          <button type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </>
      ) : (
        <OtpForm sessionKey={sessionKey} />
      )}

      {error && <div className="error">{error}</div>}
    </form>
  )
}
```

### Création d'utilisateur

```typescript
function CreateUserForm() {
  const client = new ONGCApiClient('/api')

  const { loading, error, fieldErrors, execute: createUser } = useApi(
    (userData: any) => client.createUser(userData)
  )

  const handleSubmit = async (formData: any) => {
    const result = await createUser(formData)

    if (result) {
      showSuccess('Utilisateur créé avec succès')
      redirectTo('/users')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleSubmit)}>
      <input
        name="email"
        type="email"
        placeholder="Email"
        className={fieldErrors.email ? 'error' : ''}
      />
      {fieldErrors.email && <span className="error">{fieldErrors.email}</span>}

      <input
        name="pseudo"
        placeholder="Pseudo"
        className={fieldErrors.pseudo ? 'error' : ''}
      />
      {fieldErrors.pseudo && <span className="error">{fieldErrors.pseudo}</span>}

      <button type="submit" disabled={loading}>
        {loading ? 'Création...' : 'Créer l\'utilisateur'}
      </button>

      {error && <div className="error">{error}</div>}
    </form>
  )
}
```

## Utilitaires UI

```typescript
// Fonctions utilitaires pour l'affichage des erreurs
function showError(message: string): void {
  // Toast, notification, modal, etc.
  console.error(message)
}

function showSuccess(message: string): void {
  // Toast de succès
  console.log(message)
}

function showFieldError(field: string, message: string): void {
  // Marquer le champ en erreur dans l'interface
  console.error(`Erreur ${field}: ${message}`)
}

function showFormError(message: string): void {
  // Afficher une erreur générale du formulaire
  console.error(`Erreur formulaire: ${message}`)
}

function redirectTo(path: string): void {
  // Navigation programmatique
  window.location.href = path
}
```

## Configuration globale

```typescript
// Configuration du client API global
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api'
export const apiClient = new ONGCApiClient(API_BASE_URL)

// Intercepteur global pour gérer les erreurs de token
apiClient.onError = (error: ApiError) => {
  if (error.errorCode === ErrorCodes.AUTH_TOKEN_EXPIRED) {
    // Nettoyer le token local et rediriger
    localStorage.removeItem('authToken')
    redirectTo('/login')
  }
}
```

Cette implémentation fournit une base solide pour gérer les codes d'erreur standardisés dans votre application frontend, avec une séparation claire des responsabilités et une expérience utilisateur cohérente.
