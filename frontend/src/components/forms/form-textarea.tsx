"use client";

import { FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ReactNode } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { FormFieldWrapper } from "./form-wrapper";

interface FormTextareaProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  description?: string | ReactNode;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

export default function FormTextarea<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "",
  disabled = false,
  className = "",
  required = false,
  description,
  rules,
}: FormTextareaProps<T>) {
  return (
    <FormFieldWrapper
      form={form}
      name={name}
      label={label}
      description={description}
      required={required}
      rules={rules}
      renderField={(field) => (
        <FormControl>
          <Textarea
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            {...field}
          />
        </FormControl>
      )}
    />
  );
}
