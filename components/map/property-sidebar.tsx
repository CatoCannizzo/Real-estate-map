"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import {
  Building2,
  Calendar,
  DollarSign,
  ExternalLink,
  History,
  MapPin,
  Ruler,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyStreetViewCard } from "@/components/map/property-street-view-card";
import type { Property } from "@/components/map/property-type";

/** Props for the slide-out property detail sidebar */
export interface PropertySidebarProps {
  selectedId: string | null;
  property?: Property | null;
  loading?: boolean;
  onClose?: () => void;
  /** Optional environment override for testing; defaults to process.env.NODE_ENV !== "production" */
  isDevMode?: boolean;
}

export interface CardFieldItem {
  label: string;
  value?: string | number | null;
  /** Optional formatter applied only when `value` is present (non-null, non-empty) */
  format?: (val: never) => string;
}

export interface PropertyDetailCardProps {
  title: string;
  icon: LucideIcon;
  items: CardFieldItem[];
  footer?: ReactNode;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

// Formats a number to USD currency (rounded, no cents)
export function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return currencyFormatter.format(value);
}

// Formats a number with commas and an optional suffix like "sq ft"
export function formatNumber(value?: number | null, suffix = ""): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${numberFormatter.format(value)}${suffix}`;
}

// Formats a dollar amount per square foot (e.g. $450/sf)
export function formatPricePerSqFt(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${currencyFormatter.format(value)}/sf`;
}

// Formats a boolean flag to "Yes" / "No", falling back to "—" when missing
export function formatBoolean(value?: boolean | null): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return value ? "Yes" : "No";
}

// Checks if a field has a valid, non-empty value to display
function isValuePresent(value?: string | number | null): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (typeof value === "number" && Number.isNaN(value)) return false;
  return true;
}

/**
 * Reusable, data-driven sidebar card.
 * Conditionally renders only if at least one item has a present value (or a footer is provided).
 * Individual missing fields inside a visible card render as "—".
 */
export function PropertyDetailCard({
  title,
  icon: Icon,
  items,
  footer,
}: PropertyDetailCardProps) {
  const hasAnyData =
    items.some((item) => isValuePresent(item.value)) || Boolean(footer);

  if (!hasAnyData) {
    return null;
  }

  return (
    <Card size="sm">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-1.5 text-xs font-semibold">
          <Icon className="size-3.5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/50">
        {items.map((item) => {
          const present = isValuePresent(item.value);
          const displayValue = !present
            ? "—"
            : item.format
              ? item.format(item.value as never)
              : item.value;

          return (
            <div
              key={item.label}
              className="flex items-baseline justify-between gap-3 py-1 text-xs"
            >
              <span className="text-muted-foreground shrink-0">
                {item.label}
              </span>
              <span className="font-medium text-foreground text-right">
                {displayValue}
              </span>
            </div>
          );
        })}
        {footer && <div className="pt-2">{footer}</div>}
      </CardContent>
    </Card>
  );
}

