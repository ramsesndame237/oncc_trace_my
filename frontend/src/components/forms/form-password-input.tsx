"use client";

import { FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Eye, EyeOff } from "lucide-react";
import { ReactNode, useState } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { FormFieldWrapper } from "./form-wrapper";

interface PasswordValidationRules {
  minLength?: number;
  requireUpperCase?: boolean;
  requireLowerCase?: boolean;
  requireNumber?: boolean;
  requireSpecialChar?: boolean;
}

interface FormPasswordInputProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  classContainerInput?: string;
  showValidation?: boolean;
  validationRules?: PasswordValidationRules;
  customValidationMessages?: {
    minLength?: string;
    upperCase?: string;
    lowerCase?: string;
    number?: string;
    specialChar?: string;
  };
  description?: string | ReactNode;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

export default function FormPasswordInput<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "",
  disabled = false,
  className = "",
  required = false,
  classContainerInput = "",
  showValidation = false,
  validationRules = {
    minLength: 8,
    requireUpperCase: true,
    requireLowerCase: true,
    requireNumber: true,
    requireSpecialChar: true,
  },
  customValidationMessages = {
    minLength: "8 caractères minimum",
    upperCase: "Contenir des majuscules et des minuscules",
    number: "Au moins un chiffre",
    specialChar: "Au moins un caractère spécial (@#$%^&*!)",
  },
  description,
  rules,
}: FormPasswordInputProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  // Obtenir la valeur actuelle du champ
  const fieldValue = form.watch(name);

  // Validation criteria
  const validationCriteria = {
    minLength: fieldValue?.length >= (validationRules.minLength || 8),
    hasUpperCase: validationRules.requireUpperCase
      ? /[A-Z]/.test(fieldValue)
      : true,
    hasLowerCase: validationRules.requireLowerCase
      ? /[a-z]/.test(fieldValue)
      : true,
    hasNumber: validationRules.requireNumber ? /[0-9]/.test(fieldValue) : true,
    hasSpecialChar: validationRules.requireSpecialChar
      ? /[@#$%^&*!]/.test(fieldValue)
      : true,
  };

  return (
    <>
      <FormFieldWrapper
        form={form}
        name={name}
        label={label}
        description={description}
        required={required}
        rules={rules}
        renderField={(field) => (
          <div className={cn("relative", classContainerInput)}>
            <FormControl>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                disabled={disabled}
                className={cn("pr-10", className)}
                {...field}
              />
            </FormControl>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
              tabIndex={-1}
              disabled={disabled}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        )}
      />

      {/* Critères de validation */}
      {showValidation && (
        <div className="bg-gray-50 p-4 rounded-sm space-y-2 mt-2">
          <p className="text-sm font-medium">Le mot de passe doit avoir:</p>
          <ul className="space-y-1">
            {validationRules.minLength && (
              <li className="text-sm flex items-center gap-2">
                <span
                  className={cn(
                    "block p-1 bg-gray-300 rounded-full text-white",
                    validationCriteria.minLength
                      ? "bg-green-600"
                      : "bg-gray-400"
                  )}
                >
                  <Check className="size-4" />
                </span>
                {customValidationMessages.minLength}
              </li>
            )}
            {validationRules.requireUpperCase && (
              <li className="text-sm flex items-center gap-2">
                <span
                  className={cn(
                    "block p-1 bg-gray-300 rounded-full text-white",
                    validationCriteria.hasUpperCase
                      ? "bg-green-600"
                      : "bg-gray-400"
                  )}
                >
                  <Check className="size-4" />
                </span>
                {customValidationMessages.upperCase}
              </li>
            )}
            {validationRules.requireLowerCase && (
              <li className="text-sm flex items-center gap-2">
                <span
                  className={cn(
                    "block p-1 bg-gray-300 rounded-full text-white",
                    validationCriteria.hasLowerCase
                      ? "bg-green-600"
                      : "bg-gray-400"
                  )}
                >
                  <Check className="size-4" />
                </span>
                {customValidationMessages.lowerCase}
              </li>
            )}
            {validationRules.requireNumber && (
              <li className="text-sm flex items-center gap-2">
                <span
                  className={cn(
                    "block p-1 bg-gray-300 rounded-full text-white",
                    validationCriteria.hasNumber
                      ? "bg-green-600"
                      : "bg-gray-400"
                  )}
                >
                  <Check className="size-4" />
                </span>
                {customValidationMessages.number}
              </li>
            )}
            {validationRules.requireSpecialChar && (
              <li className="text-sm flex items-center gap-2">
                <span
                  className={cn(
                    "block p-1 bg-gray-300 rounded-full text-white",
                    validationCriteria.hasSpecialChar
                      ? "bg-green-600"
                      : "bg-gray-400"
                  )}
                >
                  <Check className="size-4" />
                </span>
                {customValidationMessages.specialChar}
              </li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}
