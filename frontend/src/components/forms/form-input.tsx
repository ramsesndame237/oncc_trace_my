"use client";

import { FormControl, useFormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ReactNode } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { FormFieldWrapper } from "./form-wrapper";

interface FormInputProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  description?: string | ReactNode;
  unit?: string;
  showUnit?: boolean;
  unitPosition?: "left" | "right";
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

// Fonction utilitaire pour calculer le padding dynamiquement
const calculatePadding = (unit: string): string => {
  if (!unit) return "";

  // Estimation approximative : 1 caractère ≈ 0.6rem en text-base
  const baseWidth = 1.5; // padding de base en rem
  const charWidth = 0.6; // largeur approximative d'un caractère en rem
  const totalWidth = baseWidth + unit.length * charWidth;

  return `${Math.max(3, Math.ceil(totalWidth))}rem`;
};

// Composant interne pour gérer l'état d'erreur
interface InputWithUnitInternalProps {
  field: {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    name: string;
  };
  type: string;
  placeholder: string;
  disabled: boolean;
  className: string;
  unit: string;
  showUnit: boolean;
  unitPosition: "left" | "right";
  leftPadding: string;
  rightPadding: string;
}

const InputWithUnitInternal: React.FC<InputWithUnitInternalProps> = ({
  field,
  type,
  placeholder,
  disabled,
  className,
  unit,
  showUnit,
  unitPosition,
  leftPadding,
  rightPadding,
}) => {
  // Hook pour récupérer l'état d'erreur du formulaire
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <div className="relative">
      {showUnit && unit && unitPosition === "left" && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground font-semibold pointer-events-none z-10 text-center whitespace-nowrap">
          {unit}
        </div>
      )}
      <Input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        style={{
          paddingLeft: leftPadding || undefined,
          paddingRight: rightPadding || undefined,
        }}
        // Transmission manuelle des attributs pour le bon fonctionnement avec React Hook Form
        id={formItemId}
        aria-describedby={
          !error
            ? `${formDescriptionId}`
            : `${formDescriptionId} ${formMessageId}`
        }
        aria-invalid={!!error}
        {...field}
      />
      {showUnit && unit && unitPosition === "right" && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground font-semibold pointer-events-none text-center whitespace-nowrap">
          {unit}
        </div>
      )}
    </div>
  );
};

export default function FormInput<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "",
  type = "text",
  disabled = false,
  className = "",
  required = false,
  description,
  unit = "",
  showUnit = false,
  unitPosition = "right",
  rules,
}: FormInputProps<T>) {
  // Calcul du padding dynamique
  const leftPadding =
    showUnit && unit && unitPosition === "left" ? calculatePadding(unit) : "";
  const rightPadding =
    showUnit && unit && unitPosition === "right" ? calculatePadding(unit) : "";

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
          <InputWithUnitInternal
            field={field}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            unit={unit}
            showUnit={showUnit}
            unitPosition={unitPosition}
            leftPadding={leftPadding}
            rightPadding={rightPadding}
          />
        </FormControl>
      )}
    />
  );
}