/** Displays full parcel details, Street View imagery, building specs, valuation, and past sales in a sidebar */
export function PropertySidebar({
  selectedId,
  property,
  loading = false,
  onClose,
  isDevMode,
}: PropertySidebarProps) {
  const resolvedIsDevMode =
    isDevMode ?? process.env.NODE_ENV !== "production";
  const [devLiveStreetView, setDevLiveStreetView] = useState(false);
  const liveStreetViewSwitchId = useId();
  const liveStreetViewEnabled = resolvedIsDevMode ? devLiveStreetView : true;

  // Sorts sales transactions chronologically from newest to oldest
  const sortedSales = property?.salesHistory
    ? [...property.salesHistory].sort((a, b) => {
        const dateA = a.recordingDate ? new Date(a.recordingDate).getTime() : 0;
        const dateB = b.recordingDate ? new Date(b.recordingDate).getTime() : 0;
        return dateB - dateA;
      })
    : [];

  // Combines neighborhood, city, state, and zip into a clean subtitle
  const locationLine = [
    property?.neighborhood,
    property?.city,
    [property?.state, property?.zip].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  // Configuration for info cards (cards with only blank values are hidden automatically)
  const detailCards: PropertyDetailCardProps[] = property
    ? [
        {
          title: "Overview",
          icon: Calendar,
          items: [
            { label: "Property Type", value: property.propertyType },
            { label: "Year Built", value: property.yearBuilt },
            { label: "Development Status", value: property.developmentStatus },
          ],
        },
        {
          title: "Building & Lot",
          icon: Ruler,
          items: [
            {
              label: "Building Area",
              value: property.buildingSqFt,
              format: (v: number) => formatNumber(v, " sq ft"),
            },
            {
              label: "Lot Area",
              value: property.landSqFt,
              format: (v: number) => formatNumber(v, " sq ft"),
            },
            {
              label: "Total Units",
              value: property.totalUnits,
              format: (v: number) => formatNumber(v),
            },
            {
              label: "Stories",
              value: property.stories,
              format: (v: number) => formatNumber(v),
            },
          ],
        },
        {
          title: "Assessor Valuation",
          icon: DollarSign,
          items: [
            {
              label: "Total Assessed Value",
              value: property.assessedTotalValue,
              format: (v: number) => formatCurrency(v),
            },
            {
              label: "Land Value",
              value: property.assessedLandValue,
              format: (v: number) => formatCurrency(v),
            },
            {
              label: "Improvement Value",
              value: property.assessedBuildingValue,
              format: (v: number) => formatCurrency(v),
            },
          ],
          footer: property.assessorUrl ? (
            <a
              href={property.assessorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              County Assessor Record
              <ExternalLink className="size-3" />
            </a>
          ) : undefined,
        },
      ]
    : [];

  const [overviewCard, ...secondaryDetailCards] = detailCards;

  return (
    <aside className="w-80 shrink-0 h-full border-l border-border bg-card flex flex-col overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-border/60 bg-card/95 backdrop-blur">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Building2 aria-hidden="true" className="size-4 text-primary" />
            <h2 className="font-semibold text-sm tracking-tight">
              Property Details
            </h2>
          </div>
          {selectedId && onClose ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Clear selection"
              className="size-7 text-muted-foreground hover:text-foreground"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          ) : null}
        </div>

        {resolvedIsDevMode ? (
          <div className="flex items-center justify-between gap-2 border-t border-border/50 bg-muted/40 px-4 py-2 text-xs">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor={liveStreetViewSwitchId}
                className="cursor-pointer font-medium text-muted-foreground select-none"
              >
                Live Street View
              </label>
              <Badge
                variant={devLiveStreetView ? "default" : "secondary"}
                className="px-1.5 py-0 text-[10px]"
              >
                {devLiveStreetView ? "Live" : "Mock"}
              </Badge>
            </div>
            <input
              id={liveStreetViewSwitchId}
              type="checkbox"
              {...({ switch: "" } as InputHTMLAttributes<HTMLInputElement>)}
              checked={devLiveStreetView}
              onChange={(e) => setDevLiveStreetView(e.target.checked)}
              className="size-4 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </div>
        ) : null}
      </div>

      <div className="flex-1 p-4 space-y-4">
        {!selectedId ? (
          /* Empty state shown when no parcel has been selected */
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12 text-muted-foreground space-y-2">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No Property Selected
            </p>
            <p className="text-xs leading-relaxed">
              Click any parcel boundary on the map to inspect its details.
            </p>
          </div>
        ) : loading ? (
          /* Loading skeletons while parcel data is being fetched */
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <Badge variant="secondary" className="text-xs font-mono">
                {selectedId}
              </Badge>
            </div>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : !property ? (
          /* Fallback card if the parcel ID exists but has no records */
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Selected Parcel ID
              </p>
              <Badge variant="secondary" className="text-xs font-mono">
                {selectedId}
              </Badge>
            </div>
            <Card size="sm">
              <CardContent className="py-6 text-center text-xs text-muted-foreground">
                No data for this parcel
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Header Summary */}
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm leading-snug text-foreground">
                  {property.propertyName ||
                    property.address ||
                    "Unnamed Parcel"}
                </h3>
              </div>
              {property.propertyName && property.address && (
                <p className="text-xs text-foreground/90 font-medium">
                  {property.address}
                </p>
              )}
              {locationLine && (
                <p className="text-xs text-muted-foreground">{locationLine}</p>
              )}
              <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[11px] font-mono">
                  ID: {property.id}
                </Badge>
                {property.propertyType && (
                  <Badge variant="outline" className="text-[11px]">
                    {property.propertyType}
                  </Badge>
                )}
              </div>
            </div>

            {/* Tier 2: Overview Card */}
            {overviewCard ? <PropertyDetailCard {...overviewCard} /> : null}

            {/* Tier 3: Street View Preview & Expandable Modal Card */}
            <PropertyStreetViewCard
              key={property.id}
              property={property}
              liveEnabled={liveStreetViewEnabled}
            />

            {/* Remaining Data-Driven Detail Cards (Building & Lot, Assessor Valuation) */}
            {secondaryDetailCards.map((cardConfig) => (
              <PropertyDetailCard key={cardConfig.title} {...cardConfig} />
            ))}

            {/* Sales History Card (when present) */}
            {sortedSales.length > 0 && (
              <Card size="sm">
                <CardHeader className="pb-1">
                  <CardTitle className="flex items-center gap-1.5 text-xs font-semibold">
                    <History className="size-3.5 text-primary" />
                    Sales History ({sortedSales.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border/50">
                  {sortedSales.map((sale, index) => (
                    <div
                      key={`${sale.salesId}-${index}`}
                      className="py-2 first:pt-0 last:pb-0 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">
                          {formatCurrency(sale.saleAmount)}
                        </span>
                        <span className="text-muted-foreground">
                          {sale.recordingDate || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{sale.documentType || "Transfer"}</span>
                        <span>
                          {formatPricePerSqFt(sale.pricePerBuildingArea)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
