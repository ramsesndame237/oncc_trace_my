"use client";

import { FormControl } from "@/components/ui/form";
import {
  AsyncSelect,
  type AsyncSelectProps,
} from "@/components/ui/select-async";
import { ReactNode } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { FormFieldWrapper } from "./form-wrapper";

interface FormSelectAsyncProps<T extends FieldValues, TOption>
  extends Omit<AsyncSelectProps<TOption>, "value" | "onChange" | "label"> {
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

export default function FormSelectAsync<T extends FieldValues, TOption>({
  form,
  name,
  label,
  disabled = false,
  className = "",
  required = false,
  description,
  rules,
  ...props
}: FormSelectAsyncProps<T, TOption>) {
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
          <AsyncSelect
            {...props}
            label={label ? String(typeof label === "string" ? label : "") : ""}
            value={field.value}
            onChange={field.onChange}
            disabled={disabled}
            className={className}
          />
        </FormControl>
      )}
    />
  );
}
