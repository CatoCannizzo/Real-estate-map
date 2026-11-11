"use client";

import { useState, useEffect } from "react";
import { Source, Layer, useMap, type MapMouseEvent } from "react-map-gl/mapbox";
import type { FeatureCollection } from "geojson";

interface BasePolygonProps {
  sourceId: string; // unique name to pass to mapbox
  idProperty?: string; // what the source calls uids for each property
  fillLayerId?: string; // what to call the fill layer if applicable
  lineLayerId?: string; // what to call the line layer if applicable
  hoverId?: string | null;
  selectedId?: string | null;
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

export function PropertyPolygons({
  sourceId,
  idProperty = "id",
  fillLayerId = `${sourceId}-fill`,
  lineLayerId = `${sourceId}-line`,
  visible = true,
  minZoom = 11,
  maxZoom = 18,
  selectedId: externalSelectedId,
  hoverId: externalHoverId,
  onSelect,
  onHover,
  ...props
}: PropertyPolygonsProps) {
  const { current: map } = useMap();
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    null,
  );
  const [internalHoverId, setInternalHoverId] = useState<string | null>(null);

  const isSelectedControlled = externalSelectedId !== undefined;
  const isHoverControlled = externalHoverId !== undefined;

  const activeSelectedId = isSelectedControlled
    ? externalSelectedId
    : internalSelectedId;
  const activeHoverId = isHoverControlled ? externalHoverId : internalHoverId;

  const isSourceValid =
    props.sourceType === "vector"
      ? Boolean(props.sourceUrl && props.sourceLayer)
      : Boolean(props.data);

  useEffect(() => {
    if (!map || !visible || !isSourceValid || !fillLayerId) return;
    const handleClick = (e: MapMouseEvent) => {
      const feature = e.features?.[0] as
        | { properties?: Record<string, unknown> }
        | undefined;
      if (feature && feature.properties?.[idProperty] !== undefined) {
        const clickedId = String(feature.properties[idProperty]);
        if (!isSelectedControlled) {
          setInternalSelectedId(clickedId);
        }
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
      if (!isHoverControlled) {
        setInternalHoverId(hoveredId);
      }
      onHover?.(hoveredId);
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      if (!isHoverControlled) {
        setInternalHoverId(null);
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
    visible,
    fillLayerId,
    idProperty,
    isSelectedControlled,
    isHoverControlled,
    onSelect,
    onHover,
    isSourceValid,
  ]);

  if (!visible || !isSourceValid) return null;

  const outlineLayer = (
    <Layer
      id={lineLayerId}
      // Geojson source does not have a source layer, so we only include the key for vector tile sources
      {...("sourceLayer" in props && { "source-layer": props.sourceLayer })}
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
      {...("sourceLayer" in props && { "source-layer": props.sourceLayer })}
      type="fill"
      minzoom={minZoom}
      maxzoom={maxZoom}
      // Paint uses activeSelectedId to determine fill color for selected property
      paint={{
        "fill-color": [
          "case",
          ["==", ["to-string", ["get", idProperty]], activeSelectedId ?? ""],
          "#ff641c",
          ["==", ["to-string", ["get", idProperty]], activeHoverId ?? ""],
          "#ffdd1c",
          "#fff098",
        ],
        "fill-opacity": [
          "case",
          ["==", ["to-string", ["get", idProperty]], activeSelectedId ?? ""],
          0.8,
          ["==", ["to-string", ["get", idProperty]], activeHoverId ?? ""],
          0.8,
          0.3,
        ],
      }}
    />
  );

  if (props.sourceType === "vector") {
    return (
      <Source id={sourceId} type="vector" url={props.sourceUrl}>
        {fillLayer}
        {outlineLayer}
      </Source>
    );
  }
  if (props.sourceType === "geojson") {
    return (
      <Source id={sourceId} type="geojson" data={props.data}>
        {fillLayer}
        {outlineLayer}
      </Source>
    );
  }
}
