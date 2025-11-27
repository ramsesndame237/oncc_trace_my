"use client";

import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { YearCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface InputYearPickerProps {
  value?: number;
  onChange?: (year: number | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function InputYearPicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Sélectionner une année",
  minDate = new Date(2000, 0, 1),
  maxDate = new Date(),
}: InputYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const createDateFromYear = (year?: number): Date | undefined => {
    if (!year) return undefined;
    const date = new Date();
    date.setFullYear(year);
    date.setMonth(0);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const [date, setDate] = useState<Date | undefined>(createDateFromYear(value));

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      onChange?.(selectedDate.getFullYear());
    } else {
      onChange?.(undefined);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full font-normal",
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
          size="input"
        >
          {value ? (
            <span className="font-normal text-sm">{value}</span>
          ) : (
            <span className="text-gray-500 font-normal text-sm">
              {placeholder}
            </span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <YearCalendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          startMonth={minDate}
          endMonth={maxDate}
          disabled={(date) => {
            if (date < minDate || date > maxDate) return true;
            return false;
          }}
          defaultMonth={date || new Date()}
          locale={fr}
        />
      </PopoverContent>
    </Popover>
  );
}
