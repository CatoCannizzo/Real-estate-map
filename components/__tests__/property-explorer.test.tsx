import React, {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
} from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import type { MockedResponse } from "@apollo/client/testing";
import type { FeatureCollection } from "geojson";
import { toast } from "sonner";
import PropertyExplorer from "@/components/propertyexplorer";
import type { PropertyPolygonsProps } from "@/components/map/property-polygons";
import {
  GET_REONOMY_PROPERTY,
  GET_PROPERTY_BY_ADDRESS,
} from "@/lib/graphql/queries";

vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

type ListenerFn = (...args: unknown[]) => void;

interface MockMapControllerOptions {
  styleLoaded?: boolean;
  autoLoad?: boolean;
  registeredSources?: string[];
  registeredLayers?: string[];
}

/**
 * Programmable Mapbox event-emitter test harness providing deterministic control
 * over `isStyleLoaded`, `getSource`, `sourcedata` / `idle` ordering, layer clicks,
 * `setFeatureState` / `removeFeatureState`, and camera `flyTo`.
 */
function createMockMapController(options: MockMapControllerOptions = {}) {
  let styleLoaded = options.styleLoaded ?? true;
  const autoLoad = options.autoLoad ?? styleLoaded;
  let onLoadCallback: (() => void) | undefined;
  const sources = new Set<string>(options.registeredSources ?? []);
  const layers = new Set<string>(options.registeredLayers ?? []);
  const globalListeners = new Map<string, Set<ListenerFn>>();
  const layerListeners = new Map<string, Set<ListenerFn>>();
  const onceWrappers = new WeakMap<ListenerFn, ListenerFn>();
  const canvasStyle = { cursor: "" };

  const on = vi.fn(
    (event: string, layerOrHandler: string | ListenerFn, maybeHandler?: ListenerFn) => {
      if (typeof layerOrHandler === "string" && typeof maybeHandler === "function") {
        const key = `${event}:${layerOrHandler}`;
        if (!layerListeners.has(key)) {
          layerListeners.set(key, new Set());
        }
        layerListeners.get(key)!.add(maybeHandler);
        return;
      }
      if (typeof layerOrHandler === "function") {
        if (!globalListeners.has(event)) {
          globalListeners.set(event, new Set());
        }
        globalListeners.get(event)!.add(layerOrHandler);
      }
    },
  );

  const off = vi.fn(
    (event: string, layerOrHandler: string | ListenerFn, maybeHandler?: ListenerFn) => {
      if (typeof layerOrHandler === "string" && typeof maybeHandler === "function") {
        layerListeners.get(`${event}:${layerOrHandler}`)?.delete(maybeHandler);
        return;
      }
      if (typeof layerOrHandler === "function") {
        const set = globalListeners.get(event);
        if (!set) return;
        set.delete(layerOrHandler);
        const wrapped = onceWrappers.get(layerOrHandler);
        if (wrapped) {
          set.delete(wrapped);
        }
      }
    },
  );

  const once = vi.fn((event: string, handler: ListenerFn) => {
    const wrapper: ListenerFn = (...args: unknown[]) => {
      off(event, wrapper);
      handler(...args);
    };
    onceWrappers.set(handler, wrapper);
    on(event, wrapper);
  });

  const setFeatureState = vi.fn();
  const removeFeatureState = vi.fn();
  const flyTo = vi.fn();
  const queryRenderedFeatures = vi.fn(() => []);
  const isStyleLoaded = vi.fn(() => styleLoaded);
  const getSource = vi.fn((id: string) => (sources.has(id) ? { id } : undefined));
  const getLayer = vi.fn((id: string) => (layers.has(id) ? { id } : undefined));
  const getCanvas = vi.fn(() => ({ style: canvasStyle }));

  const mapInstance = {
    on,
    off,
    once,
    setFeatureState,
    removeFeatureState,
    flyTo,
    queryRenderedFeatures,
    isStyleLoaded,
    getSource,
    getLayer,
    getCanvas,
  };

  return {
    mapInstance,
    autoLoad,
    on,
    off,
    once,
    setFeatureState,
    removeFeatureState,
    flyTo,
    queryRenderedFeatures,
    isStyleLoaded,
    getSource,
    setOnLoadCallback(cb: (() => void) | undefined) {
      onLoadCallback = cb;
    },
    triggerLoad() {
      onLoadCallback?.();
    },
    setStyleLoaded(next: boolean) {
      styleLoaded = next;
    },
    registerSource(sourceId: string) {
      sources.add(sourceId);
    },
    unregisterSource(sourceId: string) {
      sources.delete(sourceId);
    },
    registerLayer(layerId: string) {
      layers.add(layerId);
    },
    emit(event: string, payload?: unknown) {
      const snapshot = [...(globalListeners.get(event) ?? [])];
      for (const listener of snapshot) {
        listener(payload);
      }
    },
    emitLayerClick(layerId: string, featureProperties: Record<string, unknown>) {
      const snapshot = [...(layerListeners.get(`click:${layerId}`) ?? [])];
      for (const listener of snapshot) {
        listener({ features: [{ properties: featureProperties }] });
      }
    },
  };
}

