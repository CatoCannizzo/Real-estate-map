"use client";

import { useEffect, useRef } from "react";
import { Source, Layer, useMap, type MapMouseEvent } from "react-map-gl/mapbox";
import type { ExpressionSpecification } from "mapbox-gl";
import type { FeatureCollection } from "geojson";
import { client } from "@/lib/apollo";
import { GET_YEAR_BUILT_BY_IDS } from "@/lib/graphql/queries";

interface BasePolygonProps {
  /** Unique identifier passed to the Mapbox `<Source>` */
  sourceId: string;
  /** What the source calls uids for each property (e.g. "ID", "pin", or "parcel_id") */
  idProperty?: string;
  /** What to call the fill layer if applicable */
  fillLayerId?: string;
  /** What to call the line layer if applicable */
  lineLayerId?: string;
  /** Controlled selected parcel ID from parent orchestrator */
  selectedId?: string | null;
  /** Callback fired when a parcel polygon is clicked */
  onSelect?: (id: string | null) => void;
  /** Callback fired when the mouse hovers over a parcel polygon */
  onHover?: (id: string | null) => void;
  /** Controls whether the polygon layers are visible on the map */
  visible?: boolean;
  /** Whether to color code parcels by year built (choropleth) or use basic fill */
  colorByYearBuilt?: boolean;
  /** Minimum zoom level before parcel boundaries are rendered */
  minZoom?: number;
  /** Maximum zoom level where parcel boundaries remain rendered */
  maxZoom?: number;
}

export interface VectorPolygonProps extends BasePolygonProps {
  sourceType: "vector";
  /** Mapbox tile URL (e.g. "mapbox://svayser.parcel-boundaries") */
  sourceUrl: string;
  /** Name of the vector layer inside the tileset (e.g. "attom-parcels") */
  sourceLayer: string;
}

export interface GeoJsonPolygonProps extends BasePolygonProps {
  sourceType: "geojson";
  /** Local or remote GeoJSON feature collection or URL */
  data: FeatureCollection | string;
}

/** Union prop type supporting both vector tile streams and static GeoJSON */
export type PropertyPolygonsProps = VectorPolygonProps | GeoJsonPolygonProps;

/**
 * Renders interactive parcel boundary polygons (fill + outline layers) on a Mapbox map.
 *
 * @remarks
 * - **Supports Vector and GeoJSON Sources:** Can render parcels from either a Mapbox vector tile source or a GeoJSON source.
 * - **Performance via Mapbox `feature-state`:** Hover and selection styling are managed
 *   directly in the Mapbox GL engine via `feature-state` and internal refs rather than React state.
 *   This avoids re-serializing layer paint properties across thousands of vector tiles on every mouse move.
 * - **Parent Communication:** Emits the clicked or hovered parcel ID upward via
 *   `onSelect` and `onHover` callbacks.
 *
 * @example
 * ```tsx
 * <PropertyPolygons
 *   sourceType="vector"
 *   sourceId="property-boundaries"
 *   sourceUrl="mapbox://svayser.parcel-boundaries"
 *   sourceLayer="attom-parcels"
 *   idProperty="ID"
 *   onSelect={(id) => setSelectedId(id)}
 * />
 * ```
 */
