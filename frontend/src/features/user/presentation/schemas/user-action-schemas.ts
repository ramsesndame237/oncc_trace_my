import { z } from "zod";
import type { TranslateFn } from "@/i18n/types";

// Schéma pour l'action d'activation/désactivation d'utilisateur (ancien système)
export const userActionSchema = z
  .object({
    username: z
      .string()
      .min(1, "Le nom d'utilisateur est requis pour confirmer l'action"),
    reason: z
      .string()
      .optional(),
  })
  .refine(() => {
    // La validation du nom d'utilisateur correct sera faite dans le composant
    // car on a besoin du nom d'utilisateur cible pour la comparaison
    return true;
  });

// Type TypeScript inféré du schéma (ancien système)
export type UserActionFormData = z.infer<typeof userActionSchema>;

// Fonction utilitaire pour créer un schéma avec validation du nom d'utilisateur (ancien système)
export const createUserActionSchema = (expectedUsername: string, action: 'activate' | 'deactivate') => {
  return z
    .object({
      username: z
        .string()
        .min(1, "Le nom d'utilisateur est requis pour confirmer l'action")
        .refine(
          (value) => value === expectedUsername,
          "Le nom d'utilisateur saisi ne correspond pas"
        ),
      reason: action === 'deactivate'
        ? z.string().optional()
        : z.string().optional(),
    });
};

// Nouveau système: Schéma pour le modal dynamique
export const createUserModalActionSchema = (
  expectedUsername: string,
  action: 'activate' | 'deactivate',
  t: TranslateFn
) => {
  return z.object({
    username: z
      .string()
      .min(1, t("user:validation.usernameRequired"))
      .refine(
        (value) => value === expectedUsername,
        t("user:validation.usernameMismatch")
      ),
    reason: action === 'deactivate'
      ? z.string().optional()
      : z.string().optional(),
  });
};

export type UserModalActionFormData = z.infer<
  ReturnType<typeof createUserModalActionSchema>
>;

// Schéma pour la réinitialisation de mot de passe avec le modal dynamique
export const createResetPasswordModalSchema = (
  expectedUsername: string,
  t: TranslateFn
) => {
  return z.object({
    username: z
      .string()
      .min(1, t("user:validation.usernameRequired"))
      .refine(
        (value) => value === expectedUsername,
        t("user:validation.usernameMismatch")
      ),
  });
};

export type ResetPasswordModalFormData = z.infer<
  ReturnType<typeof createResetPasswordModalSchema>
>;

// Schéma pour la modification du nom avec confirmation par ID utilisateur
export const createEditNameModalSchema = (
  expectedUserId: string,
  t: TranslateFn
) => {
  return z.object({
    givenName: z
      .string()
      .min(1, t("user:validation.givenNameRequired"))
      .max(100, t("user:validation.givenNameMaxLength", { max: 100 })),
    familyName: z
      .string()
      .min(1, t("user:validation.familyNameRequired"))
      .max(100, t("user:validation.familyNameMaxLength", { max: 100 })),
    userId: z
      .string()
      .min(1, t("user:validation.userIdRequired"))
      .refine(
        (value) => value === expectedUserId,
        t("user:validation.userIdMismatch")
      ),
  });
};

export type EditNameModalFormData = z.infer<
  ReturnType<typeof createEditNameModalSchema>
>;

// Schéma pour la modification du téléphone avec confirmation par ID utilisateur
export const createEditPhoneModalSchema = (
  expectedUserId: string,
  t: TranslateFn
) => {
  return z.object({
    phone: z
      .string()
      .optional()
      .refine(
        (value) => !value || value.trim() === "" || /^[\+]?[0-9\s\-\(\)]+$/.test(value),
        t("user:validation.phoneInvalid")
      ),
    userId: z
      .string()
      .min(1, t("user:validation.userIdRequired"))
      .refine(
        (value) => value === expectedUserId,
        t("user:validation.userIdMismatch")
      ),
  });
};

export type EditPhoneModalFormData = z.infer<
  ReturnType<typeof createEditPhoneModalSchema>
>;

// Schéma pour la modification du mot de passe avec confirmation par ID utilisateur
export const createEditPasswordModalSchema = (
  expectedUserId: string,
  t: TranslateFn
) => {
  return z.object({
    currentPassword: z
      .string()
      .min(1, t("common:validation.currentPasswordRequired")),
    newPassword: z
      .string()
      .min(8, t("common:validation.newPasswordMinLength"))
      .regex(/[A-Z]/, t("common:validation.newPasswordUpperCase"))
      .regex(/[a-z]/, t("common:validation.newPasswordLowerCase"))
      .regex(/[0-9]/, t("common:validation.newPasswordNumber"))
      .regex(/[@#$%^&*!]/, t("common:validation.passwordSpecialChar")),
    confirmPassword: z
      .string()
      .min(1, t("common:validation.confirmPasswordRequired")),
    userId: z
      .string()
      .min(1, t("user:validation.userIdRequired"))
      .refine(
        (value) => value === expectedUserId,
        t("user:validation.userIdMismatch")
      ),
  }).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: t("common:validation.passwordMismatch"),
      path: ["confirmPassword"],
    }
  );
};

export type EditPasswordModalFormData = z.infer<
  ReturnType<typeof createEditPasswordModalSchema>
>;