"use client";

import { Option } from "@/components/ui/combobox";
import { FormControl, useFormField } from "@/components/ui/form";
import { ReactNode } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { AutoComplete } from "../ui/input-autocompletion";
import { FormFieldWrapper } from "./form-wrapper";

interface FormInputAutocompletionProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  options: Option[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string | ReactNode;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

// Composant interne pour gérer l'état d'erreur
interface AutoCompleteWithErrorProps {
  field: {
    value: string;
    onChange: (value: string | undefined) => void;
  };
  options: Option[];
  placeholder?: string;
  emptyMessage?: string;
  disabled: boolean;
}

const AutoCompleteWithErrorInternal: React.FC<AutoCompleteWithErrorProps> = ({
  field,
  options,
  placeholder,
  emptyMessage,
  disabled,
}) => {
  // Hook pour récupérer l'état d'erreur du formulaire
  const { error } = useFormField();

  return (
    <AutoComplete
      options={options}
      emptyMessage={emptyMessage}
      placeholder={placeholder}
      onValueChange={field.onChange}
      value={field.value}
      disabled={disabled}
      hasError={!!error}
    />
  );
};

export default function FormInputAutocompletion<T extends FieldValues>({
  form,
  name,
  label,
  options,
  placeholder,
  emptyMessage,
  disabled = false,
  required = false,
  description,
  rules,
}: FormInputAutocompletionProps<T>) {
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
          <AutoCompleteWithErrorInternal
            field={field}
            options={options}
            placeholder={placeholder}
            emptyMessage={emptyMessage}
            disabled={disabled}
          />
        </FormControl>
      )}
    />
  );
}
