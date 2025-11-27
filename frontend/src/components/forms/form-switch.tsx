"use client";

import { FormControl } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { ReactNode } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { FormFieldWrapper } from "./form-wrapper";

interface FormSwitchProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  description?: string | ReactNode;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

export default function FormSwitch<T extends FieldValues>({
  form,
  name,
  label,
  disabled = false,
  className = "",
  required = false,
  description,
  rules,
}: FormSwitchProps<T>) {
  return (
    <FormFieldWrapper
      form={form}
      name={name}
      label={label}
      description={description}
      required={required}
      rules={rules}
      layout="horizontal"
      className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"
      renderField={(field) => (
        <FormControl>
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={disabled}
            className={className}
          />
        </FormControl>
      )}
    />
  );
}