type MockMapController = ReturnType<typeof createMockMapController>;

let activeController: MockMapController;

vi.mock("react-map-gl/mapbox", () => {
  const MapContext = createContext<{ current: MockMapController["mapInstance"] | null }>({
    current: null,
  });

  const MockMap = forwardRef<
    MockMapController["mapInstance"],
    { children?: React.ReactNode; onLoad?: () => void }
  >(function MockMap({ children, onLoad }, ref) {
    useImperativeHandle(ref, () => activeController.mapInstance, []);
    useEffect(() => {
      activeController.setOnLoadCallback(onLoad);
      if (activeController.autoLoad) {
        onLoad?.();
      }
      return () => activeController.setOnLoadCallback(undefined);
    }, [onLoad]);
    return (
      <MapContext.Provider value={{ current: activeController.mapInstance }}>
        <div data-testid="mock-mapbox-map">{children}</div>
      </MapContext.Provider>
    );
  });

  return {
    default: MockMap,
    useMap: () => useContext(MapContext),
    Source: ({ id, children }: { id: string; children?: React.ReactNode }) => (
      <div data-testid={`mapbox-source-${id}`}>{children}</div>
    ),
    Layer: ({ id }: { id: string }) => <div data-testid={`mapbox-layer-${id}`} />,
    Marker: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="mapbox-marker">{children}</div>
    ),
    Popup: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="mapbox-popup">{children}</div>
    ),
  };
});

const SAMPLE_GEOJSON: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-122.313, 47.66],
            [-122.312, 47.66],
            [-122.312, 47.661],
            [-122.313, 47.66],
          ],
        ],
      },
      properties: {
        pin: "A",
        prop_name: "Campus Lofts A",
        address: "4501 15th Ave NE",
        uv_name: "University District",
        land_use_desc: "Apartment",
        year_built_n: 2012,
        centroid_lat: 47.6605,
        centroid_lng: -122.3125,
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-122.314, 47.662],
            [-122.313, 47.662],
            [-122.313, 47.663],
            [-122.314, 47.662],
          ],
        ],
      },
      properties: {
        pin: "B",
        prop_name: "Rowhouse B",
        address: "4700 University Way NE",
        uv_name: "University District",
        centroid_lat: 47.6625,
        centroid_lng: -122.3135,
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-122.315, 47.664],
            [-122.314, 47.664],
            [-122.314, 47.665],
            [-122.315, 47.664],
          ],
        ],
      },
      properties: {
        pin: "C",
        prop_name: "Corner Plaza C",
        address: "5000 Brooklyn Ave NE",
        centroid_lat: 47.6645,
        centroid_lng: -122.3145,
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-122.316, 47.666],
            [-122.315, 47.666],
            [-122.315, 47.667],
            [-122.316, 47.666],
          ],
        ],
      },
      properties: {
        pin: "D",
        prop_name: "Tower D",
        address: "5200 Roosevelt Way NE",
        centroid_lat: 47.6665,
        centroid_lng: -122.3155,
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-122.317, 47.668],
            [-122.316, 47.668],
            [-122.316, 47.669],
            [-122.317, 47.668],
          ],
        ],
      },
      properties: {
        pin: "ZERO_COORDS",
        prop_name: "Missing Centroid Parcel",
      },
    },
  ],
};

