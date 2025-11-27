"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { CheckIcon, ChevronDownIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./button";
import { Option } from "./combobox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
} from "./downdshift-combobox";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";

type AutoCompleteProps = {
  options: Option[];
  emptyMessage?: string;
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  hasError?: boolean;
};

export const AutoComplete = ({
  options,
  placeholder = "Selectionnez une option",
  emptyMessage = "Aucun resultat trouvé",
  value,
  onValueChange,
  disabled,
  label,
  hasError = false,
}: AutoCompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const [selectedValue, setSelectedValue] = useState<string | undefined>(
    value ?? undefined
  );

  const handleChange = (change: string | null) => {
    const newValue = change ?? undefined;
    setSelectedValue(newValue);
    onValueChange?.(newValue);
  };

  useEffect(() => {
    if (value !== selectedValue) {
      setSelectedValue(value ?? undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-start hover:bg-transparent relative !h-12 ${
              hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            size="input"
          >
            {selectedValue ? (
              <span className="font-normal">
                {
                  options.find((option) => option.value === selectedValue)
                    ?.label
                }
              </span>
            ) : (
              <span className="text-gray-500 font-normal text-sm">
                {placeholder}
              </span>
            )}
            <div className="pointer-events-none absolute inset-y-0 end-3 grid h-full place-items-center">
              <ChevronDownIcon className="size-4" />
            </div>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="min-h-[80vh] p-0">
          <DrawerHeader className="py-2">
            <DrawerTitle className="flex items-center justify-between">
              <span>{label || placeholder}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerTitle>
          </DrawerHeader>
          <div className="mt-4 border-t w-full">
            <Command>
              <CommandInput placeholder={placeholder} />
              <CommandList className="max-h-[65vh] overflow-y-auto">
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((status) => (
                    <CommandItem
                      key={status.value}
                      value={status.label}
                      keywords={[status.label, status.value]}
                      onSelect={() => {
                        if (status.value === selectedValue) {
                          handleChange(null);
                        } else {
                          handleChange(status.value);
                        }
                        setIsOpen(false);
                      }}
                      className="relative"
                    >
                      <span>{status.label}</span>
                      {status.value === selectedValue && (
                        <span className="absolute right-2 flex size-3.5 items-center justify-center">
                          <CheckIcon className="size-4" />
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Combobox value={selectedValue ?? null} onValueChange={handleChange}>
      <ComboboxInput
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full ${
          hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        }`}
      />
      <ComboboxContent
        onOpenAutoFocus={() => {
          setIsOpen(!isOpen);
        }}
      >
        {options.map((option) => (
          <ComboboxItem
            key={option.value}
            value={option.value}
            label={option.label}
            className="flex flex-row items-center gap-2 px-3 py-2 hover:bg-slate-100 w-full"
          />
        ))}
        <ComboboxEmpty className="px-3 py-2 text-sm text-gray-500">
          {emptyMessage}
        </ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
};
