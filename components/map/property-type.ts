export interface PropertySale {
  salesId: string;
  recordingDate?: string | null;
  saleAmount?: number | null;
  pricePerBuildingArea?: number | null;
  documentType?: string | null;
}

export interface Property {
  id: string;
  latitude: number;
  longitude: number;

  // Address & Location
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  neighborhood?: string;

  // Building & Lot Characteristics
  propertyName?: string;
  propertyType?: string;
  yearBuilt?: number | null;
  buildingSqFt?: number | null;
  landSqFt?: number | null;
  totalUnits?: number | null;
  stories?: number | null;

  // Valuation & Financials
  price?: number;
  assessedLandValue?: number | null;
  assessedBuildingValue?: number | null;
  assessedTotalValue?: number | null;

  // Zoning & Development Potential

  developmentStatus?: string;

  // Residential / Legacy Pin Fields
  beds?: number;
  baths?: number;

  // External Links & Sales History
  assessorUrl?: string;
  salesHistory?: PropertySale[];
}
