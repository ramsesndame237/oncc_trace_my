"use client";

import { FormControl } from "@/components/ui/form";
import { ReactNode } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { InputSelect } from "../ui/input-select";
import { FormFieldWrapper } from "./form-wrapper";

interface FormSelectProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  placeholder?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  required?: boolean;
  description?: string | ReactNode;
  emptyMessage?: string;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

export default function FormSelect<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "Sélectionner",
  options,
  disabled = false,
  className = "",
  triggerClassName = "",
  required = false,
  description,
  emptyMessage = "Aucun",
  rules,
}: FormSelectProps<T>) {
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
          <InputSelect
            options={options}
            placeholder={placeholder}
            disabled={disabled}
            emptyMessage={emptyMessage}
            onValueChange={field.onChange}
            value={field.value || ""}
            className={triggerClassName}
          />
        </FormControl>
      )}
    />
  );
}
