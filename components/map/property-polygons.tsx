"use client";

import { useState, useEffect } from "react";
import {
  Source,
  Layer,
  useMap,
  type MapMouseEvent,
} from "react-map-gl/mapbox";

export interface PropertyPolygonsProps {
  sourceId?: string;
  sourceUrl?: string;
  sourceLayer?: string;
  idProperty?: string;
  fillLayerId?: string;
  lineLayerId?: string;
  hoverId?: string | null;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onHover?: (id: string | null) => void;
  visible?: boolean;
  minzoom?: number;
  maxzoom?: number;
}

export function PropertyPolygons({
  sourceId,
  sourceUrl,
  sourceLayer,
  idProperty = "id",
  fillLayerId = `${sourceId}-fill`,
  lineLayerId = `${sourceId}-line`,
  visible = true,
  minzoom = 11,
  maxzoom = 18,
  selectedId: externalSelectedId,
  hoverId: externalHoverId,
  onSelect,
  onHover,
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

  useEffect(() => {
    if (!map || !visible || !sourceUrl || !sourceLayer || !fillLayerId) return;

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
    sourceUrl,
    sourceLayer,
    fillLayerId,
    idProperty,
    isSelectedControlled,
    isHoverControlled,
    onSelect,
    onHover,
  ]);

  if (!visible || !sourceUrl || !sourceLayer) return null;
  return (
    <Source id={sourceId} type="vector" url={sourceUrl}>
      <Layer
        id={fillLayerId}
        source-layer={sourceLayer}
        type="fill"
        minzoom={minzoom}
        maxzoom={maxzoom}
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
      <Layer
        id={lineLayerId}
        source-layer={sourceLayer}
        type="line"
        minzoom={minzoom}
        maxzoom={maxzoom}
        paint={{
          "line-color": "#000000",
          "line-width": 1,
          "line-opacity": 0.5,
        }}
      />
    </Source>
  );
}
