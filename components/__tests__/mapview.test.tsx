import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Tier A react-map-gl/mapbox boundary mock
vi.mock("react-map-gl/mapbox", () => ({
  default: React.forwardRef(function MockMap(
    { children }: { children?: React.ReactNode },
    ref: React.Ref<{ flyTo: ReturnType<typeof vi.fn> }>,
  ) {
    React.useImperativeHandle(ref, () => ({
      flyTo: vi.fn(),
    }));
    return <div data-testid="mapbox-map">{children}</div>;
  }),
  Source: ({ children, id }: { children?: React.ReactNode; id: string }) => (
    <div data-testid={`mapbox-source-${id}`}>{children}</div>
  ),
  Layer: ({ id }: { id: string }) => <div data-testid={`mapbox-layer-${id}`} />,
}));

import MapView from "@/components/mapview";

const DEFAULT_VIEW = {
  latitude: 40.7128,
  longitude: -74.006,
  zoom: 12,
};

describe("MapView", () => {
  it("renders base Mapbox container, terrain contour source/layer, and child layers without load button by default", () => {
    render(
      <MapView initialView={DEFAULT_VIEW}>
        <div data-testid="custom-child-layer" />
      </MapView>,
    );

    expect(screen.getByTestId("mapbox-map")).toBeInTheDocument();
    expect(
      screen.getByTestId("mapbox-source-mapbox-terrain"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("mapbox-layer-terrain-data")).toBeInTheDocument();
    expect(screen.getByTestId("custom-child-layer")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /load properties/i }),
    ).not.toBeInTheDocument();
  });

  it("renders 'Load Properties' button when onLoadData is provided and disables it while loading", async () => {
    const user = userEvent.setup();
    const handleLoadData = vi.fn();

    const { rerender } = render(
      <MapView
        initialView={DEFAULT_VIEW}
        onLoadData={handleLoadData}
        loading={false}
        loadedCount={0}
      />,
    );

    const loadBtn = screen.getByRole("button", { name: "Load Properties" });
    expect(loadBtn).toBeEnabled();
    await user.click(loadBtn);
    expect(handleLoadData).toHaveBeenCalledOnce();

    // When loading is true, button is disabled and shows loading label
    rerender(
      <MapView
        initialView={DEFAULT_VIEW}
        onLoadData={handleLoadData}
        loading={true}
        loadedCount={0}
      />,
    );

    const loadingBtn = screen.getByRole("button", {
      name: /loading properties\.\.\./i,
    });
    expect(loadingBtn).toBeDisabled();
  });

  it("pluralizes the loaded count badge for 1 vs multiple properties", () => {
    const handleLoadData = vi.fn();
    const { rerender } = render(
      <MapView
        initialView={DEFAULT_VIEW}
        onLoadData={handleLoadData}
        loadedCount={1}
      />,
    );

    expect(screen.getByText("1 property loaded")).toBeInTheDocument();

    rerender(
      <MapView
        initialView={DEFAULT_VIEW}
        onLoadData={handleLoadData}
        loadedCount={42}
      />,
    );

    expect(screen.getByText("42 properties loaded")).toBeInTheDocument();
  });
});
