import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { isoToEmoji } from "./helpers";

export type Option = Record<"value" | "label", string> & Record<string, string>;

type ComboboxCountryInputProps<T extends Option> = {
  value: T;
  onValueChange: (value: T) => void;
  options: T[];
  renderOption: ({
    option,
    isSelected,
  }: {
    option: T;
    isSelected: boolean;
  }) => React.ReactNode;
  renderValue: (option: T) => string;
  emptyMessage: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  hasError?: boolean;
};

function CountryCommandList<T extends Option>({
  options,
  value,
  renderValue,
  renderOption,
  onValueChange,
  onClose,
  placeholder,
  emptyMessage,
}: {
  options: T[];
  value: T;
  renderValue: (option: T) => string;
  renderOption: ({
    option,
    isSelected,
  }: {
    option: T;
    isSelected: boolean;
  }) => React.ReactNode;
  onValueChange: (value: T) => void;
  onClose: () => void;
  placeholder?: string;
  emptyMessage: string;
}) {
  return (
    <Command>
      <CommandInput placeholder={placeholder} className="h-9" />
      <CommandEmpty>{emptyMessage}</CommandEmpty>
      <CommandList>
        <CommandGroup className="mt-2 h-full max-h-48 overflow-auto p-0 [&_div[cmdk-group-items]]:flex [&_div[cmdk-group-items]]:flex-col [&_div[cmdk-group-items]]:gap-1">
          {options.map((option) => {
            const isSelected = value.value === option.value;

            return (
              <CommandItem
                key={option.value}
                value={renderValue(option)}
                onSelect={() => {
                  onValueChange(option);
                  onClose();
                }}
              >
                {renderOption({ option, isSelected: isSelected })}
                {isSelected ? <Check className="ml-auto mr-2 h-4 w-4" /> : null}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function ComboboxCountryInput<T extends Option>({
  value,
  onValueChange,
  options,
  renderOption,
  renderValue,
  placeholder,
  emptyMessage,
  disabled = false,
  hasError = false,
}: ComboboxCountryInputProps<T>) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const triggerContent = (
    <button
      role="button"
      aria-expanded={open}
      disabled={disabled}
      className={cn(
        "inline-flex h-12 items-center justify-between self-start rounded-md border-2 border-input bg-white px-4 py-2 text-sm font-medium ring-offset-white transition-colors hover:bg-stone-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        hasError && "ring-destructive/20 dark:ring-destructive/40 border-destructive"
      )}
      type="button"
    >
      {value.value ? isoToEmoji(value.value) : "Select country..."}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </button>
  );

  if (!isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{triggerContent}</PopoverTrigger>
        <PopoverContent className="w-[200px] p-2 pb-0" align="start">
          <CountryCommandList
            options={options}
            value={value}
            renderValue={renderValue}
            renderOption={renderOption}
            onValueChange={onValueChange}
            onClose={() => setOpen(false)}
            placeholder={placeholder}
            emptyMessage={emptyMessage}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{triggerContent}</DrawerTrigger>
      <DrawerContent>
        <div className="px-4 py-6">
          <DrawerTitle className="text-lg font-medium mb-4">
            Sélectionner un pays
          </DrawerTitle>
          <CountryCommandList
            options={options}
            value={value}
            renderValue={renderValue}
            renderOption={renderOption}
            onValueChange={onValueChange}
            onClose={() => setOpen(false)}
            placeholder={placeholder}
            emptyMessage={emptyMessage}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
