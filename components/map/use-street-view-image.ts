"use client";

import { useEffect, useState } from "react";

/** Native dimensions requested from Google Street View Static API (16:9 aspect ratio) */
export const STREET_VIEW_DIMENSIONS = {
  width: 640,
  height: 360,
} as const;

export type StreetViewStatus =
  | "idle"
  | "mock"
  | "loading"
  | "ready"
  | "no_coverage"
  | "error";

export interface UseStreetViewImageOptions {
  parcelId: string | null | undefined;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  address?: string;
  /** Whether live Google Street View fetching is active (false = deterministic mock) */
  liveEnabled: boolean;
  /** Optional API key override; defaults to NEXT_PUBLIC_GOOGLE_MAPS_KEY */
  apiKey?: string;
}

export interface UseStreetViewImageResult {
  status: StreetViewStatus;
  imageUrl: string | null;
  isMock: boolean;
}

function safeRevokeObjectUrl(url: string): void {
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}

/**
 * Checks that coordinates are finite numbers within geographic bounds and not Null Island (0, 0).
 */
export function hasValidStreetViewCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return false;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }
  if (latitude === 0 && longitude === 0) {
    return false;
  }
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Builds the Google Street View Static API request URL for a single outdoor panorama frame.
 */
export function buildStreetViewStaticUrl(
  latitude: number,
  longitude: number,
  apiKey: string,
): string {
  const params = new URLSearchParams({
    size: `${STREET_VIEW_DIMENSIONS.width}x${STREET_VIEW_DIMENSIONS.height}`,
    location: `${latitude},${longitude}`,
    source: "outdoor",
    return_error_code: "true",
    key: apiKey,
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

function escapeSvgText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates an uncached deterministic 640x360 SVG data URI for local development mock mode.
 */
export function createMockStreetViewDataUrl(params: {
  parcelId: string;
  address?: string;
  latitude: number;
  longitude: number;
}): string {
  const { parcelId, address, latitude, longitude } = params;
  let hash = 0;
  for (let i = 0; i < parcelId.length; i += 1) {
    hash = (hash * 31 + parcelId.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  const label = escapeSvgText(address || `Parcel ${parcelId}`);
  const coords = escapeSvgText(
    `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="hsl(${hue}, 38%, 22%)" />
        <stop offset="100%" stop-color="hsl(${hue}, 28%, 12%)" />
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#sky)" />
    <rect x="0" y="276" width="640" height="84" fill="#18181b" />
    <line x1="0" y1="318" x2="640" y2="318" stroke="#facc15" stroke-width="3" stroke-dasharray="22 16" opacity="0.65" />
    <rect x="96" y="108" width="132" height="168" rx="4" fill="hsl(${hue}, 24%, 30%)" />
    <rect x="246" y="72" width="164" height="204" rx="4" fill="hsl(${hue}, 32%, 38%)" />
    <rect x="428" y="124" width="118" height="152" rx="4" fill="hsl(${hue}, 22%, 28%)" />
    <rect x="20" y="20" width="238" height="28" rx="6" fill="#09090b" opacity="0.82" />
    <text x="32" y="39" fill="#e4e4e7" font-family="system-ui, sans-serif" font-size="12" font-weight="600">DEV MOCK STREET VIEW (NO API COST)</text>
    <text x="32" y="304" fill="#fafafa" font-family="system-ui, sans-serif" font-size="16" font-weight="600">${label}</text>
    <text x="32" y="340" fill="#a1a1aa" font-family="monospace" font-size="12">ID: ${escapeSvgText(parcelId)} • ${coords}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

interface LiveResolutionState {
  requestKey: string;
  status: "ready" | "no_coverage" | "error";
  imageUrl: string | null;
}

/**
 * Fetches a single 640x360 Street View image per parcel in live mode,
 * or returns a deterministic local SVG preview when `liveEnabled` is false.
 */
export function useStreetViewImage({
  parcelId,
  latitude,
  longitude,
  address,
  liveEnabled,
  apiKey,
}: UseStreetViewImageOptions): UseStreetViewImageResult {
  const normalizedParcelId = parcelId?.trim() || null;
  const coordsValid = hasValidStreetViewCoordinates(latitude, longitude);
  const resolvedApiKey = (
    apiKey ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ??
    ""
  ).trim();

  const [resolution, setResolution] = useState<LiveResolutionState | null>(
    null,
  );

  const requestKey =
    normalizedParcelId && coordsValid && liveEnabled && resolvedApiKey
      ? `${normalizedParcelId}|${latitude}|${longitude}|${resolvedApiKey}`
      : null;

  useEffect(() => {
    if (!requestKey || !normalizedParcelId || !coordsValid) {
      return;
    }

    const controller = new AbortController();
    let createdObjectUrl: string | null = null;
    const url = buildStreetViewStaticUrl(
      latitude as number,
      longitude as number,
      resolvedApiKey,
    );

    const fetchImage = async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (controller.signal.aborted) return;

        if (res.status === 404) {
          setResolution({
            requestKey,
            status: "no_coverage",
            imageUrl: null,
          });
          return;
        }

        if (!res.ok) {
          setResolution({
            requestKey,
            status: "error",
            imageUrl: null,
          });
          return;
        }

        const blob = await res.blob();
        if (controller.signal.aborted || blob.size <= 0) {
          if (!controller.signal.aborted) {
            setResolution({
              requestKey,
              status: "error",
              imageUrl: null,
            });
          }
          return;
        }

        createdObjectUrl = URL.createObjectURL(blob);
        setResolution({
          requestKey,
          status: "ready",
          imageUrl: createdObjectUrl,
        });
      } catch {
        if (controller.signal.aborted) return;
        setResolution({
          requestKey,
          status: "error",
          imageUrl: null,
        });
      }
    };

    void fetchImage();

    return () => {
      controller.abort();
      if (createdObjectUrl) {
        safeRevokeObjectUrl(createdObjectUrl);
      }
    };
  }, [requestKey, normalizedParcelId, coordsValid, latitude, longitude, resolvedApiKey]);

  if (!normalizedParcelId || !coordsValid) {
    return { status: "idle", imageUrl: null, isMock: false };
  }

  if (!liveEnabled) {
    return {
      status: "mock",
      imageUrl: createMockStreetViewDataUrl({
        parcelId: normalizedParcelId,
        address,
        latitude: latitude as number,
        longitude: longitude as number,
      }),
      isMock: true,
    };
  }

  if (!resolvedApiKey) {
    return { status: "error", imageUrl: null, isMock: false };
  }

  if (resolution && resolution.requestKey === requestKey) {
    return {
      status: resolution.status,
      imageUrl: resolution.imageUrl,
      isMock: false,
    };
  }

  return { status: "loading", imageUrl: null, isMock: false };
}
