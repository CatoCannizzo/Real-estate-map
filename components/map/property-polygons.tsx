"use client";

import { useEffect, useRef } from "react";
import { Source, Layer, useMap, type MapMouseEvent } from "react-map-gl/mapbox";
import type { FeatureCollection } from "geojson";

interface BasePolygonProps {
  /** Unique identifier passed to the Mapbox `<Source>`. */
  sourceId: string;
  /** what the source calls uids for each property */
  idProperty?: string;
  fillLayerId?: string; // what to call the fill layer if applicable
  lineLayerId?: string; // what to call the line layer if applicable
  onSelect?: (id: string | null) => void;
  onHover?: (id: string | null) => void;
  visible?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

export interface VectorPolygonProps extends BasePolygonProps {
  sourceType: "vector";
  sourceUrl: string;
  sourceLayer: string;
}

export interface GeoJsonPolygonProps extends BasePolygonProps {
  sourceType: "geojson";
  data: FeatureCollection | string;
}

export type PropertyPolygonsProps = VectorPolygonProps | GeoJsonPolygonProps;

/**
 * Renders interactive parcel boundary polygons (fill + outline layers) on a Mapbox map.
 *
 * @remarks
 * - **Uncontrolled Highlight State:** Hover and selection styling are managed
 *    via Mapbox `feature-state`
 *   and internal refs rather than React state to avoid re-serializing layer paint properties.
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
  onSelect,
  onHover,
  ...props
}: PropertyPolygonsProps) {
  const { current: map } = useMap();
  const selectedIdRef = useRef<string | null>(null);
  const hoverIdRef = useRef<string | null>(null);

  const isSourceValid =
    props.sourceType === "vector"
      ? Boolean(props.sourceUrl && props.sourceLayer)
      : Boolean(props.data);
  const sourceLayer =
    props.sourceType === "vector" ? props.sourceLayer : undefined;

  useEffect(() => {
    if (!map || !visible || !isSourceValid || !fillLayerId) return;
    const handleClick = (e: MapMouseEvent) => {
      const feature = e.features?.[0] as
        | { properties?: Record<string, unknown> }
        | undefined;
      if (feature && feature.properties?.[idProperty] !== undefined) {
        const clickedId = String(feature.properties[idProperty]);
        if (selectedIdRef.current !== null) {
          map.removeFeatureState(
            { source: sourceId, sourceLayer, id: selectedIdRef.current },
            "selected",
          );
        }
        selectedIdRef.current = clickedId;
        map.setFeatureState(
          { source: sourceId, sourceLayer, id: clickedId },
          { selected: true },
        );
        onSelect?.(clickedId);
      }
    };

    const handleMouseMove = (e: MapMouseEvent) => {
      const feature = e.features?.[0] as
        | { properties?: Record<string, unknown> }
        | undefined;
      const hoveredId =
        feature && feature.properties?.[idProperty] !== undefined
          ? String(feature.properties[idProperty])
          : null;
      if (hoverIdRef.current === hoveredId) return;
      if (hoverIdRef.current !== null) {
        map.removeFeatureState(
          { source: sourceId, sourceLayer, id: hoverIdRef.current },
          "hover",
        );
      }
      hoverIdRef.current = hoveredId;
      if (hoverIdRef.current !== null) {
        map.setFeatureState(
          { source: sourceId, sourceLayer, id: hoverIdRef.current },
          { hover: true },
        );
      }

      onHover?.(hoveredId);
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

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

    map.on("click", fillLayerId, handleClick);
    map.on("mousemove", fillLayerId, handleMouseMove);
    map.on("mouseenter", fillLayerId, handleMouseEnter);
    map.on("mouseleave", fillLayerId, handleMouseLeave);

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

  if (!visible || !isSourceValid) return null;

  const outlineLayer = (
    <Layer
      id={lineLayerId}
      // Geojson source does not have a source layer, so we only include the key for vector tile sources
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

  const fillLayer = (
    <Layer
      id={fillLayerId}
      // Geojson source does not have a source layer, so we only include the key for vector tile sources
      {...(sourceLayer && { "source-layer": sourceLayer })}
      type="fill"
      minzoom={minZoom}
      maxzoom={maxZoom}
      // Paint uses feature-state to determine fill color for selected property
      paint={{
        "fill-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          "#ff641c",
          ["boolean", ["feature-state", "hover"], false],
          "#ffdd1c",
          "#fff098",
        ],
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
