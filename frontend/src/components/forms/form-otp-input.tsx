"use client";

import { FormControl } from "@/components/ui/form";
import { InputOTP } from "@/components/ui/input-otp";
import { ReactNode, useEffect } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { FormFieldWrapper } from "./form-wrapper";

interface FormOtpInputProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  length?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  description?: string | ReactNode;
  autoFocus?: boolean;
  position?: "center" | "start";
  inputMode?: "text" | "numeric";
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
  /**
   * Fonction appelée automatiquement quand l'input est complètement rempli
   */
  onComplete?: (value: string) => void;
}

/**
 * Composant de champ OTP pour les formulaires utilisant React Hook Form
 */
export default function FormOtpInput<T extends FieldValues>({
  form,
  name,
  label,
  length = 6,
  disabled = false,
  required = false,
  className = "",
  description,
  autoFocus = false,
  position = "start",
  inputMode = "numeric",
  rules,
  onComplete,
}: FormOtpInputProps<T>) {
  // Surveiller la valeur du champ et déclencher onComplete quand c'est rempli
  const watchedValue = form.watch(name);

  useEffect(() => {
    if (watchedValue && watchedValue.length === length && onComplete) {
      onComplete(watchedValue);
    }
  }, [watchedValue, length, onComplete]);

  const fieldState = form.getFieldState(name);

  return (
    <FormFieldWrapper
      form={form}
      name={name}
      label={label}
      description={description}
      required={required}
      rules={rules}
      className={className}
      renderField={(field) => (
        <FormControl>
          <InputOTP
            length={length}
            autoFocus={autoFocus}
            value={field.value}
            onChange={field.onChange as (value: string) => void}
            onBlur={field.onBlur}
            name={field.name}
            disabled={disabled}
            error={!!fieldState.error}
            position={position}
            inputMode={inputMode}
          />
        </FormControl>
      )}
    />
  );
}
