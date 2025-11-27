"use client";

import { FormControl } from "@/components/ui/form";
import { InputYearPicker } from "@/components/ui/input-year-picker";
import { ReactNode } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { FormFieldWrapper } from "./form-wrapper";

interface FormYearPickerProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  placeholder?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  required?: boolean;
  description?: string | ReactNode;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

export function FormYearPicker<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  className,
  disabled,
  required = false,
  description,
  minDate,
  maxDate,
  rules,
}: FormYearPickerProps<T>) {
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
          <InputYearPicker
            placeholder={placeholder}
            minDate={minDate}
            maxDate={maxDate}
            disabled={disabled}
            value={field.value}
            onChange={(date) => {
              if (date) {
                // Ne retourner que l'année
                field.onChange(date);
              } else {
                field.onChange(undefined);
              }
            }}
          />
        </FormControl>
      )}
    />
  );
}
