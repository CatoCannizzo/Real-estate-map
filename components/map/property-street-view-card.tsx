"use client";

import { useState } from "react";
import { Camera, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Property } from "@/components/map/property-type";
import {
  STREET_VIEW_DIMENSIONS,
  useStreetViewImage,
} from "@/components/map/use-street-view-image";

export interface PropertyStreetViewCardProps {
  property: Property;
  liveEnabled: boolean;
  apiKey?: string;
}

/**
 * Tier 3 sidebar card displaying a single cached 640x360 Street View preview
 * that expands into a full-resolution modal Dialog without re-fetching.
 * Returns null silently when coordinates are invalid, no coverage exists, or fetching fails.
 */
export function PropertyStreetViewCard({
  property,
  liveEnabled,
  apiKey,
}: PropertyStreetViewCardProps) {
  const { status, imageUrl, isMock } = useStreetViewImage({
    parcelId: property.id,
    latitude: property.latitude,
    longitude: property.longitude,
    address: property.address,
    liveEnabled,
    apiKey,
  });

  // Tracks broken image decode URLs so any corrupted response collapses silently
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (
    status === "idle" ||
    status === "no_coverage" ||
    status === "error" ||
    (imageUrl !== null && failedUrl === imageUrl)
  ) {
    return null;
  }

  const displayTitle =
    property.address || property.propertyName || `Parcel ${property.id}`;
  const altText = `Street-level exterior view at ${displayTitle}`;
  const dialogSubtitle = [
    [property.neighborhood, property.city, property.state]
      .filter(Boolean)
      .join(", "),
    `ID: ${property.id}`,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <Card size="sm">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center justify-between gap-1.5 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <Camera aria-hidden="true" className="size-3.5 text-primary" />
            Street View
          </span>
          {isMock ? (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              Mock
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {status === "loading" || !imageUrl ? (
          <Skeleton
            data-testid="street-view-skeleton"
            className="aspect-video w-full rounded-lg"
          />
        ) : (
          <Dialog>
            <DialogTrigger
              render={
                <button
                  type="button"
                  aria-label={`Expand Street View for ${displayTitle}`}
                  className="group relative block w-full cursor-pointer overflow-hidden rounded-lg border border-border/60 bg-muted text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={altText}
                width={STREET_VIEW_DIMENSIONS.width}
                height={STREET_VIEW_DIMENSIONS.height}
                onError={() => setFailedUrl(imageUrl)}
                className="aspect-video w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <span className="pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-xs">
                <Maximize2 aria-hidden="true" className="size-3" />
                Expand
              </span>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{displayTitle}</DialogTitle>
                <DialogDescription>{dialogSubtitle}</DialogDescription>
              </DialogHeader>

              <div className="overflow-hidden rounded-lg border border-border/60 bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={altText}
                  width={STREET_VIEW_DIMENSIONS.width}
                  height={STREET_VIEW_DIMENSIONS.height}
                  className="aspect-video w-full object-cover"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
