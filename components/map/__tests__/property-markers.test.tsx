import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Tier A react-map-gl/mapbox boundary mock for Marker and Popup
vi.mock("react-map-gl/mapbox", () => ({
  Marker: ({
    children,
    latitude,
    longitude,
  }: {
    children: ReactNode;
    latitude: number;
    longitude: number;
  }) => (
    <div
      data-testid="mapbox-marker"
      data-lat={latitude}
      data-lng={longitude}
    >
      {children}
    </div>
  ),
  Popup: ({
    children,
    latitude,
    longitude,
    onClose,
  }: {
    children: ReactNode;
    latitude: number;
    longitude: number;
    onClose?: () => void;
  }) => (
    <div
      data-testid="mapbox-popup"
      data-lat={latitude}
      data-lng={longitude}
    >
      {children}
      <button type="button" onClick={onClose} aria-label="Close popup">
        Close Popup
      </button>
    </div>
  ),
}));

import {
  PropertyPin,
  PropertyMarkers,
} from "@/components/map/property-markers";
import { PropertyPopup } from "@/components/map/property-popup";
import type { Property } from "@/components/map/property-type";

const SAMPLE_PROPERTIES: Property[] = [
  {
    id: "PROP_1",
    latitude: 40.712776,
    longitude: -74.005974,
    address: "100 Broadway, New York, NY",
  },
  {
    id: "PROP_2",
    latitude: 40.758896,
    longitude: -73.98513,
  },
];

describe("PropertyPin, PropertyMarkers & PropertyPopup", () => {
  describe("PropertyPin", () => {
    it("renders display name or falls back to id, stops click propagation, and hides label when selected", () => {
      const handlePinClick = vi.fn();
      const handleParentMapClick = vi.fn();

      const { rerender } = render(
        <div onClick={handleParentMapClick}>
          <PropertyPin
            id="PIN_10"
            name="Empire Bldg"
            isSelected={false}
            onClick={handlePinClick}
          />
        </div>,
      );

      const pinBtn = screen.getByRole("button", {
        name: "Property Empire Bldg",
      });
      expect(pinBtn).toBeInTheDocument();
      const labelSpan = screen.getByText("Empire Bldg");
      expect(labelSpan).not.toHaveClass("hidden");

      fireEvent.click(pinBtn);
      expect(handlePinClick).toHaveBeenCalledOnce();
      // Click must not bubble up to the map container
      expect(handleParentMapClick).not.toHaveBeenCalled();

      // When selected, floating label gets the "hidden" class and pin gets selected styling
      rerender(
        <div onClick={handleParentMapClick}>
          <PropertyPin
            id="PIN_10"
            isSelected={true}
            onClick={handlePinClick}
          />
        </div>,
      );
      expect(
        screen.getByRole("button", { name: "Property PIN_10" }),
      ).toHaveClass("bg-amber-500");
      expect(screen.getByText("PIN_10")).toHaveClass("hidden");
    });
  });

  describe("PropertyPopup", () => {
    it("returns null when property is null and renders 4-decimal coordinates when property is present", () => {
      const handleClose = vi.fn();
      const { container, rerender } = render(
        <PropertyPopup property={null} onClose={handleClose} />,
      );
      expect(container).toBeEmptyDOMElement();

      rerender(
        <PropertyPopup
          property={SAMPLE_PROPERTIES[0]}
          onClose={handleClose}
        />,
      );

      expect(screen.getByText("Property #PROP_1")).toBeInTheDocument();
      expect(
        screen.getByText("100 Broadway, New York, NY"),
      ).toBeInTheDocument();
      expect(screen.getByText("40.7128, -74.0060")).toBeInTheDocument();
    });
  });

  describe("PropertyMarkers", () => {
    it("manages uncontrolled selection to open and close PropertyPopup", async () => {
      const user = userEvent.setup();
      const handleSelectProperty = vi.fn();

      render(
        <PropertyMarkers
          properties={SAMPLE_PROPERTIES}
          onSelectProperty={handleSelectProperty}
        />,
      );

      expect(screen.getAllByTestId("mapbox-marker")).toHaveLength(2);
      expect(screen.queryByTestId("mapbox-popup")).not.toBeInTheDocument();

      // Click first property pin
      await user.click(
        screen.getByRole("button", { name: "Property PROP_1" }),
      );

      expect(handleSelectProperty).toHaveBeenCalledWith(SAMPLE_PROPERTIES[0]);
      expect(screen.getByTestId("mapbox-popup")).toBeInTheDocument();
      expect(screen.getByText("Property #PROP_1")).toBeInTheDocument();

      // Close the popup
      await user.click(screen.getByRole("button", { name: /close popup/i }));
      expect(handleSelectProperty).toHaveBeenCalledWith(null);
      expect(screen.queryByTestId("mapbox-popup")).not.toBeInTheDocument();
    });

    it("respects controlled selectedId prop and hides popup when showPopup is false", () => {
      const { rerender } = render(
        <PropertyMarkers
          properties={SAMPLE_PROPERTIES}
          selectedId="PROP_2"
          showPopup={true}
        />,
      );

      expect(screen.getByText("Property #PROP_2")).toBeInTheDocument();

      rerender(
        <PropertyMarkers
          properties={SAMPLE_PROPERTIES}
          selectedId="PROP_2"
          showPopup={false}
        />,
      );

      expect(screen.queryByTestId("mapbox-popup")).not.toBeInTheDocument();
    });
  });
});
