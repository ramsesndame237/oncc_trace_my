"use client";

import { FormControl } from "@/components/ui/form";
import { useDateLocale } from "@/hooks/use-date-locale";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { InputDatePicker } from "../ui/input-date-picker";
import { FormFieldWrapper } from "./form-wrapper";

interface FormDatePickerProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: {
    before?: Date;
    after?: Date;
  };
  required?: boolean;
  typeCalendar?: "v1" | "v2";
  description?: string | ReactNode;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
  locale?: string;
}

export default function FormDatePicker<T extends FieldValues>({
  form,
  name,
  label,
  disabled = false,
  className = "",
  placeholder = "Pick a date",
  minDate = new Date(1900, 0, 1),
  maxDate = new Date(),
  disabledDates,
  required = false,
  typeCalendar = "v1",
  description,
  rules,
  locale,
}: FormDatePickerProps<T>) {
  // Obtenir la locale date-fns basée sur la langue i18next
  const dateLocale = useDateLocale(locale);

  // Récupérer l'état d'erreur pour le champ
  const fieldError = form.formState.errors[name];

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
          <InputDatePicker
            value={field.value ? new Date(field.value) : undefined}
            onChange={(date) => {
              // Convertir la Date en string YYYY-MM-DD en fuseau local
              if (date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const localDateString = `${year}-${month}-${day}`;
                field.onChange(localDateString);
              } else {
                field.onChange("");
              }
            }}
            disabled={disabled}
            className={cn(className, fieldError && "border-red-500 border-2")}
            placeholder={placeholder}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            typeCalendar={typeCalendar}
            locale={dateLocale}
          />
        </FormControl>
      )}
    />
  );
}
