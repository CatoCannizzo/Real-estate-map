import React, { createContext, useContext } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import { PropertyPolygons } from "@/components/map/property-polygons";
import { GET_YEAR_BUILT_BY_IDS } from "@/lib/graphql/queries";

const mockApolloQuery = vi.fn();

vi.mock("@/lib/apollo", () => ({
  client: {
    query: (...args: unknown[]) => mockApolloQuery(...args),
  },
}));

type ListenerFn = (...args: unknown[]) => void;

interface MockMapControllerOptions {
  styleLoaded?: boolean;
  registeredSources?: string[];
  registeredLayers?: string[];
}

function createMockMapController(options: MockMapControllerOptions = {}) {
  let styleLoaded = options.styleLoaded ?? true;
  const sources = new Set<string>(options.registeredSources ?? []);
  const layers = new Set<string>(options.registeredLayers ?? []);
  const globalListeners = new Map<string, Set<ListenerFn>>();
  const onceWrappers = new WeakMap<ListenerFn, ListenerFn>();
  const canvasStyle = { cursor: "" };

  const on = vi.fn(
    (
      event: string,
      layerOrHandler: string | ListenerFn,
      maybeHandler?: ListenerFn,
    ) => {
      if (typeof layerOrHandler === "function") {
        if (!globalListeners.has(event)) {
          globalListeners.set(event, new Set());
        }
        globalListeners.get(event)!.add(layerOrHandler);
      } else if (maybeHandler) {
        const key = `${event}:${layerOrHandler}`;
        if (!globalListeners.has(key)) {
          globalListeners.set(key, new Set());
        }
        globalListeners.get(key)!.add(maybeHandler);
      }
    },
  );

  const off = vi.fn(
    (
      event: string,
      layerOrHandler: string | ListenerFn,
      maybeHandler?: ListenerFn,
    ) => {
      if (typeof layerOrHandler === "function") {
        const set = globalListeners.get(event);
        if (!set) return;
        set.delete(layerOrHandler);
        const wrapped = onceWrappers.get(layerOrHandler);
        if (wrapped) {
          set.delete(wrapped);
        }
      } else if (maybeHandler) {
        globalListeners.get(`${event}:${layerOrHandler}`)?.delete(maybeHandler);
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
  const queryRenderedFeatures = vi.fn<
    () => Array<{ properties: Record<string, unknown> }>
  >(() => []);
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
    queryRenderedFeatures,
    isStyleLoaded,
    getSource,
    getLayer,
    getCanvas,
  };

  return {
    mapInstance,
    on,
    off,
    once,
    setFeatureState,
    removeFeatureState,
    queryRenderedFeatures,
    isStyleLoaded,
    getSource,
    getLayer,
    setStyleLoaded(next: boolean) {
      styleLoaded = next;
    },
    registerSource(sourceId: string) {
      sources.add(sourceId);
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
  };
}

type MockMapController = ReturnType<typeof createMockMapController>;

let activeController: MockMapController;

vi.mock("react-map-gl/mapbox", () => {
  const MapContext = createContext<{
    current: MockMapController["mapInstance"] | null;
  }>({
    current: null,
  });

  return {
    useMap: () => ({ current: activeController.mapInstance }),
    Source: ({ id, children }: { id: string; children?: React.ReactNode }) => (
      <div data-testid={`mapbox-source-${id}`}>{children}</div>
    ),
    Layer: ({ id }: { id: string }) => <div data-testid={`mapbox-layer-${id}`} />,
    MapProvider: MapContext.Provider,
    useMapContext: () => useContext(MapContext),
  };
});

const VECTOR_PROPS = {
  sourceType: "vector" as const,
  sourceId: "property-boundaries",
  sourceUrl: "mapbox://svayser.parcel-boundaries",
  sourceLayer: "attom-parcels",
  idProperty: "ID",
};

function makeFeatures(ids: string[]) {
  return ids.map((id) => ({ properties: { ID: id } }));
}

describe("PropertyPolygons — Async & Mapbox Event Race Conditions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeController = createMockMapController({
      styleLoaded: true,
      registeredSources: ["property-boundaries"],
      registeredLayers: ["property-boundaries-fill"],
    });
  });

  it("aborts remaining stale 50-parcel chunks when moveend pans the map mid-fetch", async () => {
    const viewport1Ids = Array.from({ length: 60 }, (_, idx) => `V1_${idx + 1}`);
    const viewport2Ids = ["V2_1", "V2_2"];

    activeController.queryRenderedFeatures
      .mockReturnValueOnce(makeFeatures(viewport1Ids))
      .mockReturnValueOnce(makeFeatures(viewport2Ids));

    const deferredChunk1 = Promise.withResolvers<{
      data: { reonomyProperties: { items: Array<{ parcel_id: string; year_built: number }> } };
    }>();
    const deferredViewport2 = Promise.withResolvers<{
      data: { reonomyProperties: { items: Array<{ parcel_id: string; year_built: number }> } };
    }>();

    mockApolloQuery
      .mockReturnValueOnce(deferredChunk1.promise)
      .mockReturnValueOnce(deferredViewport2.promise);

    render(<PropertyPolygons {...VECTOR_PROPS} colorByYearBuilt={true} />);

    // Viewport 1 requested its first 50-parcel chunk; chunk 2 (10 parcels) waits for chunk 1
    expect(mockApolloQuery).toHaveBeenCalledTimes(1);
    expect(mockApolloQuery).toHaveBeenNthCalledWith(1, {
      query: GET_YEAR_BUILT_BY_IDS,
      variables: { ids: viewport1Ids.slice(0, 50) },
      fetchPolicy: "cache-first",
    });

    // User pans before chunk 1 resolves -> fires moveend for viewport 2
    act(() => {
      activeController.emit("moveend");
    });

    expect(mockApolloQuery).toHaveBeenCalledTimes(2);
    expect(mockApolloQuery).toHaveBeenNthCalledWith(2, {
      query: GET_YEAR_BUILT_BY_IDS,
      variables: { ids: viewport2Ids },
      fetchPolicy: "cache-first",
    });

    // Resolve viewport 2 and then resolve stale viewport 1 chunk 1
    await act(async () => {
      deferredViewport2.resolve({
        data: {
          reonomyProperties: {
            items: [{ parcel_id: "V2_1", year_built: 2020 }],
          },
        },
      });
      await deferredViewport2.promise;
    });

    await act(async () => {
      deferredChunk1.resolve({
        data: {
          reonomyProperties: {
            items: [{ parcel_id: "V1_1", year_built: 1920 }],
          },
        },
      });
      await deferredChunk1.promise;
    });

    // Stale viewport 1 chunk 2 (V1_51..V1_60) must never be queried
    expect(mockApolloQuery).toHaveBeenCalledTimes(2);
    expect(activeController.setFeatureState).toHaveBeenCalledWith(
      {
        source: "property-boundaries",
        sourceLayer: "attom-parcels",
        id: "V2_1",
      },
      { yearBuilt: 2020 },
    );
  });

  it("cancels in-flight yearBuilt chunks when colorByYearBuilt is toggled off or component unmounts mid-fetch", async () => {
    const viewportIds = Array.from({ length: 60 }, (_, idx) => `TOGGLE_${idx + 1}`);
    activeController.queryRenderedFeatures.mockReturnValue(makeFeatures(viewportIds));

    const deferredChunk1 = Promise.withResolvers<{
      data: { reonomyProperties: { items: Array<{ parcel_id: string; year_built: number }> } };
    }>();
    mockApolloQuery.mockReturnValueOnce(deferredChunk1.promise);

    const { rerender, unmount } = render(
      <PropertyPolygons {...VECTOR_PROPS} colorByYearBuilt={true} />,
    );
    expect(mockApolloQuery).toHaveBeenCalledTimes(1);

    // Toggle choropleth off while chunk 1 is still in flight
    rerender(<PropertyPolygons {...VECTOR_PROPS} colorByYearBuilt={false} />);

    await act(async () => {
      deferredChunk1.resolve({
        data: {
          reonomyProperties: {
            items: [{ parcel_id: "TOGGLE_1", year_built: 1955 }],
          },
        },
      });
      await deferredChunk1.promise;
    });

    // Neither stale setFeatureState nor chunk 2 query should execute after toggling off
    expect(mockApolloQuery).toHaveBeenCalledTimes(1);
    expect(activeController.setFeatureState).not.toHaveBeenCalled();

    // Also verify unmounting mid-fetch suppresses late setFeatureState
    vi.clearAllMocks();
    const deferredSingle = Promise.withResolvers<{
      data: { reonomyProperties: { items: Array<{ parcel_id: string; year_built: number }> } };
    }>();
    activeController.queryRenderedFeatures.mockReturnValue(makeFeatures(["UNMOUNT_1"]));
    mockApolloQuery.mockReturnValueOnce(deferredSingle.promise);

    rerender(<PropertyPolygons {...VECTOR_PROPS} colorByYearBuilt={true} />);
    expect(mockApolloQuery).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      deferredSingle.resolve({
        data: {
          reonomyProperties: {
            items: [{ parcel_id: "UNMOUNT_1", year_built: 1980 }],
          },
        },
      });
      await deferredSingle.promise;
    });

    expect(activeController.setFeatureState).not.toHaveBeenCalled();
  });

  it("defers yearBuilt fetch to idle when initial queryRenderedFeatures returns empty", async () => {
    activeController.queryRenderedFeatures
      .mockReturnValueOnce([])
      .mockReturnValueOnce(makeFeatures(["P_10"]));

    mockApolloQuery.mockResolvedValueOnce({
      data: {
        reonomyProperties: {
          items: [{ parcel_id: "P_10", year_built: 1995 }],
        },
      },
    });

    render(<PropertyPolygons {...VECTOR_PROPS} colorByYearBuilt={true} />);

    // Tiles not painted yet -> no GraphQL query fired on initial pass, waits for idle
    expect(mockApolloQuery).not.toHaveBeenCalled();
    expect(activeController.once).toHaveBeenCalledWith("idle", expect.any(Function));

    await act(async () => {
      activeController.emit("idle");
    });

    await waitFor(() => {
      expect(mockApolloQuery).toHaveBeenCalledTimes(1);
    });

    expect(mockApolloQuery).toHaveBeenCalledWith({
      query: GET_YEAR_BUILT_BY_IDS,
      variables: { ids: ["P_10"] },
      fetchPolicy: "cache-first",
    });
    expect(activeController.setFeatureState).toHaveBeenCalledWith(
      {
        source: "property-boundaries",
        sourceLayer: "attom-parcels",
        id: "P_10",
      },
      { yearBuilt: 1995 },
    );
  });

  it("re-asserts selected feature-state only when vector tiles finish loading for the target sourceId", () => {
    const { rerender } = render(
      <PropertyPolygons {...VECTOR_PROPS} selectedId="1001" />,
    );

    expect(activeController.setFeatureState).toHaveBeenCalledTimes(1);
    expect(activeController.setFeatureState).toHaveBeenCalledWith(
      {
        source: "property-boundaries",
        sourceLayer: "attom-parcels",
        id: "1001",
      },
      { selected: true },
    );

    activeController.setFeatureState.mockClear();

    // Unrelated source or unloaded source event must be ignored
    act(() => {
      activeController.emit("sourcedata", {
        sourceId: "mapbox-terrain",
        isSourceLoaded: true,
      });
      activeController.emit("sourcedata", {
        sourceId: "property-boundaries",
        isSourceLoaded: false,
      });
    });
    expect(activeController.setFeatureState).not.toHaveBeenCalled();

    // Streaming in a new vector tile after flyTo re-asserts selected feature-state
    act(() => {
      activeController.emit("sourcedata", {
        sourceId: "property-boundaries",
        isSourceLoaded: true,
      });
    });
    expect(activeController.setFeatureState).toHaveBeenCalledTimes(1);
    expect(activeController.setFeatureState).toHaveBeenCalledWith(
      {
        source: "property-boundaries",
        sourceLayer: "attom-parcels",
        id: "1001",
      },
      { selected: true },
    );

    // Clearing selection detaches re-assertion and clears previous feature-state
    activeController.setFeatureState.mockClear();
    rerender(<PropertyPolygons {...VECTOR_PROPS} selectedId={null} />);

    expect(activeController.removeFeatureState).toHaveBeenCalledWith(
      {
        source: "property-boundaries",
        sourceLayer: "attom-parcels",
        id: "1001",
      },
      "selected",
    );

    act(() => {
      activeController.emit("sourcedata", {
        sourceId: "property-boundaries",
        isSourceLoaded: true,
      });
    });
    expect(activeController.setFeatureState).not.toHaveBeenCalled();
  });
});
