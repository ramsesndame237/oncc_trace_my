import { useDebounce } from "@/hooks/use-debounce";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
}

export interface AsyncSelectProps<T> {
  /** Async function to fetch options */
  fetcher: (query?: string) => Promise<T[]>;
  /** Preload all data ahead of time */
  preload?: boolean;
  /** Function to filter options */
  filterFn?: (option: T, query: string) => boolean;
  /** Function to render each option */
  renderOption: (option: T) => React.ReactNode;
  /** Function to get the value from an option */
  getOptionValue: (option: T) => string;
  /** Function to get the display value for the selected option */
  getDisplayValue: (option: T) => React.ReactNode;
  /** Custom not found message */
  notFound?: React.ReactNode;
  /** Custom loading skeleton */
  loadingSkeleton?: React.ReactNode;
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Label for the select field */
  label: string;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Placeholder text for the search input */
  placeholderSearch?: string;
  /** Disable the entire select */
  disabled?: boolean;
  /** Custom width for the popover */
  // width?: string | number;
  /** Custom class names */
  className?: string;
  /** Custom trigger button class names */
  triggerClassName?: string;
  /** Custom no results message */
  noResultsMessage?: string;
  /** Allow clearing the selection */
  clearable?: boolean;
}

export function AsyncSelect<T>({
  fetcher,
  preload,
  filterFn,
  renderOption,
  getOptionValue,
  getDisplayValue,
  notFound,
  loadingSkeleton,
  label,
  placeholder = "Select...",
  placeholderSearch = "Search...",
  value,
  onChange,
  disabled = false,
  className,
  triggerClassName,
  noResultsMessage,
  clearable = true,
}: AsyncSelectProps<T>) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState(value);
  const [selectedOption, setSelectedOption] = useState<T | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, preload ? 0 : 300);
  const [originalOptions, setOriginalOptions] = useState<T[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    setSelectedValue(value);
  }, [value]);

  // Initialize selectedOption when options are loaded and value exists
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find((opt) => getOptionValue(opt) === value);
      if (option) {
        setSelectedOption(option);
      }
    }
  }, [value, options, getOptionValue]);

  // Effect for initial fetch
  useEffect(() => {
    const initializeOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        // If we have a value, use it for the initial search
        const data = await fetcher(value);
        setOriginalOptions(data);
        setOptions(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch options"
        );
      } finally {
        setLoading(false);
      }
    };

    if (!mounted) {
      initializeOptions();
    }
  }, [mounted, fetcher, value]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetcher(debouncedSearchTerm);
        setOriginalOptions(data);
        setOptions(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch options"
        );
      } finally {
        setLoading(false);
      }
    };

    if (!mounted) {
      fetchOptions();
    } else if (!preload) {
      fetchOptions();
    } else if (preload) {
      if (debouncedSearchTerm) {
        setOptions(
          originalOptions.filter((option) =>
            filterFn ? filterFn(option, debouncedSearchTerm) : true
          )
        );
      } else {
        setOptions(originalOptions);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, debouncedSearchTerm, mounted, preload, filterFn]);

  const handleSelect = useCallback(
    (currentValue: string) => {
      const newValue =
        clearable && currentValue === selectedValue ? "" : currentValue;
      setSelectedValue(newValue);
      setSelectedOption(
        options.find((option) => getOptionValue(option) === newValue) || null
      );
      onChange(newValue);
      setOpen(false);
    },
    [selectedValue, onChange, clearable, options, getOptionValue]
  );

  const trigger = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn(
        "justify-between !h-10 border-2 hover:bg-white",
        disabled && "opacity-50 cursor-not-allowed",
        triggerClassName
      )}
      disabled={disabled}
    >
      {selectedOption ? (
        <span className="font-normal text-sm">
          {getDisplayValue(selectedOption)}
        </span>
      ) : (
        <span className="text-gray-500 font-normal text-sm">{placeholder}</span>
      )}
      <ChevronDown size={10} />
    </Button>
  );

  const content = (
    <SuggestionItem
      label={label}
      options={options}
      error={error}
      renderOption={renderOption}
      getOptionValue={getOptionValue}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      handleSelect={handleSelect}
      selectedValue={selectedValue}
      placeholderSearch={placeholderSearch}
      loading={loading}
      loadingSkeleton={loadingSkeleton}
      notFound={notFound}
      noResultsMessage={noResultsMessage}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="min-h-[80vh] p-0">
          <DrawerHeader className="py-2 border-b">
            <DrawerTitle className="flex items-center justify-between">
              <span>{label}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0 popover-content-width-full border-foreground",
          className
        )}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

interface SuggestionItemProps<T> {
  label: string;
  loading?: boolean;
  options: T[];
  error: string | null;
  loadingSkeleton?: React.ReactNode;
  notFound?: React.ReactNode;
  noResultsMessage?: string;
  renderOption: (option: T) => React.ReactNode;
  getOptionValue: (option: T) => string;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  handleSelect: (value: string) => void;
  selectedValue: string;
  placeholderSearch?: string;
}

function SuggestionItem<T>({
  label,
  loading,
  options,
  error,
  loadingSkeleton,
  notFound,
  noResultsMessage,
  renderOption,
  getOptionValue,
  searchTerm,
  setSearchTerm,
  handleSelect,
  selectedValue,
  placeholderSearch,
}: SuggestionItemProps<T>) {
  return (
    <Command shouldFilter={false}>
      <div className="relative w-full">
        <CommandInput
          placeholder={placeholderSearch}
          value={searchTerm}
          onValueChange={(value) => {
            setSearchTerm(value);
          }}
        />
        {loading && options.length > 0 && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>
      <CommandList className="max-h-[65vh] overflow-y-auto">
        {error && (
          <div className="p-4 text-destructive text-center">{error}</div>
        )}
        {loading &&
          options.length === 0 &&
          (loadingSkeleton || <DefaultLoadingSkeleton />)}
        {!loading &&
          !error &&
          options.length === 0 &&
          (notFound || (
            <CommandEmpty>
              {noResultsMessage ?? `No ${label.toLowerCase()} found.`}
            </CommandEmpty>
          ))}
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              key={getOptionValue(option)}
              value={getOptionValue(option)}
              onSelect={handleSelect}
            >
              {renderOption(option)}
              <Check
                className={cn(
                  "ml-auto h-3 w-3",
                  selectedValue === getOptionValue(option)
                    ? "opacity-100"
                    : "opacity-0"
                )}
              />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function DefaultLoadingSkeleton() {
  return (
    <CommandGroup>
      {[1, 2, 3].map((i) => (
        <CommandItem key={i} disabled>
          <div className="flex items-center gap-2 w-full">
            <div className="h-6 w-6 rounded-full animate-pulse bg-muted" />
            <div className="flex flex-col flex-1 gap-1">
              <div className="h-4 w-24 animate-pulse bg-muted rounded" />
              <div className="h-3 w-16 animate-pulse bg-muted rounded" />
            </div>
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
