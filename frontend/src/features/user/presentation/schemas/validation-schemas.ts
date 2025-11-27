import { USER_ROLES } from "@/core/domain/user.types";
import type { TranslateFn } from "@/i18n/types";
import { z } from "zod";

/**
 * Schéma de recherche utilisateur
 * Note: Le paramètre t n'est pas utilisé car ce schéma n'a pas de messages de validation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createUserSearchSchema = (_t: TranslateFn) => {
  return z.object({
    search: z.string().optional(),
    role: z.enum(Object.values(USER_ROLES) as [string, ...string[]]).optional(),
    status: z.enum(["active", "inactive", "blocked"]).optional(),
    page: z.number().min(1).optional(),
    per_page: z.number().min(1).max(100).optional(),
  });
};

// Regex pour validation email stricte côté frontend
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Schéma de validation pour la création d'un utilisateur
 */
export const createUserSchema = (t: TranslateFn) => {
  return z
    .object({
      familyName: z
        .string()
        .min(1, t("user:validation.familyNameRequired"))
        .max(100, t("user:validation.familyNameMaxLength", { max: 100 })),
      givenName: z
        .string()
        .min(1, t("user:validation.givenNameRequired"))
        .max(100, t("user:validation.givenNameMaxLength", { max: 100 })),
      email: z
        .string()
        .min(1, t("user:validation.emailRequired"))
        .regex(EMAIL_REGEX, t("user:validation.emailInvalid")),
      phone: z.string().optional(),
      role: z.enum(Object.values(USER_ROLES) as [string, ...string[]]),
      position: z
        .union([
          z.string().min(2, t("user:validation.positionMinLength", { min: 2 })).max(100, t("user:validation.positionMaxLength", { max: 100 })),
          z.literal("")
        ])
        .optional(),
      productionBasinId: z.string().optional(),
    })
    .refine(
      (data) => {
        // Validation conditionnelle: bassin de production requis pour basin_admin et field_agent
        if (data.role === "basin_admin" || data.role === "field_agent") {
          return data.productionBasinId && data.productionBasinId.length > 0;
        }
        return true;
      },
      {
        message: t("user:validation.productionBasinRequired"),
        path: ["productionBasinId"],
      }
    );
};

/**
 * Schéma de validation pour la modification d'un utilisateur
 */
export const createUpdateUserSchema = (t: TranslateFn) => {
  return z
    .object({
      familyName: z
        .string()
        .min(1, t("user:validation.familyNameRequired"))
        .max(100, t("user:validation.familyNameMaxLength", { max: 100 }))
        .optional(),
      givenName: z
        .string()
        .min(1, t("user:validation.givenNameRequired"))
        .max(100, t("user:validation.givenNameMaxLength", { max: 100 }))
        .optional(),
      email: z
        .string()
        .min(1, t("user:validation.emailRequired"))
        .regex(EMAIL_REGEX, t("user:validation.emailInvalid"))
        .optional(),
      phone: z.string().optional(),
      role: z.enum(Object.values(USER_ROLES) as [string, ...string[]]).optional(),
      position: z
        .union([
          z.string().min(2, t("user:validation.positionMinLength", { min: 2 })).max(100, t("user:validation.positionMaxLength", { max: 100 })),
          z.literal("")
        ])
        .optional(),
      productionBasinId: z.string().optional(),
    })
    .refine(
      (data) => {
        // Validation conditionnelle: bassin de production requis pour basin_admin et field_agent
        // Seulement si le rôle est défini
        if (
          data.role &&
          (data.role === "basin_admin" || data.role === "field_agent")
        ) {
          return data.productionBasinId && data.productionBasinId.length > 0;
        }
        return true;
      },
      {
        message: t("user:validation.productionBasinRequired"),
        path: ["productionBasinId"],
      }
    );
};

export type UserSearchFormData = z.infer<
  ReturnType<typeof createUserSearchSchema>
>;
export type CreateUserFormData = z.infer<ReturnType<typeof createUserSchema>>;
export type UpdateUserFormData = z.infer<
  ReturnType<typeof createUpdateUserSchema>
>;
