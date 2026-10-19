'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

interface PropertyPinProps {
  id: string;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick: () => void;
}

export const PropertyPin = React.memo(function PropertyPin({
  id,
  isSelected,
  onClick,
}: PropertyPinProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full shadow-md transition-all cursor-pointer border ${
        isSelected
          ? 'bg-amber-500 text-white scale-110 border-white ring-2 ring-amber-400'
          : 'bg-primary text-primary-foreground hover:scale-105 border-white'
      }`}
    >
      <MapPin className="size-3" />
      <span>{id}</span>
    </button>
  );
});