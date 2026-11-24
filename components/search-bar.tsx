"use client";

import * as React from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { AddressSearchItem } from "@/lib/graphql/queries";

export interface SearchBarProps {
  /** Current value for controlled usage */
  value?: string;
  /** Default value for uncontrolled usage */
  defaultValue?: string;
  /** Callback fired whenever the search input value changes */
  onChange?: (value: string) => void;
  /** Callback fired when search is submitted via Enter */
  onSearch?: (query: string) => void;
  /** Callback fired when an address item is selected from the command list */
  onSelectItem?: (item: AddressSearchItem) => void;
  /** Callback fired when the clear button is clicked */
  onClear?: () => void;
  /** Address items to render inside the command dropdown */
  items?: AddressSearchItem[];
  /** Shows a loading indicator */
  loading?: boolean;
  /** Error object if search failed */
  error?: Error | null;
  /** Placeholder text for the command input */
  placeholder?: string;
  /** Message displayed when no results match */
  emptyMessage?: string;
  /** Additional class name for the outer Command container */
  className?: string;
  /** Disable the input */
  disabled?: boolean;
}

export function SearchBar({
  value: controlledValue,
  defaultValue = "",
  onChange,
  onSearch,
  onSelectItem,
  onClear,
  items = [],
  loading = false,
  error = null,
  placeholder = "Search by address...",
  emptyMessage = "No matching addresses found.",
  className,
  disabled = false,
}: SearchBarProps) {
  const isControlled = controlledValue !== undefined;
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const currentValue = isControlled ? controlledValue : uncontrolledValue;

  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside the command menu
  React.useEffect(() => {
    const handlePointerDownOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
    };
  }, []);

  const handleValueChange = (nextValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(nextValue);
    }
    onChange?.(nextValue);
    setOpen(Boolean(nextValue.trim()));
  };

  const handleSelect = (item: AddressSearchItem) => {
    if (!isControlled) {
      setUncontrolledValue(item.address_line1);
    }
    setOpen(false);
    onSelectItem?.(item);
  };

  const handleClear = () => {
    if (!isControlled) {
      setUncontrolledValue("");
    }
    setOpen(false);
    onClear?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter" && !open && currentValue.trim()) {
      onSearch?.(currentValue);
      setOpen(true);
    }
  };

  const hasQuery = Boolean(currentValue && currentValue.trim().length > 0);
  const showDropdown = open && hasQuery;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Command
        shouldFilter={false}
        className="rounded-xl border border-border/80 bg-popover/95 shadow-lg backdrop-blur-md"
      >
        <div className="relative flex items-center">
          <div className="flex-1 [&_div[data-slot=command-input-wrapper]]:p-1">
            <CommandInput
              value={currentValue}
              onValueChange={handleValueChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (hasQuery) {
                  setOpen(true);
                }
              }}
              placeholder={placeholder}
              disabled={disabled}
              className="pr-12"
            />
          </div>

          <div className="absolute right-3 flex items-center gap-1">
            {loading && (
              <Loader2
                aria-hidden="true"
                className="size-3.5 animate-spin text-primary"
              />
            )}

            {hasQuery && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search input"
                className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {showDropdown && (
          <CommandList className="border-t border-border/60 pt-1">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Searching addresses...</span>
              </div>
            ) : error ? (
              <div className="py-4 text-center text-xs text-destructive">
                Failed to search addresses. Please try again.
              </div>
            ) : (
              <>
                <CommandEmpty
                  tabIndex={-1}
                  aria-disabled="true"
                  className="pointer-events-none select-none py-4 text-center text-xs text-muted-foreground"
                >
                  {emptyMessage}
                </CommandEmpty>
                {items.length > 0 && (
                  <CommandGroup heading="Addresses">
                    {items.map((item) => (
                      <CommandItem
                        key={item.parcel_id}
                        value={`${item.address_line1}-${item.parcel_id}`}
                        onSelect={() => handleSelect(item)}
                        className="cursor-pointer py-2"
                      >
                        <MapPin className="size-4 shrink-0 text-muted-foreground" />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium text-foreground">
                            {item.address_line1}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            New York, NY
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
}

export default SearchBar;
