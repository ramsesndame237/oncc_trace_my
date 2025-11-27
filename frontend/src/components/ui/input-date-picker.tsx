"use client";

import { format, Locale } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar, CalendarV2 } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface InputDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  time?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: {
    before?: Date;
    after?: Date;
  };
  locale?: Locale;
  typeCalendar?: "v1" | "v2";
}

export function InputDatePicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Pick a date",
  minDate = new Date(2000, 0, 1),
  maxDate = new Date(),
  disabledDates,
  locale = fr,
  typeCalendar = "v1",
}: InputDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(value);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      onChange?.(selectedDate);
    } else {
      setDate(undefined);
      onChange?.(undefined);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full font-normal !h-12 hover:bg-transparent !text-foreground !text-lg",
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
          size="input"
        >
          {value ? (
            <span className="font-normal text-sm">{`${format(value, "PPP", {
              locale: locale,
            })}`}</span>
          ) : (
            <span className="text-gray-500 font-normal text-sm">
              {placeholder}
            </span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        {typeCalendar === "v1" && (
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={date || value}
            onSelect={handleSelect}
            onDayClick={() => setIsOpen(false)}
            startMonth={minDate}
            endMonth={maxDate}
            disabled={(date) => {
              if (date < minDate || date > maxDate) return true;
              if (disabledDates?.before && date < disabledDates.before)
                return true;
              if (disabledDates?.after && date > disabledDates.after)
                return true;
              return false;
            }}
            defaultMonth={value}
            locale={locale}
          />
        )}

        {typeCalendar === "v2" && (
          <CalendarV2
            mode="single"
            selected={date || value}
            onSelect={handleSelect}
            onDayClick={() => setIsOpen(false)}
            startMonth={minDate}
            endMonth={maxDate}
            disabled={(date) => {
              if (date < minDate || date > maxDate) return true;
              if (disabledDates?.before && date < disabledDates.before)
                return true;
              if (disabledDates?.after && date > disabledDates.after)
                return true;
              return false;
            }}
            defaultMonth={value}
            locale={locale}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
