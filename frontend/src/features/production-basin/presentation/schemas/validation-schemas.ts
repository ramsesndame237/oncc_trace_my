"use client";

import { z } from "zod";

// Schéma pour la création/édition d'un bassin de production
export const productionBasinSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du bassin est requis")
    .min(3, "Le nom du bassin doit contenir au moins 3 caractères")
    .max(100, "Le nom du bassin ne peut pas dépasser 100 caractères"),
  description: z.string().optional(),
  locationCodes: z.array(z.string()).optional(),
});

export type ProductionBasinFormData = z.infer<typeof productionBasinSchema>;
