"use client";

/** Default 5 MB ceiling for cached Street View image blobs */
export const STREET_VIEW_MAX_CACHE_BYTES = 5 * 1024 * 1024;

/** Upper bound on total FIFO entries (protects against unbounded 0-byte no_coverage entries) */
const MAX_CACHE_ENTRIES = 500;

export type StreetViewCacheEntry =
  | {
      kind: "image";
      objectUrl: string;
      byteSize: number;
    }
  | {
      kind: "no_coverage";
      objectUrl: null;
      byteSize: 0;
    };

// Module-scoped FIFO cache (JavaScript Map preserves insertion order for O(1) FIFO eviction)
const streetViewCache = new Map<string, StreetViewCacheEntry>();
let totalCachedBytes = 0;

function safeRevokeObjectUrl(url: string): void {
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}

function removeExistingEntry(parcelId: string): void {
  const existing = streetViewCache.get(parcelId);
  if (!existing) return;
  if (existing.kind === "image") {
    totalCachedBytes = Math.max(0, totalCachedBytes - existing.byteSize);
    safeRevokeObjectUrl(existing.objectUrl);
  }
  streetViewCache.delete(parcelId);
}

function evictFifoIfNeeded(
  incomingBytes: number,
  maxCacheBytes: number,
  protectedParcelId: string,
): void {
  for (const [oldestKey, oldestEntry] of streetViewCache) {
    const overByteLimit = totalCachedBytes + incomingBytes > maxCacheBytes;
    const overEntryLimit = streetViewCache.size >= MAX_CACHE_ENTRIES;
    if (!overByteLimit && !overEntryLimit) {
      break;
    }
    if (oldestKey === protectedParcelId) {
      continue;
    }
    streetViewCache.delete(oldestKey);
    if (oldestEntry.kind === "image") {
      totalCachedBytes = Math.max(0, totalCachedBytes - oldestEntry.byteSize);
      safeRevokeObjectUrl(oldestEntry.objectUrl);
    }
  }
}

/**
 * Inserts a fetched Street View image Blob into the FIFO cache, evicting oldest
 * entries when exceeding `maxCacheBytes` and revoking their Object URLs.
 */
export function cacheStreetViewBlob(
  parcelId: string,
  blob: Blob,
  maxCacheBytes = STREET_VIEW_MAX_CACHE_BYTES,
): StreetViewCacheEntry | null {
  if (blob.size <= 0 || blob.size > maxCacheBytes) {
    return null;
  }

  removeExistingEntry(parcelId);
  evictFifoIfNeeded(blob.size, maxCacheBytes, parcelId);

  const objectUrl = URL.createObjectURL(blob);
  const entry: StreetViewCacheEntry = {
    kind: "image",
    objectUrl,
    byteSize: blob.size,
  };
  streetViewCache.set(parcelId, entry);
  totalCachedBytes += blob.size;
  return entry;
}

/**
 * Records a known HTTP 404 (no outdoor Street View coverage) in the FIFO cache
 * so repeat clicks do not re-query Google and remain distinct from fetch errors.
 */
export function cacheStreetViewNoCoverage(
  parcelId: string,
  maxCacheBytes = STREET_VIEW_MAX_CACHE_BYTES,
): StreetViewCacheEntry {
  removeExistingEntry(parcelId);
  evictFifoIfNeeded(0, maxCacheBytes, parcelId);

  const entry: StreetViewCacheEntry = {
    kind: "no_coverage",
    objectUrl: null,
    byteSize: 0,
  };
  streetViewCache.set(parcelId, entry);
  return entry;
}

/** Reads a cached entry directly by parcel ID without altering FIFO insertion order */
export function getStreetViewCacheEntry(
  parcelId: string,
): StreetViewCacheEntry | undefined {
  return streetViewCache.get(parcelId.trim());
}

/** Returns whether a parcel ID currently exists in the FIFO cache */
export function hasStreetViewCacheEntry(parcelId: string): boolean {
  return streetViewCache.has(parcelId.trim());
}

/** Inspection helper for tests and diagnostics */
export function getStreetViewCacheStats(): {
  size: number;
  totalBytes: number;
  keys: string[];
} {
  return {
    size: streetViewCache.size,
    totalBytes: totalCachedBytes,
    keys: Array.from(streetViewCache.keys()),
  };
}

/** Clears all entries and revokes all active blob object URLs */
export function resetStreetViewCache(): void {
  for (const entry of streetViewCache.values()) {
    if (entry.kind === "image") {
      safeRevokeObjectUrl(entry.objectUrl);
    }
  }
  streetViewCache.clear();
  totalCachedBytes = 0;
}