export function PropertyPolygons({
  sourceId,
  idProperty = "id",
  fillLayerId = `${sourceId}-fill`,
  lineLayerId = `${sourceId}-line`,
  visible = true,
  minZoom = 11,
  maxZoom = 18,
  selectedId,
  colorByYearBuilt = false,
  onSelect,
  onHover,
  ...props
}: PropertyPolygonsProps) {
  // Grab the active Mapbox map instance from react-map-gl context
  const { current: map } = useMap();

  // Internal refs to track the active selection and hover IDs without triggering React re-renders
  const selectedIdRef = useRef<string | null>(null);
  const hoverIdRef = useRef<string | null>(null);
  // Persistent in-memory cache of parcel_id -> yearBuilt (null for no data)
  const yearBuiltCache = useRef<Map<string, number | null>>(new Map());
  const idYearCounter = useRef(0);
  // Validate that required source inputs are present before attempting to render layers
  const isSourceValid =
    props.sourceType === "vector"
      ? Boolean(props.sourceUrl && props.sourceLayer)
      : Boolean(props.data);
  const sourceLayer =
    props.sourceType === "vector" ? props.sourceLayer : undefined;

  // Syncs controlled `selectedId` from parent (e.g. from address search or sidebar close) with Mapbox feature-state
  useEffect(() => {
    if (!map || !visible || !isSourceValid || selectedId === undefined) return;
    if (selectedIdRef.current === selectedId) return;

    // Helper to clear previous selection highlight and set the new one
    const applySelection = (): boolean => {
      if (!map.getSource(sourceId)) return false;

      // Remove selected state from previous parcel if one was selected
      if (selectedIdRef.current !== null) {
        map.removeFeatureState(
          { source: sourceId, sourceLayer, id: selectedIdRef.current },
          "selected",
        );
      }

      selectedIdRef.current = selectedId;

      // Apply selected state to new parcel
      if (selectedId !== null) {
        map.setFeatureState(
          { source: sourceId, sourceLayer, id: selectedId },
          { selected: true },
        );
      }

      return true;
    };

    const handleSourceData = () => {
      if (applySelection()) {
        map.off("sourcedata", handleSourceData);
        map.off("idle", handleSourceData);
      }
    };

    // Re-assert feature-state for vector tiles that stream in after camera flyTo
    const handleVectorTileData = (event: {
      sourceId?: string;
      isSourceLoaded?: boolean;
    }) => {
      if (
        sourceLayer &&
        selectedId !== null &&
        selectedIdRef.current === selectedId &&
        event?.sourceId === sourceId &&
        event?.isSourceLoaded &&
        map.getSource(sourceId)
      ) {
        map.setFeatureState(
          { source: sourceId, sourceLayer, id: selectedId },
          { selected: true },
        );
      }
    };

    // If source is already loaded apply immediately; otherwise keep listening until sourceId registers
    const appliedImmediately =
      map.isStyleLoaded() && Boolean(map.getSource(sourceId))
        ? applySelection()
        : false;

    if (!appliedImmediately) {
      map.on("sourcedata", handleSourceData);
      map.on("idle", handleSourceData);
    }

    if (sourceLayer && selectedId !== null) {
      map.on("sourcedata", handleVectorTileData);
    }

    return () => {
      map.off("sourcedata", handleSourceData);
      map.off("idle", handleSourceData);
      map.off("sourcedata", handleVectorTileData);
    };
  }, [map, sourceId, sourceLayer, visible, isSourceValid, selectedId]);

  // Sets up map mouse listeners for clicking, hovering, and pointer cursor styling on parcels
  useEffect(() => {
    if (!map || !visible || !isSourceValid || !fillLayerId) return;
    // Handles parcel clicks: sets selection feature-state and notifies parent onSelect callback
    const handleClick = (e: MapMouseEvent) => {
      const feature = e.features?.[0] as
        | { properties?: Record<string, unknown> }
        | undefined;

      if (feature && feature.properties?.[idProperty] !== undefined) {
        const clickedId = String(feature.properties[idProperty]);

        // Clear previous selected feature state
        if (selectedIdRef.current !== null) {
          map.removeFeatureState(
            { source: sourceId, sourceLayer, id: selectedIdRef.current },
            "selected",
          );
        }

        selectedIdRef.current = clickedId;

        // Set selected feature state for the newly clicked parcel
        map.setFeatureState(
          { source: sourceId, sourceLayer, id: clickedId },
          { selected: true },
        );

        onSelect?.(clickedId);
      }
    };

    // Handles mouse move over parcels: updates hover feature-state without React state lag
    const handleMouseMove = (e: MapMouseEvent) => {
      const feature = e.features?.[0] as
        | { properties?: Record<string, unknown> }
        | undefined;
      const hoveredId =
        feature && feature.properties?.[idProperty] !== undefined
          ? String(feature.properties[idProperty])
          : null;

      if (hoverIdRef.current === hoveredId) return;

      // Clear previous hover feature-state
      if (hoverIdRef.current !== null) {
        map.removeFeatureState(
          { source: sourceId, sourceLayer, id: hoverIdRef.current },
          "hover",
        );
      }

      hoverIdRef.current = hoveredId;

      // Apply hover feature-state to the new parcel
      if (hoverIdRef.current !== null) {
        map.setFeatureState(
          { source: sourceId, sourceLayer, id: hoverIdRef.current },
          { hover: true },
        );
      }

      onHover?.(hoveredId);
    };

    // Change cursor to pointer when entering a parcel boundary
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    // Reset cursor and clear hover state when mouse leaves the parcel fill layer
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      if (hoverIdRef.current !== null) {
        map.removeFeatureState(
          { source: sourceId, sourceLayer, id: hoverIdRef.current },
          "hover",
        );
        hoverIdRef.current = null;
      }
      onHover?.(null);
    };

    // Attach Mapbox event listeners scoped specifically to the fill layer
    map.on("click", fillLayerId, handleClick);
    map.on("mousemove", fillLayerId, handleMouseMove);
    map.on("mouseenter", fillLayerId, handleMouseEnter);
    map.on("mouseleave", fillLayerId, handleMouseLeave);

    // Cleanup listeners when unmounting or when layer/map dependencies change
    return () => {
      map.off("click", fillLayerId, handleClick);
      map.off("mousemove", fillLayerId, handleMouseMove);
      map.off("mouseenter", fillLayerId, handleMouseEnter);
      map.off("mouseleave", fillLayerId, handleMouseLeave);
    };
  }, [
    map,
    sourceId,
    sourceLayer,
    visible,
    fillLayerId,
    idProperty,
    onSelect,
    onHover,
    isSourceValid,
  ]);
  // Controls the loading of yearbuilt fetching based on 50 parcel chunks and the "moveend" event
  useEffect(() => {
    if (!map || !visible || !isSourceValid || !colorByYearBuilt) return;
    const handleMoveEnd = async () => {
      if (!map.getSource(sourceId) || !map.getLayer(fillLayerId)) {
        map.once("idle", handleMoveEnd);
        return;
      }

      const visiblePolygons = map.queryRenderedFeatures({
        layers: [fillLayerId],
      });

      // If vector tiles haven't finished rendering into the viewport yet, wait for next idle
      if (visiblePolygons.length === 0) {
        map.once("idle", handleMoveEnd);
        return;
      }

      const currentRequest = ++idYearCounter.current;
      const newIds: string[] = [];
      const seenInThisPass = new Set<string>();

      for (const feature of visiblePolygons) {
        const rawId = feature.properties?.[idProperty];
        if (rawId === undefined || rawId === null) continue;
        const id = String(rawId);

        // If we already know the year_built for this parcel, apply it immediately!
        if (yearBuiltCache.current.has(id)) {
          const cachedYear = yearBuiltCache.current.get(id) ?? null;
          if (cachedYear !== null) {
            map.setFeatureState(
              { source: sourceId, sourceLayer, id },
              { yearBuilt: cachedYear },
            );
          }
        } else if (!seenInThisPass.has(id)) {
          seenInThisPass.add(id);
          newIds.push(id);
        }
      }

      if (newIds.length === 0) return;

      // Slices new IDs into chunks of at most 50 to respect GraphQL batch limits
      const CHUNK_SIZE = 50;
      for (let i = 0; i < newIds.length; i += CHUNK_SIZE) {
        // Stop launching new chunk requests if the user panned the map again
        if (currentRequest !== idYearCounter.current) return;

        const chunk = newIds.slice(i, i + CHUNK_SIZE);

        try {
          const res = await client.query({
            query: GET_YEAR_BUILT_BY_IDS,
            variables: { ids: chunk },
            fetchPolicy: "cache-first",
          });

          // Abort before mutating cache or feature-state if viewport panned, toggled off, or unmounted
          if (currentRequest !== idYearCounter.current) return;

          const items = res.data?.reonomyProperties?.items ?? [];
          const returnedIds = new Set<string>();

          // Apply yearBuilt feature-state for parcels returned by Reonomy
          for (const item of items) {
            if (item.parcel_id) {
              returnedIds.add(item.parcel_id);
              const yb = item.year_built ?? null;
              yearBuiltCache.current.set(item.parcel_id, yb);
              if (yb !== null) {
                map.setFeatureState(
                  { source: sourceId, sourceLayer, id: item.parcel_id },
                  { yearBuilt: yb },
                );
              }
            }
          }

          // Mark queried parcels that had no Reonomy record as null in cache so we don't re-fetch them
          for (const id of chunk) {
            if (!returnedIds.has(id)) {
              yearBuiltCache.current.set(id, null);
            }
          }
        } catch (err) {
          console.error("[YearBuilt Fetch Error]:", err);
        }
      }
    };

    if (map.isStyleLoaded()) {
      handleMoveEnd();
    } else {
      map.once("idle", handleMoveEnd);
    }
    map.on("moveend", handleMoveEnd);
    return () => {
      idYearCounter.current += 1;
      map.off("idle", handleMoveEnd);
      map.off("moveend", handleMoveEnd);
    };
  }, [
    map,
    visible,
    isSourceValid,
    colorByYearBuilt,
    fillLayerId,
    sourceId,
    sourceLayer,
    idProperty,
  ]);

  // Don't render anything if toggled hidden or if required source data/URL is missing
  if (!visible || !isSourceValid) return null;

  // Thin black outline layer drawn on top of the parcels for boundary clarity
  const outlineLayer = (
    <Layer
      id={lineLayerId}
      // Geojson sources don't use sourceLayer, so we only pass it for vector tile sources
      {...(sourceLayer && { "source-layer": sourceLayer })}
      type="line"
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{
        "line-color": "#000000",
        "line-width": 1,
        "line-opacity": 0.5,
      }}
    />
  );

  // Default fill styling: Orange when selected, yellow on hover, and light yellow when idle
  const basicColorExpression = [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    "#ff641c",
    ["boolean", ["feature-state", "hover"], false],
    "#ffdd1c",
    "#fff098",
  ];
  // Choropleth fill: colors parcels by year built (1900 light pink -> 2025 dark purple), green when selected
  const yearBuiltColorExpression = [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    "#0be603",
    ["boolean", ["feature-state", "hover"], false],
    "#ffdd1c",
    ["==", ["feature-state", "yearBuilt"], null],
    "#cccccc",
    [
      "interpolate",
      ["linear"],
      ["coalesce", ["feature-state", "yearBuilt"], 1900],
      1900,
      "#fde0dd",
      2025,
      "#7a0177",
    ],
  ];
