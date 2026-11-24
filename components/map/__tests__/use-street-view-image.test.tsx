import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  buildStreetViewStaticUrl,
  getStreetViewCacheEntry,
  getStreetViewCacheStats,
  hasValidStreetViewCoordinates,
  resetStreetViewCache,
  useStreetViewImage,
} from "@/components/map/use-street-view-image";

function createMockImageResponse(byteSize: number, status = 200): Response {
  const blob = new Blob([new Uint8Array(byteSize)], { type: "image/jpeg" });
  return {
    ok: status >= 200 && status < 300,
    status,
    blob: vi.fn().mockResolvedValue(blob),
  } as unknown as Response;
}

describe("useStreetViewImage & 5 MB FIFO Cache", () => {
  let objectUrlCounter = 0;
  const createObjectUrlMock = vi.fn(
    () => `blob:http://localhost:3000/street-view-${++objectUrlCounter}`,
  );
  const revokeObjectUrlMock = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    objectUrlCounter = 0;
    createObjectUrlMock.mockClear();
    revokeObjectUrlMock.mockClear();
    fetchMock.mockReset();

    Object.defineProperty(globalThis.URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(globalThis.URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectUrlMock,
    });
    vi.stubGlobal("fetch", fetchMock);
    resetStreetViewCache();
  });

  afterEach(() => {
    resetStreetViewCache();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("validates geographic coordinates and rejects Null Island (0, 0) or NaN", () => {
    expect(hasValidStreetViewCoordinates(40.7484, -73.9857)).toBe(true);
    expect(hasValidStreetViewCoordinates(0, 0)).toBe(false);
    expect(hasValidStreetViewCoordinates(Number.NaN, -73.9857)).toBe(false);
    expect(hasValidStreetViewCoordinates(null, -73.9857)).toBe(false);
    expect(hasValidStreetViewCoordinates(95, -73.9857)).toBe(false);
  });

  it("constructs a 640x360 outdoor Street View Static API URL with return_error_code=true", () => {
    const url = buildStreetViewStaticUrl(40.7484, -73.9857, "AIzaTestKey");
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://maps.googleapis.com/maps/api/streetview",
    );
    expect(parsed.searchParams.get("size")).toBe("640x360");
    expect(parsed.searchParams.get("location")).toBe("40.7484,-73.9857");
    expect(parsed.searchParams.get("source")).toBe("outdoor");
    expect(parsed.searchParams.get("return_error_code")).toBe("true");
    expect(parsed.searchParams.get("key")).toBe("AIzaTestKey");
  });

  it("serves an uncached deterministic SVG mock when liveEnabled is false without calling fetch", () => {
    const { result } = renderHook(() =>
      useStreetViewImage({
        parcelId: "PARCEL_MOCK_1",
        latitude: 40.7484,
        longitude: -73.9857,
        address: "350 5th Ave",
        liveEnabled: false,
        apiKey: "AIzaShouldNotBeUsed",
      }),
    );

    expect(result.current.status).toBe("mock");
    expect(result.current.isMock).toBe(true);
    expect(result.current.imageUrl).toMatch(/^data:image\/svg\+xml/);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getStreetViewCacheStats()).toEqual({
      size: 0,
      totalBytes: 0,
      keys: [],
    });
  });

  it("fetches once in live mode, stores the Blob in cache, and reuses the cached objectUrl on repeat visits", async () => {
    fetchMock.mockResolvedValueOnce(createMockImageResponse(48_000, 200));

    const { result, rerender } = renderHook(
      ({ parcelId }: { parcelId: string }) =>
        useStreetViewImage({
          parcelId,
          latitude: 40.7484,
          longitude: -73.9857,
          liveEnabled: true,
          apiKey: "AIzaLiveKey",
        }),
      { initialProps: { parcelId: "PARCEL_LIVE_1" } },
    );

    expect(result.current.status).toBe("loading");

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    const cachedUrl = result.current.imageUrl;
    expect(cachedUrl).toBe("blob:http://localhost:3000/street-view-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getStreetViewCacheStats()).toEqual({
      size: 1,
      totalBytes: 48_000,
      keys: ["PARCEL_LIVE_1"],
    });

    // Switch to another parcel (mocked/cached) and back to PARCEL_LIVE_1 -> zero additional network calls
    fetchMock.mockResolvedValueOnce(createMockImageResponse(32_000, 200));
    rerender({ parcelId: "PARCEL_LIVE_2" });
    await waitFor(() => {
      expect(result.current.imageUrl).toBe(
        "blob:http://localhost:3000/street-view-2",
      );
    });

    rerender({ parcelId: "PARCEL_LIVE_1" });
    expect(result.current.status).toBe("ready");
    expect(result.current.imageUrl).toBe(cachedUrl);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("caches HTTP 404 responses as no_coverage and distinguishes them from uncached fetch errors", async () => {
    // 1. HTTP 404 -> cached as no_coverage
    fetchMock.mockResolvedValueOnce(createMockImageResponse(0, 404));

    const { result, rerender } = renderHook(
      ({ parcelId }: { parcelId: string }) =>
        useStreetViewImage({
          parcelId,
          latitude: 40.7484,
          longitude: -73.9857,
          liveEnabled: true,
          apiKey: "AIzaLiveKey",
        }),
      { initialProps: { parcelId: "PARCEL_NO_SV" } },
    );

    await waitFor(() => {
      expect(result.current.status).toBe("no_coverage");
    });
    expect(result.current.imageUrl).toBeNull();
    expect(getStreetViewCacheEntry("PARCEL_NO_SV")).toEqual({
      kind: "no_coverage",
      objectUrl: null,
      byteSize: 0,
    });

    // 2. Transient network error -> status is "error" and NOT stored in cache
    fetchMock.mockRejectedValueOnce(new Error("Network offline"));
    rerender({ parcelId: "PARCEL_TRANSIENT_ERR" });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(getStreetViewCacheEntry("PARCEL_TRANSIENT_ERR")).toBeUndefined();

    // 3. Re-selecting PARCEL_NO_SV hits cache without calling fetch again
    rerender({ parcelId: "PARCEL_NO_SV" });
    expect(result.current.status).toBe("no_coverage");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // 4. Re-selecting PARCEL_TRANSIENT_ERR retries fetch and recovers
    fetchMock.mockResolvedValueOnce(createMockImageResponse(25_000, 200));
    rerender({ parcelId: "PARCEL_TRANSIENT_ERR" });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("evicts oldest entries in strict FIFO order when exceeding maxCacheBytes and revokes evicted ObjectURLs", async () => {
    const maxCacheBytes = 1_000;
    fetchMock
      .mockResolvedValueOnce(createMockImageResponse(400, 200)) // PARCEL_A (400 B)
      .mockResolvedValueOnce(createMockImageResponse(400, 200)) // PARCEL_B (800 B total)
      .mockResolvedValueOnce(createMockImageResponse(400, 200)); // PARCEL_C (would be 1200 B -> evicts PARCEL_A)

    const { result, rerender } = renderHook(
      ({ parcelId }: { parcelId: string }) =>
        useStreetViewImage({
          parcelId,
          latitude: 40.75,
          longitude: -73.98,
          liveEnabled: true,
          apiKey: "AIzaLiveKey",
          maxCacheBytes,
        }),
      { initialProps: { parcelId: "PARCEL_A" } },
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    const urlA = result.current.imageUrl;

    rerender({ parcelId: "PARCEL_B" });
    await waitFor(() =>
      expect(result.current.imageUrl).toBe(
        "blob:http://localhost:3000/street-view-2",
      ),
    );

    // Re-read PARCEL_A before inserting PARCEL_C: FIFO must STILL evict PARCEL_A first (not LRU!)
    rerender({ parcelId: "PARCEL_A" });
    expect(result.current.imageUrl).toBe(urlA);

    rerender({ parcelId: "PARCEL_C" });
    await waitFor(() =>
      expect(result.current.imageUrl).toBe(
        "blob:http://localhost:3000/street-view-3",
      ),
    );

    expect(getStreetViewCacheStats()).toEqual({
      size: 2,
      totalBytes: 800,
      keys: ["PARCEL_B", "PARCEL_C"],
    });
    expect(revokeObjectUrlMock).toHaveBeenCalledExactlyOnceWith(urlA);
  });

  it("aborts in-flight requests when switching parcels rapidly and fails silently when API key is missing", async () => {
    let capturedSignal: AbortSignal | undefined;
    fetchMock.mockImplementationOnce(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          capturedSignal = init?.signal ?? undefined;
          capturedSignal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    fetchMock.mockResolvedValueOnce(createMockImageResponse(30_000, 200));

    const { result, rerender } = renderHook(
      ({ parcelId, apiKey }: { parcelId: string; apiKey: string }) =>
        useStreetViewImage({
          parcelId,
          latitude: 40.75,
          longitude: -73.98,
          liveEnabled: true,
          apiKey,
        }),
      { initialProps: { parcelId: "PARCEL_SLOW", apiKey: "AIzaKey" } },
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // Rapidly switch to PARCEL_FAST before PARCEL_SLOW resolves
    rerender({ parcelId: "PARCEL_FAST", apiKey: "AIzaKey" });
    expect(capturedSignal?.aborted).toBe(true);

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(getStreetViewCacheEntry("PARCEL_SLOW")).toBeUndefined();
    expect(getStreetViewCacheEntry("PARCEL_FAST")?.kind).toBe("image");

    // Missing API key in live mode fails silently with zero extra fetch calls
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_KEY", "");
    rerender({ parcelId: "PARCEL_NO_KEY", apiKey: "" });
    expect(result.current.status).toBe("error");
    expect(result.current.imageUrl).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
