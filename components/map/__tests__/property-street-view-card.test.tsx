import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertySidebar } from "@/components/map/property-sidebar";
import {
  getStreetViewCacheStats,
  resetStreetViewCache,
} from "@/components/map/use-street-view-image";
import type { Property } from "@/components/map/property-type";

function createMockImageResponse(byteSize: number, status = 200): Response {
  const blob = new Blob([new Uint8Array(byteSize)], { type: "image/jpeg" });
  return {
    ok: status >= 200 && status < 300,
    status,
    blob: vi.fn().mockResolvedValue(blob),
  } as unknown as Response;
}

const SAMPLE_PROPERTY: Property = {
  id: "1008350041",
  latitude: 40.7484,
  longitude: -73.9857,
  propertyName: "Empire State Building",
  address: "350 5th Ave",
  neighborhood: "Midtown",
  city: "New York",
  state: "NY",
  zip: "10118",
  propertyType: "Commercial Office",
  yearBuilt: 1931,
  buildingSqFt: 2248355,
  landSqFt: 91351,
  assessedTotalValue: 950000000,
};

describe("PropertySidebar Tier 3 Street View & Dev/Prod Modes", () => {
  const fetchMock = vi.fn();
  const createObjectUrlMock = vi.fn(
    () => "blob:http://localhost:3000/live-street-view",
  );
  const revokeObjectUrlMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    createObjectUrlMock.mockClear();
    revokeObjectUrlMock.mockClear();

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

  it("defaults to Mock mode in dev, renders Street View at Tier 3, expands in a modal without fetching, and switches to Live when toggled", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_KEY", "AIzaDevTestKey");
    const user = userEvent.setup();

    render(
      <PropertySidebar
        selectedId={SAMPLE_PROPERTY.id}
        property={SAMPLE_PROPERTY}
        loading={false}
        isDevMode={true}
      />,
    );

    // 1. Dev toggle is rendered and defaults to OFF (unchecked)
    const toggleSwitch = screen.getByLabelText("Live Street View");
    expect(toggleSwitch).not.toBeChecked();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getStreetViewCacheStats().size).toBe(0);

    // 2. Street View card sits strictly at Tier 3 (after Overview, before Building & Lot)
    const overviewHeading = screen.getByText("Overview");
    const streetViewHeading = screen.getByText("Street View");
    const buildingHeading = screen.getByText("Building & Lot");

    expect(
      overviewHeading.compareDocumentPosition(streetViewHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      streetViewHeading.compareDocumentPosition(buildingHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // 3. Clicking Expand opens the sm:max-w-2xl modal reusing the exact same image URL
    const expandBtn = screen.getByRole("button", {
      name: /expand street view for 350 5th ave/i,
    });
    const previewImg = screen.getByAltText(
      "Street-level exterior view at 350 5th Ave",
    );
    const mockSrc = previewImg.getAttribute("src");
    expect(mockSrc).toMatch(/^data:image\/svg\+xml/);

    await user.click(expandBtn);

    const renderedImgs = screen.getAllByAltText(
      "Street-level exterior view at 350 5th Ave",
    );
    expect(renderedImgs).toHaveLength(2);
    expect(renderedImgs[1]).toHaveAttribute("src", mockSrc);
    expect(fetchMock).not.toHaveBeenCalled();

    // Close modal before toggling Live Street View
    await user.click(screen.getByRole("button", { name: /^close$/i }));

    // 4. Flipping the dev toggle ON fetches live Street View and caches the Blob
    fetchMock.mockResolvedValueOnce(createMockImageResponse(54_000, 200));
    await user.click(toggleSwitch);

    expect(toggleSwitch).toBeChecked();
    await waitFor(() => {
      expect(
        screen.getByAltText("Street-level exterior view at 350 5th Ave"),
      ).toHaveAttribute("src", "blob:http://localhost:3000/live-street-view");
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getStreetViewCacheStats().size).toBe(1);
  });

  it("omits the toggle switch in production mode and defaults to live Street View", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_KEY", "AIzaProdKey");
    fetchMock.mockResolvedValueOnce(createMockImageResponse(60_000, 200));

    render(
      <PropertySidebar
        selectedId={SAMPLE_PROPERTY.id}
        property={SAMPLE_PROPERTY}
        loading={false}
      />,
    );

    expect(
      screen.queryByLabelText("Live Street View"),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByAltText("Street-level exterior view at 350 5th Ave"),
      ).toHaveAttribute("src", "blob:http://localhost:3000/live-street-view");
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("silently hides the Street View card in production when the API key is missing or imagery returns 404", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_KEY", "");

    const { rerender } = render(
      <PropertySidebar
        selectedId={SAMPLE_PROPERTY.id}
        property={SAMPLE_PROPERTY}
        loading={false}
      />,
    );

    // No toggle, no Street View card, no fetch calls when key is missing, while rest of sidebar renders normally
    expect(
      screen.queryByLabelText("Live Street View"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Street View")).not.toBeInTheDocument();
    expect(screen.getByText("Empire State Building")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    // With API key present but HTTP 404 (no outdoor panorama), card stays silently hidden
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_KEY", "AIzaProdKey");
    fetchMock.mockResolvedValueOnce(createMockImageResponse(0, 404));

    rerender(
      <PropertySidebar
        selectedId="PARCEL_404"
        property={{ ...SAMPLE_PROPERTY, id: "PARCEL_404" }}
        loading={false}
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText("Street View")).not.toBeInTheDocument();
  });
});
