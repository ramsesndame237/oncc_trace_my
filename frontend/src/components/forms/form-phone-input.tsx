"use client";

import { FormControl } from "@/components/ui/form";
import PhoneInput from "@/components/ui/input-phone";
import { CountryCode, isPossiblePhoneNumber } from "libphonenumber-js";
import { ReactNode, useState } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
  ControllerFieldState,
  ControllerRenderProps,
} from "react-hook-form";
import { FormFieldWrapper } from "./form-wrapper";

interface FormPhoneInputProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  defaultCountry?: CountryCode;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  required?: boolean;
  locale?: "fr" | "en";
  invalidPhoneNumberMessage?: string;
  description?: string | ReactNode;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

/**
 * Composant de champ téléphone international pour les formulaires utilisant React Hook Form
 */
export default function FormPhoneInput<T extends FieldValues>({
  form,
  name,
  label,
  defaultCountry = "CM", // Cameroun par défaut
  disabled = false,
  className = "",
  placeholder = "",
  required = false,
  locale = "fr",
  invalidPhoneNumberMessage = "Numéro de téléphone invalide",
  description,
  rules,
}: FormPhoneInputProps<T>) {
  const [isValidPhoneNumber, setIsValidPhoneNumber] = useState(true);

  // Combiner les règles personnalisées avec celles fournies
  const combinedRules = {
    ...rules,
    validate: {
      ...(rules?.validate || {}),
      possiblePhoneNumber: (value: string) => {
        if (!value) return true;
        if (!isValidPhoneNumber) return invalidPhoneNumberMessage;
        return isPossiblePhoneNumber(value) || invalidPhoneNumberMessage;
      },
    },
  };

  return (
    <FormFieldWrapper
      form={form}
      name={name}
      label={label}
      description={description}
      required={required}
      rules={combinedRules}
      className={className}
      renderField={(
        field: ControllerRenderProps<T, Path<T>>,
        fieldState?: ControllerFieldState
      ) => (
        <FormControl>
          <PhoneInput
            value={field.value}
            onChange={(value) => field.onChange(value)}
            onBlur={field.onBlur}
            defaultCountry={defaultCountry}
            disabled={disabled}
            placeholder={placeholder}
            lang={locale}
            getIsValidPhoneNumber={setIsValidPhoneNumber}
            hasError={!!fieldState?.error}
          />
        </FormControl>
      )}
    />
  );
}
