import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Option 2: Geometric Isometric 3D Tower Logo
 * 
 * Recreated with exact pixel-matched geometry from Option 2:
 * - Viewfinder target lock framing: Top-left bracket with waypoint coordinate,
 *   and bottom baseline brackets.
 * - Central volumetric isometric tower.
 * - Change applied: Right-most vertical negative space slit removed,
 *   joining the right wing directly to the central tower structure.
 */
export function HouseLogo({
  size = 36,
  className = "",
  withBackground = false,
  ...props
}: LogoProps & { withBackground?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {withBackground && (
        <rect width="1024" height="1024" fill="#37434f" />
      )}

      {/* --- Viewfinder Framing Reticle --- */}
      <g fill="currentColor">
        {/* Top-Left Bracket (Aligned vertically with Bottom-Left bracket at x=275) */}
        <rect x="275" y="232" width="127" height="8" />
        <rect x="275" y="232" width="8" height="127" />

        {/* Satellite Waypoint Coordinate Dot (Shifted to maintain position inside bracket) */}
        <circle cx="358" cy="314" r="10.5" />

        {/* Top-Right Bracket */}
        <rect x="621" y="232" width="127" height="8" />
        <rect x="740" y="232" width="8" height="113" />

        {/* Bottom-Left Bracket */}
        <rect x="275" y="742" width="116" height="8" />
        <rect x="275" y="637" width="8" height="113" />

        {/* Bottom-Right Bracket */}
        <rect x="632" y="742" width="116" height="8" />
        <rect x="740" y="637" width="8" height="113" />
      </g>

      {/* --- Geometric Isometric 3D Tower --- */}
      <g fill="currentColor">
        {/* Top Diamond Roof */}
        <polygon points="511.5,303 564,336.5 511.5,370.5 459,336.5" />

        {/* Main Tower Left Facet */}
        <polygon points="454,346 507,380 507,470 454,431" />

        {/* Leftmost Pillar Roof Cap */}
        <polygon points="422,405 444,386 444,422" />

        {/* Main Tower Right Facet */}
        <polygon points="516,380 569,346 569,520 516,557" />

        {/* Left Solid Rectangular Block (Unified, Negative Space Removed) */}
        <polygon points="421,417 507,481 507,719 421,667" />

        {/* Right Roof Cap */}
        <polygon points="579,477 602,497 579,513" />

        {/* Bottom-Right Solid Rectangular Cube (Unified, No Internal White Stripe) */}
        <polygon points="516,568 602,510 602,667 516,719" />
      </g>
    </svg>
  );
}

