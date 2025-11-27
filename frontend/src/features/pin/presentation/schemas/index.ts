import { z } from "zod";

// Schéma pour la création de code PIN avec validation avancée
export const createPinSchema = z.object({
  pin: z
    .string()
    .regex(/^\d+$/, "Le code PIN ne doit contenir que des chiffres"),
});

// Types TypeScript dérivés des schémas
export type CreatePinFormData = z.infer<typeof createPinSchema>;