const GEOJSON_POLYGON_PROPS: PropertyPolygonsProps = {
  sourceType: "geojson",
  sourceId: "uw-parcels",
  data: SAMPLE_GEOJSON,
  idProperty: "pin",
};

const VECTOR_POLYGON_PROPS: PropertyPolygonsProps = {
  sourceType: "vector",
  sourceId: "property-boundaries",
  sourceUrl: "mapbox://svayser.parcel-boundaries",
  sourceLayer: "attom-parcels",
  idProperty: "ID",
};

const DEFAULT_MAP_PROPS = {
  initialView: {
    latitude: 47.6553,
    longitude: -122.3035,
    zoom: 15,
  },
  mapboxAccessToken: "pk.test-token",
};

function renderExplorer(
  polygonProps: PropertyPolygonsProps = GEOJSON_POLYGON_PROPS,
  mocks: MockedResponse[] = [],
) {
  return render(
    <MockedProvider mocks={mocks}>
      <PropertyExplorer mapProps={DEFAULT_MAP_PROPS} polygonProps={polygonProps} />
    </MockedProvider>,
  );
}

describe("PropertyExplorer — Persistent Parcel Selection & Mapbox Coordination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/wamap");
    activeController = createMockMapController({
      styleLoaded: true,
      registeredSources: ["uw-parcels", "property-boundaries"],
      registeredLayers: ["uw-parcels-fill", "property-boundaries-fill"],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the YearBuiltLegend choropleth toggle visibly and toggles active state", async () => {
    const user = userEvent.setup();
    renderExplorer();

    expect(screen.getByText("Year Built Choropleth")).toBeInTheDocument();
    const toggleBtn = screen.getByRole("button", { name: "Off" });
    expect(toggleBtn).toBeInTheDocument();

    // Legend wrapper sits at z-20 with pointer-events-auto inside viewport-constrained explorer
    const legendWrapper = screen.getByText("Year Built Choropleth").closest(".z-20");
    expect(legendWrapper).not.toBeNull();
    expect(legendWrapper).toHaveClass("bottom-8", "left-4", "pointer-events-auto");

    await user.click(toggleBtn);
    expect(screen.getByRole("button", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByText("≤ 1900")).toBeInTheDocument();
    expect(screen.getByText("2025+")).toBeInTheDocument();
  });

  it("updates ?id= via pushState on direct polygon click, highlights feature, avoids duplicate history pushes, and keeps camera stationary", () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    renderExplorer();

    act(() => {
      activeController.emitLayerClick("uw-parcels-fill", { pin: "A" });
    });

    expect(window.location.search).toBe("?id=A");
    expect(pushStateSpy).toHaveBeenCalledTimes(1);
    expect(activeController.setFeatureState).toHaveBeenCalledWith(
      { source: "uw-parcels", sourceLayer: undefined, id: "A" },
      { selected: true },
    );
    expect(screen.getByText("Campus Lofts A")).toBeInTheDocument();
    expect(screen.getByText("ID: A")).toBeInTheDocument();
    expect(activeController.flyTo).not.toHaveBeenCalled();

    // Repeated click on the same polygon must not push a duplicate history entry or move camera
    act(() => {
      activeController.emitLayerClick("uw-parcels-fill", { pin: "A" });
    });
    expect(pushStateSpy).toHaveBeenCalledTimes(1);
    expect(activeController.flyTo).not.toHaveBeenCalled();
  });

  it("removes ?id= via pushState when clicking Clear selection, clears feature-state, and does not move camera", async () => {
    const user = userEvent.setup();
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    window.history.replaceState(null, "", "/wamap?layer=parcels");

    renderExplorer();

    act(() => {
      activeController.emitLayerClick("uw-parcels-fill", { pin: "A" });
    });
    expect(window.location.search).toBe("?layer=parcels&id=A");
    expect(screen.getByText("Campus Lofts A")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear selection/i }));

    // Preserves unrelated query params while removing `id`
    expect(window.location.search).toBe("?layer=parcels");
    expect(pushStateSpy).toHaveBeenCalledTimes(2);
    expect(activeController.removeFeatureState).toHaveBeenCalledWith(
      { source: "uw-parcels", sourceLayer: undefined, id: "A" },
      "selected",
    );
    expect(screen.getByText("No Property Selected")).toBeInTheDocument();
    expect(activeController.flyTo).not.toHaveBeenCalled();
  });

  it("hydrates selectedId from ?id= on initial GeoJSON load and calls flyTo once without pushing duplicate history", async () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    window.history.replaceState(null, "", "/wamap?id=A");

    renderExplorer(GEOJSON_POLYGON_PROPS);

    await waitFor(() => {
      expect(screen.getByText("Campus Lofts A")).toBeInTheDocument();
    });

    expect(pushStateSpy).not.toHaveBeenCalled();
    expect(activeController.setFeatureState).toHaveBeenCalledWith(
      { source: "uw-parcels", sourceLayer: undefined, id: "A" },
      { selected: true },
    );
    expect(activeController.flyTo).toHaveBeenCalledTimes(1);
    expect(activeController.flyTo).toHaveBeenCalledWith({
      center: [-122.3125, 47.6605],
      zoom: 17,
      duration: 2000,
    });
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("hydrates selectedId from ?id= on initial Vector load, waits for Apollo GET_REONOMY_PROPERTY, and flies to resolved coordinates", async () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    window.history.replaceState(null, "", "/map?id=1000010001");

    const mocks: MockedResponse[] = [
      {
        request: {
          query: GET_REONOMY_PROPERTY,
          variables: { parcel_id: "1000010001" },
        },
        result: {
          data: {
            reonomyProperties: {
              items: [
                {
                  parcel_id: "1000010001",
                  address_line1: "350 5th Ave",
                  city: "New York",
                  zip5: "10118",
                  neighborhood_name: "Midtown",
                  asset_type: "Commercial Office",
                  building_area: 2248355,
                  lot_size_sqft: 91351,
                  total_units: 102,
                  floors: 102,
                  lat: 40.7484,
                  lon: -73.9857,
                  year_built: 1931,
                  reonomyPropertySale: { items: [] },
                },
              ],
            },
          },
        },
      },
    ];

    renderExplorer(VECTOR_POLYGON_PROPS, mocks);

    await waitFor(() => {
      expect(screen.getByText("350 5th Ave")).toBeInTheDocument();
    });

    expect(pushStateSpy).not.toHaveBeenCalled();
    expect(activeController.setFeatureState).toHaveBeenCalledWith(
      {
        source: "property-boundaries",
        sourceLayer: "attom-parcels",
        id: "1000010001",
      },
      { selected: true },
    );
    expect(activeController.flyTo).toHaveBeenCalledTimes(1);
    expect(activeController.flyTo).toHaveBeenCalledWith({
      center: [-73.9857, 40.7484],
      zoom: 17,
      duration: 2000,
    });
  });

  it("survives early sourcedata events for unrelated sources (mapbox-terrain) and highlights initial ?id= once parcel source loads", async () => {
    window.history.replaceState(null, "", "/wamap?id=B");
    // Simulate initial mount before parcel source is registered on the Mapbox style
    activeController = createMockMapController({
      styleLoaded: false,
      registeredSources: [],
    });

    renderExplorer(GEOJSON_POLYGON_PROPS);

    expect(activeController.setFeatureState).not.toHaveBeenCalled();

    // 1st sourcedata fires for "mapbox-terrain" while "uw-parcels" is still undefined
    act(() => {
      activeController.registerSource("mapbox-terrain");
      activeController.emit("sourcedata", { sourceId: "mapbox-terrain" });
    });

    expect(activeController.setFeatureState).not.toHaveBeenCalled();

    // 2nd sourcedata fires once "uw-parcels" registers -> listener is still active and applies highlight!
    act(() => {
      activeController.setStyleLoaded(true);
      activeController.registerSource("uw-parcels");
      activeController.emit("sourcedata", {
        sourceId: "uw-parcels",
        isSourceLoaded: true,
      });
    });

    expect(activeController.setFeatureState).toHaveBeenCalledTimes(1);
    expect(activeController.setFeatureState).toHaveBeenCalledWith(
      { source: "uw-parcels", sourceLayer: undefined, id: "B" },
      { selected: true },
    );
  });

  it("keeps camera at initialView, shows fallback card, and displays warning toast when ?id= is unresolvable or lacks coordinates", async () => {
    window.history.replaceState(null, "", "/wamap?id=NONEXISTENT_PIN");

    const { unmount } = renderExplorer(GEOJSON_POLYGON_PROPS);

    await waitFor(() => {
      expect(screen.getByText("No data for this parcel")).toBeInTheDocument();
    });

    expect(screen.getByText("NONEXISTENT_PIN")).toBeInTheDocument();
    expect(activeController.flyTo).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledWith(
      "Parcel not found",
      expect.objectContaining({
        description: expect.stringContaining("NONEXISTENT_PIN"),
      }),
    );

    unmount();
    vi.clearAllMocks();

    // Also verify GeoJSON feature whose centroid coordinates fell back to 0, 0
    window.history.replaceState(null, "", "/wamap?id=ZERO_COORDS");
    renderExplorer(GEOJSON_POLYGON_PROPS);

    await waitFor(() => {
      expect(screen.getByText("Missing Centroid Parcel")).toBeInTheDocument();
    });

    expect(activeController.flyTo).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledWith(
      "Parcel location unavailable",
      expect.objectContaining({
        description: expect.stringContaining("ZERO_COORDS"),
      }),
    );
  });

  it("updates URL to ?id=<parcel_id> and triggers flyTo when selecting an address from SearchBar", async () => {
    const user = userEvent.setup();
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    window.history.replaceState(null, "", "/map");

    const mocks: MockedResponse[] = [
      {
        request: {
          query: GET_PROPERTY_BY_ADDRESS,
          variables: { prefix: "500" },
        },
        result: {
          data: {
            reonomyProperties: {
              items: [
                {
                  parcel_id: "100123",
                  address_line1: "500 5TH AVE",
                  lat: 40.753,
                  lon: -73.981,
                },
              ],
            },
          },
        },
      },
      {
        request: {
          query: GET_REONOMY_PROPERTY,
          variables: { parcel_id: "100123" },
        },
        result: {
          data: {
            reonomyProperties: {
              items: [
                {
                  parcel_id: "100123",
                  address_line1: "500 5TH AVE",
                  city: "New York",
                  zip5: "10110",
                  neighborhood_name: "Midtown",
                  asset_type: "Office",
                  building_area: 650000,
                  lot_size_sqft: 20000,
                  total_units: 40,
                  floors: 60,
                  lat: 40.753,
                  lon: -73.981,
                  year_built: 1931,
                  reonomyPropertySale: { items: [] },
                },
              ],
            },
          },
        },
      },
    ];

    renderExplorer(VECTOR_POLYGON_PROPS, mocks);

    const searchInput = screen.getByRole("combobox");
    await user.type(searchInput, "500");

    // Wait for 300ms address search debounce + Apollo query response
    const option = await screen.findByText("500 5TH AVE");
    await user.click(option);

    expect(window.location.search).toBe("?id=100123");
    expect(pushStateSpy).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(activeController.flyTo).toHaveBeenCalledTimes(1);
    });
    expect(activeController.flyTo).toHaveBeenCalledWith({
      center: [-73.981, 40.753],
      zoom: 17,
      duration: 2000,
    });
  });

  it("debounces rapid popstate Back/Forward navigation by 300ms and clears selection without flyTo when returning to URL without ?id=", () => {
    vi.useFakeTimers();
    renderExplorer(GEOJSON_POLYGON_PROPS);

    // Click parcels A -> B -> C -> D (camera remains stationary during clicks)
    for (const pin of ["A", "B", "C", "D"]) {
      act(() => {
        activeController.emitLayerClick("uw-parcels-fill", { pin });
      });
    }
    expect(window.location.search).toBe("?id=D");
    expect(screen.getByText("Tower D")).toBeInTheDocument();
    expect(activeController.flyTo).not.toHaveBeenCalled();

    // Rapidly press Back 3 times within 200ms: D -> C -> B -> A
    act(() => {
      window.history.replaceState(null, "", "/wamap?id=C");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    act(() => {
      vi.advanceTimersByTime(80);
    });

    act(() => {
      window.history.replaceState(null, "", "/wamap?id=B");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    act(() => {
      vi.advanceTimersByTime(80);
    });

    act(() => {
      window.history.replaceState(null, "", "/wamap?id=A");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    act(() => {
      vi.advanceTimersByTime(299);
    });

    // Before 300ms quiet window completes, intermediate parcels C & B were cancelled and flyTo has not run
    expect(screen.getByText("Tower D")).toBeInTheDocument();
    expect(activeController.flyTo).not.toHaveBeenCalled();

    // Complete the 300ms debounce window
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByText("Campus Lofts A")).toBeInTheDocument();
    expect(activeController.flyTo).toHaveBeenCalledTimes(1);
    expect(activeController.flyTo).toHaveBeenCalledWith({
      center: [-122.3125, 47.6605],
      zoom: 17,
      duration: 2000,
    });

    // Navigating Back to "/wamap" (no ?id=) clears selection without moving camera or showing toast
    activeController.flyTo.mockClear();
    act(() => {
      window.history.replaceState(null, "", "/wamap");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText("No Property Selected")).toBeInTheDocument();
    expect(activeController.flyTo).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("defers initial-load flyTo until Mapbox fires onLoad", () => {
    window.history.replaceState(null, "", "/wamap?id=A");
    activeController = createMockMapController({
      styleLoaded: false,
      autoLoad: false,
      registeredSources: ["uw-parcels"],
      registeredLayers: ["uw-parcels-fill"],
    });

    renderExplorer(GEOJSON_POLYGON_PROPS);

    expect(screen.getByText("Campus Lofts A")).toBeInTheDocument();
    expect(activeController.flyTo).not.toHaveBeenCalled();

    act(() => {
      activeController.setStyleLoaded(true);
      activeController.triggerLoad();
    });

    expect(activeController.flyTo).toHaveBeenCalledTimes(1);
    expect(activeController.flyTo).toHaveBeenCalledWith({
      center: [-122.3125, 47.6605],
      zoom: 17,
      duration: 2000,
    });
  });

  it("cancels a pending popstate debounce timer if the user clicks a polygon before 300ms elapses", () => {
    vi.useFakeTimers();
    renderExplorer(GEOJSON_POLYGON_PROPS);

    act(() => {
      activeController.emitLayerClick("uw-parcels-fill", { pin: "D" });
    });
    expect(screen.getByText("Tower D")).toBeInTheDocument();

    // Start popstate navigation toward A, then click C after 150ms
    act(() => {
      window.history.replaceState(null, "", "/wamap?id=A");
      window.dispatchEvent(new PopStateEvent("popstate"));
      vi.advanceTimersByTime(150);

      activeController.emitLayerClick("uw-parcels-fill", { pin: "C" });
      vi.advanceTimersByTime(300);
    });

    // Stale popstate timer for A was cancelled; selection stays on C with no flyTo
    expect(window.location.search).toBe("?id=C");
    expect(screen.getByText("Corner Plaza C")).toBeInTheDocument();
    expect(activeController.flyTo).not.toHaveBeenCalled();
  });
});