// Pick between choropleth yearBuilt coloring or the standard 3-color fill scheme
  const fillColor = (colorByYearBuilt
    ? yearBuiltColorExpression
    : basicColorExpression) as unknown as ExpressionSpecification;

  // Fill layer: maps feature-state properties to dynamic GPU paint colors
  const fillLayer = (
    <Layer
      id={fillLayerId}
      // Geojson sources don't use sourceLayer, so we only pass it for vector tile sources
      {...(sourceLayer && { "source-layer": sourceLayer })}
      type="fill"
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{
        "fill-color": fillColor,
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          0.8,
          ["boolean", ["feature-state", "hover"], false],
          0.8,
          0.3,
        ],
      }}
    />
  );

  // Return vector tile source wrapper (promoteId promotes parcel ID to the feature root so feature-state works)
  if (props.sourceType === "vector") {
    return (
      <Source
        id={sourceId}
        type="vector"
        url={props.sourceUrl}
        promoteId={idProperty}
      >
        {fillLayer}
        {outlineLayer}
      </Source>
    );
  }

  // Return GeoJSON source wrapper (promoteId promotes pin/id property for feature-state)
  if (props.sourceType === "geojson") {
    return (
      <Source
        id={sourceId}
        type="geojson"
        data={props.data}
        promoteId={idProperty}
      >
        {fillLayer}
        {outlineLayer}
      </Source>
    );
  }
}
