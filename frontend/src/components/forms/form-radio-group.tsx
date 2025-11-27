"use client";

import { FormControl } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ReactNode } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { FormFieldWrapper } from "./form-wrapper";

export interface RadioOption {
  value: string;
  label: string;
}

interface FormRadioGroupProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  options: RadioOption[];
  disabled?: boolean;
  className?: string;
  optionsClassName?: string;
  required?: boolean;
  description?: string | ReactNode;
  orientation?: "horizontal" | "vertical";
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

export default function FormRadioGroup<T extends FieldValues>({
  form,
  name,
  label,
  options,
  className = "",
  optionsClassName = "space-y-4",
  required = false,
  description,
  rules,
}: FormRadioGroupProps<T>) {
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
          <RadioGroup
            defaultValue={field.value}
            className={optionsClassName}
            onValueChange={field.onChange}
            value={field.value}
          >
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={`${name}-${option.value}`}
                  className="h-[26px] w-[26px]"
                />
                <Label htmlFor={`${name}-${option.value}`} className="text-lg">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </FormControl>
      )}
    />
  );
}
