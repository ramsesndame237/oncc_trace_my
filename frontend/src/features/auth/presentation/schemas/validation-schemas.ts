import type { TranslateFn } from "@/i18n/types";
import { z } from "zod";

/**
 * Schéma de validation pour le formulaire de connexion
 */
export const createLoginSchema = (t: TranslateFn) => {
  return z.object({
    username: z
      .string()
      .min(1, t("auth:validation.usernameRequired"))
      .min(3, t("auth:validation.usernameMinLength", { min: 3 }))
      .max(50, t("common:validation.maxLength", { max: 50 })),
    password: z
      .string()
      .min(1, t("auth:validation.passwordRequired"))
      .min(8, t("common:validation.passwordMinLength", { min: 8 }))
      .max(100, t("common:validation.maxLength", { max: 100 })),
  });
};

/**
 * Schéma de validation pour la vérification OTP
 */
export const createOtpSchema = (t: TranslateFn) => {
  return z.object({
    otp: z
      .string()
      .min(1, t("auth:validation.otpRequired"))
      .length(6, t("auth:validation.otpInvalid"))
      .regex(/^\d{6}$/, t("auth:validation.otpInvalid")),
  });
};

/**
 * Schéma de validation pour les questions de sécurité
 */
export const createSecurityQuestionsSchema = (t: TranslateFn) => {
  return z
    .object({
      question1: z.string().min(1, t("auth:validation.questionRequired")),
      answer1: z
        .string()
        .min(1, t("auth:validation.answerRequired"))
        .min(3, t("auth:validation.answerMinLength", { min: 3 })),
      question2: z.string().min(1, t("auth:validation.questionRequired")),
      answer2: z
        .string()
        .min(1, t("auth:validation.answerRequired"))
        .min(3, t("auth:validation.answerMinLength", { min: 3 })),
      question3: z.string().min(1, t("auth:validation.questionRequired")),
      answer3: z
        .string()
        .min(1, t("auth:validation.answerRequired"))
        .min(3, t("auth:validation.answerMinLength", { min: 3 })),
    })
    .refine(
      (data) => {
        const questions = [data.question1, data.question2, data.question3];
        return new Set(questions).size === questions.length;
      },
      {
        message: t("auth:validation.questionsUnique"),
        path: ["question3"],
      }
    );
};

/**
 * Schéma de validation pour la réinitialisation du mot de passe
 */
export const createPasswordResetSchema = (t: TranslateFn) => {
  return z
    .object({
      newPassword: z
        .string()
        .min(1, t("auth:validation.passwordRequired"))
        .min(8, t("common:validation.passwordMinLength", { min: 8 }))
        .max(100, t("common:validation.maxLength", { max: 100 }))
        .regex(/[a-z]/, t("common:validation.passwordLowerCase"))
        .regex(/[A-Z]/, t("common:validation.passwordUpperCase"))
        .regex(/\d/, t("common:validation.passwordNumber"))
        .regex(/[@#$%^&*!]/, t("common:validation.passwordSpecialChar")),
      confirmPassword: z
        .string()
        .min(1, t("common:validation.confirmPasswordRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("common:validation.passwordMismatch"),
      path: ["confirmPassword"],
    });
};

/**
 * Schéma de validation pour la création de mot de passe (onboarding)
 */
export const createNewPasswordSchema = (t: TranslateFn) => {
  return z
    .object({
      password: z
        .string()
        .min(1, t("auth:validation.passwordRequired"))
        .min(8, t("common:validation.passwordMinLength", { min: 8 }))
        .max(100, t("common:validation.maxLength", { max: 100 }))
        .regex(/[a-z]/, t("common:validation.passwordLowerCase"))
        .regex(/[A-Z]/, t("common:validation.passwordUpperCase"))
        .regex(/\d/, t("common:validation.passwordNumber"))
        .regex(/[@#$%^&*!]/, t("common:validation.passwordSpecialChar")),
      confirmPassword: z
        .string()
        .min(1, t("common:validation.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("common:validation.passwordMismatch"),
      path: ["confirmPassword"],
    });
};

/**
 * Schéma de validation pour la récupération par email
 */
export const createEmailRecoverySchema = (t: TranslateFn) => {
  return z.object({
    email: z
      .string()
      .min(1, t("common:validation.emailRequired"))
      .email(t("common:validation.emailInvalid")),
  });
};

/**
 * Schéma de validation pour les réponses aux questions de sécurité
 */
export const createSecurityAnswersSchema = (t: TranslateFn) => {
  return z.object({
    answers: z
      .array(
        z.object({
          id: z.number(),
          answer: z
            .string()
            .min(1, t("auth:validation.answerRequired"))
            .min(3, t("auth:validation.answerMinLength", { min: 3 })),
        })
      )
      .min(1, t("common:validation.required")),
  });
};

// Types TypeScript dérivés des schémas (pour usage dans la couche Presentation)
export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
export type OtpFormData = z.infer<ReturnType<typeof createOtpSchema>>;
export type SecurityQuestionsFormData = z.infer<
  ReturnType<typeof createSecurityQuestionsSchema>
>;
export type PasswordResetFormData = z.infer<
  ReturnType<typeof createPasswordResetSchema>
>;
export type NewPasswordFormData = z.infer<
  ReturnType<typeof createNewPasswordSchema>
>;
export type EmailRecoveryFormValues = z.infer<
  ReturnType<typeof createEmailRecoverySchema>
>;
export type SecurityAnswersFormData = z.infer<
  ReturnType<typeof createSecurityAnswersSchema>
>;
