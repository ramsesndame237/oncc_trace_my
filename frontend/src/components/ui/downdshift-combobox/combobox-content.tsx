import {
  Children,
  type ComponentPropsWithoutRef,
  isValidElement,
  type ReactElement,
  useEffect,
  useMemo,
} from "react";

import { PopoverContent } from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { ScrollArea } from "../scroll-area";
import { ComboboxItem, type ComboboxItemProps } from "./combobox-item";
import { useComboboxContext } from "./context";

export const ComboboxContent = ({
  onOpenAutoFocus,
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof PopoverContent>) => {
  const { getMenuProps, isOpen, openedOnce, onItemsChange } =
    useComboboxContext();

  const childItems = useMemo(
    () =>
      Children.toArray(children).filter(
        (child): child is ReactElement<ComboboxItemProps> =>
          isValidElement(child) && child.type === ComboboxItem
      ),
    [children]
  );

  useEffect(() => {
    onItemsChange?.(
      childItems.map((child) => ({
        disabled: child.props.disabled,
        label: child.props.label,
        value: child.props.value,
      }))
    );
  }, [childItems, onItemsChange]);

  return (
    <PopoverContent
      {...props}
      forceMount
      asChild
      align="start"
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        onOpenAutoFocus?.(e);
      }}
      className={cn(
        "p-0 [[data-radix-popper-content-wrapper]:has(&)]:h-0",
        !isOpen && "pointer-events-none",
        !openedOnce && "hidden",
        className
      )}
      style={{
        width: 'var(--radix-popper-anchor-width)',
        minWidth: 'var(--radix-popper-anchor-width)',
        maxWidth: 'var(--radix-popper-anchor-width)'
      }}
      {...getMenuProps?.({}, { suppressRefError: true })}
    >
      <ScrollArea className="[&>[data-radix-scroll-area-viewport]]:max-h-80 [&>[data-radix-scroll-area-viewport]]:p-1">
        {children}
      </ScrollArea>
    </PopoverContent>
  );
};
