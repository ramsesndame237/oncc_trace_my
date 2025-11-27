"use client";

import {
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  FormField as UIFormField,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";
import {
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";

/**
 * Props pour le composant FormFieldWrapper
 */
export interface FormFieldWrapperProps<TFieldValues extends FieldValues> {
  /**
   * Instance du formulaire React Hook Form
   */
  form: UseFormReturn<TFieldValues>;

  /**
   * Nom du champ dans le formulaire
   */
  name: FieldPath<TFieldValues>;

  /**
   * Label à afficher pour le champ
   */
  label?: string | ReactNode;

  /**
   * Description additionnelle (optionnelle)
   */
  description?: string | ReactNode;

  /**
   * Si le champ est requis (affiche une étoile)
   */
  required?: boolean;

  /**
   * Style CSS pour le conteneur
   */
  className?: string;

  /**
   * Fonction de rendu pour le champ
   */
  renderField: (
    field: ControllerRenderProps<TFieldValues, FieldPath<TFieldValues>>,
    fieldState?: ControllerFieldState
  ) => React.ReactNode;

  /**
   * Layout du champ (horizontal pour les checkboxes)
   */
  layout?: "vertical" | "horizontal";

  /**
   * Règles de validation additionnelles
   */
  rules?: Omit<
    RegisterOptions<TFieldValues, FieldPath<TFieldValues>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

/**
 * Composant wrapper pour les champs de formulaire avec React Hook Form
 * Gère automatiquement les labels, descriptions et messages d'erreur
 */
export function FormFieldWrapper<TFieldValues extends FieldValues>({
  form,
  name,
  label,
  description,
  required = false,
  className,
  renderField,
  layout = "vertical",
  rules,
}: FormFieldWrapperProps<TFieldValues>) {
  const isHorizontal = layout === "horizontal";

  return (
    <UIFormField
      control={form.control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormItem
          className={cn(
            { "flex flex-row items-start space-x-3 space-y-0": isHorizontal },
            className
          )}
        >
          {/* Layout différent pour les champs horizontaux (checkboxes) */}
          {isHorizontal ? (
            <>
              {renderField(field, fieldState)}
              <div className="space-y-1 leading-none">
                {label && (
                  <FormLabel className={cn(!description && "!mb-0")}>
                    {label}
                  </FormLabel>
                )}
                {description && (
                  <FormDescription>{description}</FormDescription>
                )}
                <FormMessage />
              </div>
            </>
          ) : (
            <>
              {label && (
                <FormLabel
                  className={
                    required
                      ? "after:content-['*'] after:text-destructive after:ml-0.5"
                      : ""
                  }
                >
                  {label}
                </FormLabel>
              )}
              {description && <FormDescription>{description}</FormDescription>}
              {renderField(field, fieldState)}
              <FormMessage />
            </>
          )}
        </FormItem>
      )}
    />
  );
}
