"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Option } from "@/types/type";

interface InputSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  hasError?: boolean;
}

export function InputSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className,
  emptyMessage,
  hasError = false,
}: InputSelectProps) {
  return (
    <Select onValueChange={onValueChange} value={value} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "!h-12 relative border-2 w-full",
          hasError ? "border-red-500 ring-red-500" : "border-input",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className="w-[var(--radix-select-trigger-width)] max-h-[--radix-select-content-available-height]"
        position="popper"
        align="center"
        side="bottom"
        sideOffset={4}
      >
        {options.length === 0 ? (
          <SelectItem value="__empty__" disabled>
            {emptyMessage}
          </SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={option.className}
            >
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
