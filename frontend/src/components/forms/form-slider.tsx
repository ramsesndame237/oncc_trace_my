"use client";

import { FormControl } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { ReactNode } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { FormFieldWrapper } from "./form-wrapper";

interface FormSliderProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  description?: string | ReactNode;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

export default function FormSlider<T extends FieldValues>({
  form,
  name,
  label,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className = "",
  required = false,
  description,
  showValue = false,
  valuePrefix = "",
  valueSuffix = "",
  rules,
}: FormSliderProps<T>) {
  // Surveiller la valeur actuelle pour l'affichage optionnel
  const value = form.watch(name);

  // Personnaliser le label pour inclure la valeur si nécessaire
  const customLabel = showValue ? (
    <div className="flex justify-between w-full">
      <span>{label}</span>
      <span className="text-sm text-muted-foreground">
        {valuePrefix}
        {value}
        {valueSuffix}
      </span>
    </div>
  ) : (
    label
  );

  return (
    <FormFieldWrapper
      form={form}
      name={name}
      label={customLabel}
      description={description}
      required={required}
      rules={rules}
      className="space-y-4"
      renderField={(field) => (
        <FormControl>
          <Slider
            min={min}
            max={max}
            step={step}
            value={[field.value]}
            onValueChange={(value: number[]) => field.onChange(value[0])}
            disabled={disabled}
            className={className}
          />
        </FormControl>
      )}
    />
  );
}
