"use client";

import { FormControl } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import { FormFieldWrapper } from "./form-wrapper";

interface FormTimePickerProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  className?: string;
  disabled?: boolean;
  locale?: "fr" | "en";
  required?: boolean;
  placeholder?: string;
  description?: string | ReactNode;
  minHour?: number;
  maxHour?: number;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
}

const timeLabels = {
  fr: {
    format: (hour: number, minute: string) =>
      `${hour.toString().padStart(2, "0")}h${minute}`,
  },
  en: {
    format: (hour: number, minute: string) => {
      const period = hour < 12 ? "AM" : "PM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minute} ${period}`;
    },
  },
};

export function FormTimePicker<T extends FieldValues>({
  form,
  name,
  label,
  className,
  disabled,
  locale = "fr",
  required = false,
  placeholder = "Sélectionner une heure",
  description,
  minHour = 0,
  maxHour = 23,
  rules,
}: FormTimePickerProps<T>) {
  const formatTimeDisplay = (timeValue: string | undefined) => {
    if (!timeValue) return "";
    const [hours, minutes] = timeValue.split(":");
    return timeLabels[locale].format(parseInt(hours), minutes);
  };

  // Normaliser la valeur pour supporter HH:mm et HH:mm:ss
  const normalizeTimeValue = (value: string | undefined) => {
    if (!value) return value;
    // Si la valeur contient des secondes (HH:mm:ss), les supprimer
    const parts = value.split(":");
    if (parts.length === 3) {
      return `${parts[0]}:${parts[1]}`;
    }
    return value;
  };

  return (
    <FormFieldWrapper
      form={form}
      name={name}
      label={label}
      description={description}
      required={required}
      rules={rules}
      className={cn("flex flex-col", className)}
      renderField={(field) => (
        <Select
          value={normalizeTimeValue(field.value)}
          onValueChange={(value) => {
            const normalizedValue = normalizeTimeValue(value);
            const normalizedFieldValue = normalizeTimeValue(field.value);

            if (normalizedValue === normalizedFieldValue) {
              field.onChange(undefined);
              return;
            }
            // Ajouter les secondes :00 pour correspondre au format de la base de données
            field.onChange(`${value}:00`);
          }}
          disabled={disabled}
        >
          <FormControl>
            <SelectTrigger className="!h-12 border-2 font-normal focus:ring-0 w-[var(--radix-select-trigger-width)] focus:ring-offset-0">
              <SelectValue placeholder={placeholder}>
                {formatTimeDisplay(field.value)}
              </SelectValue>
            </SelectTrigger>
          </FormControl>
          <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[--radix-select-content-available-height]">
            <ScrollArea className="h-[15rem]">
              {Array.from({ length: 96 }).map((_, i) => {
                const hour = Math.floor(i / 4);
                const minute = ((i % 4) * 15).toString().padStart(2, "0");
                const timeValue = `${hour
                  .toString()
                  .padStart(2, "0")}:${minute}`;
                const displayTime = timeLabels[locale].format(hour, minute);

                // Filtrer les heures en dehors de la plage autorisée
                // maxHour est exclusif : avec maxHour=18, on s'arrête à 17h45
                if (hour < minHour || hour >= maxHour) {
                  return null;
                }

                return (
                  <SelectItem key={i} value={timeValue}>
                    {displayTime}
                  </SelectItem>
                );
              })}
            </ScrollArea>
          </SelectContent>
        </Select>
      )}
    />
  );
}
